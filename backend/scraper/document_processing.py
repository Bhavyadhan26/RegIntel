import json
import re
import tempfile
from pathlib import Path

import requests


MAX_SUMMARY_WORDS = 60


def summary_word_count(summary):
    return len(re.findall(r"\S+", (summary or "").strip()))


def validate_summary(summary):
    value = re.sub(r"\s+", " ", (summary or "")).strip()
    if not value or summary_word_count(value) > MAX_SUMMARY_WORDS:
        return None
    if value.lower() in {"n/a", "none", "no summary available", "summary unavailable"}:
        return None
    return value


def extract_due_date(markdown):
    if not markdown:
        return ""
    patterns = [
        r"(?i)(?:due date|deadline|last date|closing date|submission date|submit by)\s*[:\-]?\s*([^\n|;,]{6,40})",
        r"\b(\d{4}-\d{1,2}-\d{1,2})\b",
        r"\b(\d{1,2}[./-]\d{1,2}[./-]\d{2,4})\b",
        r"\b(\d{1,2}(?:st|nd|rd|th)?\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})\b",
    ]
    for pattern in patterns:
        match = re.search(pattern, markdown)
        if match:
            return re.split(r"\s{2,}|[|;]", match.group(1).strip())[0].strip(" .")
    return ""


def parse_provider_response(response_text):
    try:
        payload = json.loads((response_text or "").strip())
    except (TypeError, ValueError):
        return None
    if not isinstance(payload, dict):
        return None
    summary = validate_summary(payload.get("summary"))
    if summary is None:
        return None
    return {"summary": summary, "due_date": str(payload.get("due_date") or "").strip()}


def _convert_pdf(pdf_path):
    from markitdown import MarkItDown

    result = MarkItDown().convert(str(pdf_path))
    return (result.text_content or "").strip()


def _groq_summary(markdown, model, timeout_seconds):
    from groq import Groq

    client = Groq(timeout=timeout_seconds)
    max_input_chars = 12000
    bounded_markdown = markdown[:max_input_chars]
    if len(markdown) > max_input_chars:
        bounded_markdown += "\n\n[Document content truncated for provider input limits.]"
    messages = [
        {
            "role": "system",
            "content": "Use only supplied Markdown. Return strict JSON with summary and due_date. Summary must be factual and no more than 60 words.",
        },
        {"role": "user", "content": bounded_markdown},
    ]
    for attempt in range(2):
        if attempt:
            messages.append(
                {
                    "role": "user",
                    "content": "Correction: return valid JSON only and shorten summary to at most 60 words. Do not add unsupported facts.",
                }
            )
        completion = client.chat.completions.create(
            model=model,
            temperature=0,
            response_format={"type": "json_object"},
            messages=messages,
        )
        result = parse_provider_response(completion.choices[0].message.content)
        if result is not None:
            return result
    return None


def process_pdf_url(pdf_url, model, timeout_seconds=30):
    with tempfile.TemporaryDirectory(prefix="regintel-pdf-") as temp_dir:
        pdf_path = Path(temp_dir) / "source.pdf"
        response = requests.get(pdf_url, timeout=timeout_seconds, verify=False)
        response.raise_for_status()
        pdf_path.write_bytes(response.content)
        markdown = _convert_pdf(pdf_path)
        if not markdown:
            raise ValueError("MarkItDown returned no Markdown content")
        result = _groq_summary(markdown, model, timeout_seconds)
        if result is None:
            raise ValueError("Groq returned invalid or overlong summary JSON")
        if not result["due_date"]:
            result["due_date"] = extract_due_date(markdown)
        return result