"use server";

import { revalidatePath } from "next/cache";
import { Role } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { authorize } from "@/lib/session";
import { logActivity } from "@/lib/activity";
import { ActionResult, fail, handleActionError, ok, zodFail } from "@/lib/action";
import {
  camperSchema,
  moveCamperSchema,
  updateCamperSchema,
} from "@/lib/validations";

function revalidateCamperViews() {
  revalidatePath("/campers");
  revalidatePath("/groups");
  revalidatePath("/dashboard");
}

export async function createCamper(input: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    // Creating a brand-new camper record is admin-only. Staff manage their
    // group's roster by assigning EXISTING campers (see assignCampersToGroup);
    // they have read-only access to the main camper list.
    const user = await authorize([Role.ADMIN]);
    const parsed = camperSchema.safeParse(input);
    if (!parsed.success) return zodFail(parsed.error);

    const data = parsed.data;
    const camper = await prisma.camper.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        age: data.age,
        gender: data.gender,
        guardianName: data.guardianName,
        guardianPhone: data.guardianPhone,
        emergencyContact: data.emergencyContact,
        medicalNotes: data.medicalNotes || null,
        groupId: data.groupId || null,
        registrationDate: data.registrationDate ?? new Date(),
      },
    });

    await logActivity({
      userId: user.id,
      action: "CREATE",
      entity: "Camper",
      entityId: camper.id,
      message: `Added camper ${camper.firstName} ${camper.lastName}`,
    });

    revalidateCamperViews();
    return ok({ id: camper.id }, "Camper added.");
  } catch (e) {
    return handleActionError(e);
  }
}

export async function updateCamper(input: unknown): Promise<ActionResult> {
  try {
    const user = await authorize([Role.ADMIN]);
    const parsed = updateCamperSchema.safeParse(input);
    if (!parsed.success) return zodFail(parsed.error);

    const { id, ...data } = parsed.data;
    await prisma.camper.update({
      where: { id },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        age: data.age,
        gender: data.gender,
        guardianName: data.guardianName,
        guardianPhone: data.guardianPhone,
        emergencyContact: data.emergencyContact,
        medicalNotes: data.medicalNotes || null,
        groupId: data.groupId || null,
        ...(data.registrationDate
          ? { registrationDate: data.registrationDate }
          : {}),
      },
    });

    await logActivity({
      userId: user.id,
      action: "UPDATE",
      entity: "Camper",
      entityId: id,
      message: `Updated camper ${data.firstName} ${data.lastName}`,
    });

    revalidateCamperViews();
    return ok(undefined, "Camper updated.");
  } catch (e) {
    return handleActionError(e);
  }
}

export async function deleteCamper(id: string): Promise<ActionResult> {
  try {
    const user = await authorize([Role.ADMIN]);
    if (!id) return fail("Missing camper id.");

    const camper = await prisma.camper.delete({ where: { id } });

    await logActivity({
      userId: user.id,
      action: "DELETE",
      entity: "Camper",
      entityId: id,
      message: `Deleted camper ${camper.firstName} ${camper.lastName}`,
    });

    revalidateCamperViews();
    return ok(undefined, "Camper deleted.");
  } catch (e) {
    return handleActionError(e);
  }
}

export async function moveCamper(input: unknown): Promise<ActionResult> {
  try {
    const user = await authorize([Role.ADMIN]);
    const parsed = moveCamperSchema.safeParse(input);
    if (!parsed.success) return zodFail(parsed.error);

    await prisma.camper.update({
      where: { id: parsed.data.camperId },
      data: { groupId: parsed.data.groupId || null },
    });

    await logActivity({
      userId: user.id,
      action: "MOVE",
      entity: "Camper",
      entityId: parsed.data.camperId,
      message: parsed.data.groupId
        ? `Assigned camper to a group`
        : `Removed camper from group`,
    });

    revalidateCamperViews();
    return ok(undefined, "Camper reassigned.");
  } catch (e) {
    return handleActionError(e);
  }
}

/** Bulk import campers from parsed CSV rows. */
export async function bulkImportCampers(
  rows: unknown,
): Promise<ActionResult<{ created: number; skipped: number }>> {
  try {
    const user = await authorize([Role.ADMIN]);
    if (!Array.isArray(rows)) return fail("Invalid import payload.");

    let created = 0;
    let skipped = 0;
    const errors: string[] = [];

    // Map group names to ids once.
    const groups = await prisma.group.findMany({ select: { id: true, name: true } });
    const groupByName = new Map(
      groups.map((g) => [g.name.toLowerCase(), g.id]),
    );

    for (const [i, row] of rows.entries()) {
      const r = row as Record<string, unknown>;
      const groupName = String(r.group ?? r.groupName ?? "").trim();
      const groupId = groupName
        ? groupByName.get(groupName.toLowerCase())
        : undefined;

      const parsed = camperSchema.safeParse({
        firstName: r.firstName,
        lastName: r.lastName,
        age: r.age,
        gender: (r.gender as string)?.toUpperCase() || "UNSPECIFIED",
        guardianName: r.guardianName,
        guardianPhone: r.guardianPhone,
        emergencyContact: r.emergencyContact,
        medicalNotes: r.medicalNotes,
        groupId: groupId ?? "",
      });

      if (!parsed.success) {
        skipped++;
        errors.push(`Row ${i + 1}: ${parsed.error.issues[0]?.message ?? "invalid"}`);
        continue;
      }

      const d = parsed.data;
      await prisma.camper.create({
        data: {
          firstName: d.firstName,
          lastName: d.lastName,
          age: d.age,
          gender: d.gender,
          guardianName: d.guardianName,
          guardianPhone: d.guardianPhone,
          emergencyContact: d.emergencyContact,
          medicalNotes: d.medicalNotes || null,
          groupId: d.groupId || null,
        },
      });
      created++;
    }

    await logActivity({
      userId: user.id,
      action: "IMPORT",
      entity: "Camper",
      message: `Imported ${created} campers (${skipped} skipped)`,
    });

    revalidateCamperViews();
    return ok(
      { created, skipped },
      `Imported ${created} campers${skipped ? `, skipped ${skipped}` : ""}.`,
    );
  } catch (e) {
    return handleActionError(e);
  }
}
