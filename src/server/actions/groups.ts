"use server";

import { revalidatePath } from "next/cache";
import { Role } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { authorize } from "@/lib/session";
import { logActivity } from "@/lib/activity";
import { ActionResult, fail, handleActionError, ok, zodFail } from "@/lib/action";
import { groupSchema, updateGroupSchema } from "@/lib/validations";

function revalidateGroupViews() {
  revalidatePath("/groups");
  revalidatePath("/campers");
  revalidatePath("/rankings");
  revalidatePath("/leaderboard");
  revalidatePath("/dashboard");
}

export async function createGroup(input: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await authorize([Role.ADMIN]);
    const parsed = groupSchema.safeParse(input);
    if (!parsed.success) return zodFail(parsed.error);

    const data = parsed.data;
    const group = await prisma.group.create({
      data: {
        name: data.name,
        color: data.color,
        description: data.description || null,
        leaderId: data.leaderId || null,
      },
    });

    await logActivity({
      userId: user.id,
      action: "CREATE",
      entity: "Group",
      entityId: group.id,
      message: `Created group ${group.name}`,
    });

    revalidateGroupViews();
    return ok({ id: group.id }, "Group created.");
  } catch (e) {
    return handleActionError(e);
  }
}

export async function updateGroup(input: unknown): Promise<ActionResult> {
  try {
    const user = await authorize([Role.ADMIN]);
    const parsed = updateGroupSchema.safeParse(input);
    if (!parsed.success) return zodFail(parsed.error);

    const { id, ...data } = parsed.data;
    await prisma.group.update({
      where: { id },
      data: {
        name: data.name,
        color: data.color,
        description: data.description || null,
        leaderId: data.leaderId || null,
      },
    });

    await logActivity({
      userId: user.id,
      action: "UPDATE",
      entity: "Group",
      entityId: id,
      message: `Updated group ${data.name}`,
    });

    revalidateGroupViews();
    return ok(undefined, "Group updated.");
  } catch (e) {
    return handleActionError(e);
  }
}

export async function deleteGroup(id: string): Promise<ActionResult> {
  try {
    const user = await authorize([Role.ADMIN]);
    if (!id) return fail("Missing group id.");

    // Campers are detached (schema uses onDelete: SetNull); scores/attendance
    // for the group are removed by cascade.
    const group = await prisma.group.delete({ where: { id } });

    await logActivity({
      userId: user.id,
      action: "DELETE",
      entity: "Group",
      entityId: id,
      message: `Deleted group ${group.name}`,
    });

    revalidateGroupViews();
    return ok(undefined, "Group deleted.");
  } catch (e) {
    return handleActionError(e);
  }
}

/** Bulk-assign campers to (or unassign from) a group. */
export async function assignCampersToGroup(
  groupId: string | null,
  camperIds: string[],
): Promise<ActionResult> {
  try {
    const user = await authorize([Role.ADMIN]);
    if (!Array.isArray(camperIds) || camperIds.length === 0) {
      return fail("Select at least one camper.");
    }

    await prisma.camper.updateMany({
      where: { id: { in: camperIds } },
      data: { groupId: groupId || null },
    });

    await logActivity({
      userId: user.id,
      action: "ASSIGN",
      entity: "Group",
      entityId: groupId ?? undefined,
      message: `Assigned ${camperIds.length} camper(s)`,
    });

    revalidateGroupViews();
    return ok(undefined, `Updated ${camperIds.length} camper(s).`);
  } catch (e) {
    return handleActionError(e);
  }
}

/** Assign (or clear) a group's leader. */
export async function setGroupLeader(
  groupId: string,
  leaderId: string | null,
): Promise<ActionResult> {
  try {
    const user = await authorize([Role.ADMIN]);
    if (!groupId) return fail("Missing group id.");

    await prisma.group.update({
      where: { id: groupId },
      data: { leaderId: leaderId || null },
    });

    await logActivity({
      userId: user.id,
      action: "UPDATE",
      entity: "Group",
      entityId: groupId,
      message: leaderId ? "Assigned a group leader" : "Cleared group leader",
    });

    revalidateGroupViews();
    revalidatePath(`/groups/${groupId}`);
    return ok(undefined, leaderId ? "Group leader assigned." : "Group leader removed.");
  } catch (e) {
    return handleActionError(e);
  }
}
