import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { buildExportResponse } from "@/lib/export-response";
import { ATTENDANCE_STATUS_META } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import type { Column } from "@/lib/export";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Row = {
  date: string;
  group: string;
  camper: string;
  status: string;
  note: string;
};

export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const format = new URL(req.url).searchParams.get("format");

  const records = await prisma.attendanceRecord.findMany({
    orderBy: [{ attendance: { date: "desc" } }, { camperId: "asc" }],
    include: {
      attendance: {
        select: { date: true, group: { select: { name: true } } },
      },
      camper: { select: { firstName: true, lastName: true } },
    },
  });

  const rows: Row[] = records.map((r) => ({
    date: formatDate(r.attendance.date),
    group: r.attendance.group.name,
    camper: `${r.camper.firstName} ${r.camper.lastName}`,
    status: ATTENDANCE_STATUS_META[r.status].label,
    note: r.note ?? "",
  }));

  const columns: Column<Row>[] = [
    { key: "date", header: "Date", width: 14 },
    { key: "group", header: "Group", width: 18 },
    { key: "camper", header: "Camper", width: 24 },
    { key: "status", header: "Status", width: 12 },
    { key: "note", header: "Note", width: 30 },
  ];

  return buildExportResponse({
    format,
    filename: "attendance",
    sheetName: "Attendance",
    columns,
    rows,
  });
}
