import ExcelJS from "exceljs";

export interface Column<T> {
  /** Property key on the row (used when `map` is not provided). */
  key: keyof T & string;
  header: string;
  /** Optional transform for the cell value. */
  map?: (row: T) => string | number | null | undefined;
  /** Excel column width. */
  width?: number;
}

function cellValue<T>(row: T, col: Column<T>): string | number {
  const raw = col.map ? col.map(row) : (row[col.key] as unknown);
  if (raw === null || raw === undefined) return "";
  if (raw instanceof Date) return raw.toISOString();
  return raw as string | number;
}

/**
 * Build a CSV string with a UTF-8 BOM so Excel opens accented characters
 * correctly. Values containing commas, quotes, or newlines are escaped.
 */
export function toCSV<T extends Record<string, unknown>>(
  rows: T[],
  columns: Column<T>[],
): string {
  const escape = (value: string | number): string => {
    const s = String(value);
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const header = columns.map((c) => escape(c.header)).join(",");
  const body = rows
    .map((row) => columns.map((c) => escape(cellValue(row, c))).join(","))
    .join("\r\n");

  return `﻿${header}\r\n${body}`;
}

/**
 * Build a real .xlsx workbook (single sheet) as a Buffer, with a styled,
 * frozen header row and auto-sized columns.
 */
export async function toExcel<T extends Record<string, unknown>>(
  sheetName: string,
  rows: T[],
  columns: Column<T>[],
): Promise<Uint8Array> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "St. Joseph's Cathedral Summer Camp";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet(sheetName.slice(0, 31) || "Sheet1", {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  sheet.columns = columns.map((c) => ({
    header: c.header,
    key: c.key,
    width: c.width ?? Math.max(12, c.header.length + 4),
  }));

  // Style the header row.
  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1D4ED8" },
  };
  headerRow.alignment = { vertical: "middle" };
  headerRow.height = 20;

  for (const row of rows) {
    const values: Record<string, string | number> = {};
    for (const c of columns) values[c.key] = cellValue(row, c);
    sheet.addRow(values);
  }

  // ExcelJS types writeBuffer() as either Node Buffer or ArrayBuffer across
  // versions; both are valid Response bodies. Normalize to a Uint8Array.
  const data = await workbook.xlsx.writeBuffer();
  return new Uint8Array(data as unknown as ArrayBuffer);
}

/** Filename-safe slug, e.g. "Camper List" -> "camper-list". */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
