/**
 * Simple CSV parser/serializer for collection data.
 */

export function serializeCsv(
  headers: string[],
  rows: string[][],
): string {
  const escapeField = (field: string) => {
    if (field.includes(",") || field.includes('"') || field.includes("\n")) {
      return `"${field.replace(/"/g, '""')}"`;
    }
    return field;
  };

  const lines = [
    headers.map(escapeField).join(","),
    ...rows.map((row) => row.map(escapeField).join(",")),
  ];

  return lines.join("\n");
}

export function parseCsv(text: string): { headers: string[]; rows: string[][] } {
  const lines: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        current += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === "\n" || (char === "\r" && next === "\n")) {
        lines.push(current);
        current = "";
        if (char === "\r") i++;
      } else {
        current += char;
      }
    }
  }

  if (current) lines.push(current);

  const parseRow = (line: string): string[] => {
    const fields: string[] = [];
    let field = "";
    let quoted = false;

    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (quoted) {
        if (c === '"' && line[i + 1] === '"') {
          field += '"';
          i++;
        } else if (c === '"') {
          quoted = false;
        } else {
          field += c;
        }
      } else {
        if (c === '"') {
          quoted = true;
        } else if (c === ",") {
          fields.push(field);
          field = "";
        } else {
          field += c;
        }
      }
    }
    fields.push(field);
    return fields;
  };

  const [headerLine, ...dataLines] = lines;
  const headers = headerLine ? parseRow(headerLine) : [];
  const rows = dataLines
    .filter((line) => line.trim() !== "")
    .map(parseRow);

  return { headers, rows };
}
