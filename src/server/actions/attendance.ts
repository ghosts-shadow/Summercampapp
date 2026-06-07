"use server";

import { revalidatePath } from "next/cache";
import { AttendanceStatus, Role } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { authorize } from "@/lib/session";
import { canManageGroup } from "@/lib/authz";
import { logActivity } from "@/lib/activity";
import { ActionResult, fail, handleActionError, ok, zodFail } from "@/lib/action";
import { attendanceSchema } from "@/lib/validations";

/** Normalize any Date to UTC midnight to match the `@db.Date` column. */
function toUtcDate(date: Date): Date {
  return new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
}

type ExistingAttendance = Record<
  string,
  { status: AttendanceStatus; note: string }
>;

/** Load any saved attendance for a group on a given date (yyyy-mm-dd). */
export async function fetchAttendance(
  groupId: string,
  dateISO: string,
): Promise<ExistingAttendance> {
  const user = await authorize([Role.ADMIN, Role.STAFF]);
  if (!groupId || !dateISO) return {};

  // Staff may only read attendance for groups they lead (matches the write path).
  if (!(await canManageGroup(user, groupId))) return {};

  const day = toUtcDate(new Date(dateISO));
  const attendance = await prisma.attendance.findUnique({
    where: { date_groupId: { date: day, groupId } },
    include: { records: true },
  });

  if (!attendance) return {};
  return Object.fromEntries(
    attendance.records.map((r) => [
      r.camperId,
      { status: r.status, note: r.note ?? "" },
    ]),
  );
}

export async function saveAttendance(input: unknown): Promise<ActionResult> {
  try {
    const user = await authorize([Role.ADMIN, Role.STAFF]);
    const parsed = attendanceSchema.safeParse(input);
    if (!parsed.success) return zodFail(parsed.error);

    const { groupId, date, notes, records } = parsed.data;

    // Staff may only record attendance for groups they lead.
    if (!(await canManageGroup(user, groupId))) {
      return fail("You can only record attendance for a group you lead.");
    }

    // Integrity: only accept records for campers that belong to this group.
    const memberIds = new Set(
      (
        await prisma.camper.findMany({
          where: { groupId },
          select: { id: true },
        })
      ).map((c) => c.id),
    );
    const validRecords = records.filter((r) => memberIds.has(r.camperId));

    const day = toUtcDate(date);

    await prisma.$transaction(async (tx) => {
      const attendance = await tx.attendance.upsert({
        where: { date_groupId: { date: day, groupId } },
        create: {
          date: day,
          groupId,
          recordedById: user.id,
          notes: notes || null,
        },
        update: { recordedById: user.id, notes: notes || null },
      });

      for (const rec of validRecords) {
        await tx.attendanceRecord.upsert({
          where: {
            attendanceId_camperId: {
              attendanceId: attendance.id,
              camperId: rec.camperId,
            },
          },
          create: {
            attendanceId: attendance.id,
            camperId: rec.camperId,
            status: rec.status,
            note: rec.note || null,
          },
          update: { status: rec.status, note: rec.note || null },
        });
      }
    });

    await logActivity({
      userId: user.id,
      action: "ATTENDANCE",
      entity: "Group",
      entityId: groupId,
      message: `Recorded attendance for ${validRecords.length} camper(s)`,
      metadata: { date: day.toISOString().slice(0, 10) },
    });

    revalidatePath("/attendance");
    revalidatePath("/dashboard");
    return ok(undefined, "Attendance saved.");
  } catch (e) {
    return handleActionError(e);
  }
}

export async function deleteAttendance(id: string): Promise<ActionResult> {
  try {
    const user = await authorize([Role.ADMIN]);
    if (!id) return fail("Missing attendance id.");

    await prisma.attendance.delete({ where: { id } });

    await logActivity({
      userId: user.id,
      action: "DELETE",
      entity: "Attendance",
      entityId: id,
      message: "Deleted an attendance session",
    });

    revalidatePath("/attendance");
    revalidatePath("/dashboard");
    return ok(undefined, "Attendance session deleted.");
  } catch (e) {
    return handleActionError(e);
  }
}
