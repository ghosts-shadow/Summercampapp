import { slugify, toCSV, toExcel, type Column } from "@/lib/export";

/**
 * Build a downloadable CSV or XLSX Response from tabular data.
 * `format` comes from the request query string (`csv` | `xlsx` | `excel`).
 */
export async function buildExportResponse<T extends Record<string, unknown>>(opts: {
  format: string | null;
  filename: string;
  sheetName: string;
  columns: Column<T>[];
  rows: T[];
}): Promise<Response> {
  const dateStr = new Date().toISOString().slice(0, 10);
  const base = `${slugify(opts.filename)}-${dateStr}`;

  if (opts.format === "xlsx" || opts.format === "excel") {
    const buffer = await toExcel(opts.sheetName, opts.rows, opts.columns);
    // Uint8Array is a valid runtime body; cast past a TS lib BodyInit quirk.
    return new Response(buffer as unknown as BodyInit, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${base}.xlsx"`,
        "Cache-Control": "no-store",
      },
    });
  }

  const csv = toCSV(opts.rows, opts.columns);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${base}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
