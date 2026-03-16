import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    // If there is a hash (e.g., #features), don't force scroll to top
    // so the browser can natively jump to the element.
    if (hash) return;

    // Wait a brief moment for the router to render the new page
    const timeout = setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }, 10);

    return () => clearTimeout(timeout);
  }, [pathname, hash]);

  return null;
}
