/**
 * Minimal RFC-4180-ish CSV parser (browser-safe, no dependencies).
 * Handles quoted fields, escaped quotes, and CRLF/LF line endings.
 */
export function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;

  // Strip a leading UTF-8 BOM if present.
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (char === "\r") {
      // ignore — handled by the following \n
    } else {
      field += char;
    }
  }

  // Flush the final field/row.
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
}

/**
 * Trigger a client-side download of CSV text as a file. Browser-only —
 * call from event handlers in client components. Prepends a UTF-8 BOM so
 * Excel opens it with the correct encoding.
 */
export function downloadCSV(filename: string, content: string): void {
  const blob = new Blob(["﻿" + content], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/** Normalize a header label to a lower camelCase key (e.g. "First Name" -> "firstName"). */
function normalizeHeader(header: string): string {
  const parts = header.trim().split(/[^A-Za-z0-9]+/).filter(Boolean);
  if (parts.length === 0) return "";
  return parts
    .map((part, i) =>
      i === 0
        ? part.charAt(0).toLowerCase() + part.slice(1)
        : part.charAt(0).toUpperCase() + part.slice(1).toLowerCase(),
    )
    .join("");
}

/** Parse CSV text into objects keyed by the (normalized) header row. */
export function parseCSVToObjects(text: string): Record<string, string>[] {
  const rows = parseCSV(text);
  if (rows.length < 2) return [];

  const headers = rows[0].map(normalizeHeader);
  // Never let attacker-controlled headers reach a prototype.
  const BLOCKED = new Set(["__proto__", "constructor", "prototype"]);

  return rows.slice(1).map((cells) => {
    const obj: Record<string, string> = Object.create(null);
    headers.forEach((h, i) => {
      if (!h || BLOCKED.has(h)) return;
      obj[h] = (cells[i] ?? "").trim();
    });
    return obj;
  });
}
