import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { buildExportResponse } from "@/lib/export-response";
import { GENDER_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import type { Column } from "@/lib/export";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Row = {
  firstName: string;
  lastName: string;
  age: number;
  gender: string;
  group: string;
  guardianName: string;
  guardianPhone: string;
  emergencyContact: string;
  medicalNotes: string;
  registrationDate: string;
};

export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const format = new URL(req.url).searchParams.get("format");

  const campers = await prisma.camper.findMany({
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    include: { group: { select: { name: true } } },
  });

  const rows: Row[] = campers.map((c) => ({
    firstName: c.firstName,
    lastName: c.lastName,
    age: c.age,
    gender: GENDER_LABELS[c.gender],
    group: c.group?.name ?? "Unassigned",
    guardianName: c.guardianName,
    guardianPhone: c.guardianPhone,
    emergencyContact: c.emergencyContact,
    medicalNotes: c.medicalNotes ?? "",
    registrationDate: formatDate(c.registrationDate),
  }));

  const columns: Column<Row>[] = [
    { key: "firstName", header: "First Name", width: 16 },
    { key: "lastName", header: "Last Name", width: 16 },
    { key: "age", header: "Age", width: 6 },
    { key: "gender", header: "Gender", width: 12 },
    { key: "group", header: "Group", width: 18 },
    { key: "guardianName", header: "Guardian", width: 20 },
    { key: "guardianPhone", header: "Parent Phone", width: 18 },
    { key: "emergencyContact", header: "Emergency Contact", width: 28 },
    { key: "medicalNotes", header: "Medical Notes", width: 30 },
    { key: "registrationDate", header: "Registered", width: 14 },
  ];

  return buildExportResponse({
    format,
    filename: "camper-list",
    sheetName: "Campers",
    columns,
    rows,
  });
}
