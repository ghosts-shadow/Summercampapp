import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { buildExportResponse } from "@/lib/export-response";
import { formatDateTime } from "@/lib/utils";
import type { Column } from "@/lib/export";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Row = {
  date: string;
  group: string;
  category: string;
  points: number;
  reason: string;
  staff: string;
};

export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const format = new URL(req.url).searchParams.get("format");

  const entries = await prisma.scoreEntry.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      group: { select: { name: true } },
      staff: { select: { name: true } },
    },
  });

  const rows: Row[] = entries.map((e) => ({
    date: formatDateTime(e.createdAt),
    group: e.group?.name ?? "—",
    category: e.category,
    points: e.points,
    reason: e.reason,
    staff: e.staff?.name ?? "—",
  }));

  const columns: Column<Row>[] = [
    { key: "date", header: "Date", width: 22 },
    { key: "group", header: "Group", width: 18 },
    { key: "category", header: "Category", width: 16 },
    { key: "points", header: "Points", width: 10 },
    { key: "reason", header: "Reason", width: 36 },
    { key: "staff", header: "Recorded By", width: 20 },
  ];

  return buildExportResponse({
    format,
    filename: "group-scores",
    sheetName: "Scores",
    columns,
    rows,
  });
}
