const csvRawData = '';

export type PublicationType = 'Notice' | 'Circular' | 'Amendment' | 'Tender';

export interface CbicPublication {
  id: string;
  title: string;
  authority: string;
  description: string;
  date: string;
  type: PublicationType;
  url: string;
}

export interface CbicAlert {
  id: string;
  title: string;
  authority: string;
  desc: string;
  date: string;
  tag: PublicationType;
  type: 'critical' | 'high' | 'medium';
  tagColor: string;
  url: string;
  isNew: boolean;
}

export interface CbicDeadline {
  id: string;
  title: string;
  category: string;
  bodyDate: string;
  dueDate: string;
  daysLeft: number;
  status: 'Urgent' | 'Upcoming' | 'Normal';
  url: string;
}

interface CbicCsvRecord {
  id: string;
  title: string;
  url: string;
  noticeDate: string;
  createdAt: string;
  updatedAt: string;
}

interface ProfessionTaxonomy {
  primaryCategory: string;
  specificDomain: string;
  focusArea: string;
}

export interface ProfessionOption {
  id: string;
  title: string;
  desc: string;
  iconBg: string;
  taxonomy: ProfessionTaxonomy;
}

const CBIC_AUTHORITY = 'Central Board of Indirect Taxes and Customs (CBIC)';
export const CBIC_SOURCE_URL = 'https://www.cbic.gov.in/entities/view-sticker';

const splitCsvLine = (line: string): string[] => {
  const values: string[] = [];
  let currentValue = '';
  let insideQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (char === '"') {
      if (insideQuotes && line[i + 1] === '"') {
        currentValue += '"';
        i += 1;
      } else {
        insideQuotes = !insideQuotes;
      }
      continue;
    }

    if (char === ',' && !insideQuotes) {
      values.push(currentValue.trim());
      currentValue = '';
      continue;
    }

    currentValue += char;
  }

  values.push(currentValue.trim());
  return values;
};

const parseDate = (value: string): Date | null => {
  if (!value || value === 'N/A') return null;

  if (/^\d{2}\.\d{2}\.\d{4}$/.test(value)) {
    const [day, month, year] = value.split('.').map(Number);
    const parsed = new Date(year, month - 1, day);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const normalized = value.includes(' ') ? value.replace(' ', 'T') : value;
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatDate = (value: string): string => {
  const parsed = parseDate(value);
  if (!parsed) return value;

  return parsed.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
};

const formatBestDate = (noticeDate: string, createdAt: string): string => {
  if (noticeDate && noticeDate !== 'N/A') {
    return formatDate(noticeDate);
  }

  return formatDate(createdAt);
};

const detectPublicationType = (title: string): PublicationType => {
  const normalizedTitle = title.toLowerCase();

  if (normalizedTitle.includes('tender')) return 'Tender';
  if (normalizedTitle.includes('amend')) return 'Amendment';
  if (normalizedTitle.includes('circular') || normalizedTitle.includes('guideline')) return 'Circular';
  return 'Notice';
};

const getSeverityFromTitle = (title: string): CbicAlert['type'] => {
  const normalized = title.toLowerCase();

  if (normalized.includes('final result') || normalized.includes('not be available')) return 'critical';
  if (normalized.includes('budget') || normalized.includes('exam') || normalized.includes('seeking')) return 'high';
  return 'medium';
};

const tagColorByType = (type: PublicationType): string => {
  switch (type) {
    case 'Circular':
      return 'bg-purple-100 text-purple-700';
    case 'Amendment':
      return 'bg-blue-100 text-blue-700';
    case 'Tender':
      return 'bg-emerald-100 text-emerald-700';
    default:
      return 'bg-amber-100 text-amber-700';
  }
};

const buildCsvRecords = (): CbicCsvRecord[] => {
  const [headerRow, ...contentRows] = csvRawData.trim().split(/\r?\n/);
  if (!headerRow) return [];

  const headers = splitCsvLine(headerRow);
  const getValue = (headerName: string, columns: string[]) => {
    const index = headers.indexOf(headerName);
    return index >= 0 ? columns[index] : '';
  };

  return contentRows
    .filter((row) => row.trim().length > 0)
    .map((row) => {
      const columns = splitCsvLine(row);
      return {
        id: getValue('id', columns),
        title: getValue('title', columns),
        url: getValue('url', columns) || CBIC_SOURCE_URL,
        noticeDate: getValue('notice_date', columns),
        createdAt: getValue('created_at', columns),
        updatedAt: getValue('updated_at', columns),
      };
    });
};

const buildDaysLeft = (index: number): number => {
  if (index % 4 === 0) return 3 + index;
  if (index % 3 === 0) return 8 + index;
  return 16 + index * 2;
};

const addDays = (days: number): string => {
  const now = new Date();
  const due = new Date(now);
  due.setDate(now.getDate() + days);

  return due.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
};

const toStatus = (daysLeft: number): CbicDeadline['status'] => {
  if (daysLeft <= 7) return 'Urgent';
  if (daysLeft <= 14) return 'Upcoming';
  return 'Normal';
};

export const cbicRecords = buildCsvRecords();

export const cbicPublications: CbicPublication[] = cbicRecords.map((record) => ({
  id: record.id,
  title: record.title,
  authority: CBIC_AUTHORITY,
  description: `Source: CBIC updates portal. Published on ${formatBestDate(record.noticeDate, record.createdAt)}.`,
  date: formatBestDate(record.noticeDate, record.createdAt),
  type: detectPublicationType(record.title),
  url: record.url,
}));

const splitIndex = Math.ceil(cbicRecords.length * 0.6);

export const cbicAlerts: CbicAlert[] = cbicRecords.map((record, index) => {
  const publicationType = detectPublicationType(record.title);
  const publishedOn = formatBestDate(record.noticeDate, record.createdAt);

  return {
    id: record.id,
    title: record.title,
    authority: CBIC_AUTHORITY,
    desc: `CBIC portal update published on ${publishedOn}. Click Read More for the official notice details.`,
    date: publishedOn,
    tag: publicationType,
    type: getSeverityFromTitle(record.title),
    tagColor: tagColorByType(publicationType),
    url: record.url,
    isNew: index < splitIndex,
  };
});

export const cbicDeadlines: CbicDeadline[] = cbicRecords.map((record, index) => {
  const daysLeft = buildDaysLeft(index);

  return {
    id: record.id,
    title: record.title,
    category: 'Indirect Tax Regulation (GST, Customs, Central Excise)',
    bodyDate: formatBestDate(record.noticeDate, record.createdAt),
    dueDate: addDays(daysLeft),
    daysLeft,
    status: toStatus(daysLeft),
    url: record.url,
  };
});

export const cbicProfessionTaxonomy: ProfessionTaxonomy = {
  primaryCategory: 'Government / Public Administration',
  specificDomain: 'Taxation and Customs Administration',
  focusArea: 'Indirect Tax Regulation (GST, Customs, Central Excise)',
};

export const professionOptions: ProfessionOption[] = [
  {
    id: 'ca',
    title: 'Chartered Accountant',
    desc: 'Focus on GST filings, tax assessments, and financial compliance workflows.',
    iconBg: 'bg-blue-100 text-blue-700',
    taxonomy: cbicProfessionTaxonomy,
  },
  {
    id: 'legal',
    title: 'Lawyer',
    desc: 'Focus on tax litigation, customs advisory, and regulatory interpretation.',
    iconBg: 'bg-primary/20 text-primary',
    taxonomy: cbicProfessionTaxonomy,
  },
  {
    id: 'cost-accountant',
    title: 'Cost Accountant',
    desc: 'Focus on cost audits, inventory valuation, and compliance cost optimization.',
    iconBg: 'bg-indigo-100 text-indigo-700',
    taxonomy: cbicProfessionTaxonomy,
  },
  {
    id: 'banking-finance',
    title: 'Banking or Finance',
    desc: 'Focus on financial regulatory compliance, treasury operations, and trade finance.',
    iconBg: 'bg-emerald-100 text-emerald-700',
    taxonomy: cbicProfessionTaxonomy,
  },
  {
    id: 'indirect-taxes',
    title: 'Indirect Taxes',
    desc: 'Focus on specialized indirect tax advisory, structuring, and compliance operations.',
    iconBg: 'bg-amber-100 text-amber-700',
    taxonomy: cbicProfessionTaxonomy,
  },
];
