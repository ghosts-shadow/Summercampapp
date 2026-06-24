"use server";

import { revalidatePath } from "next/cache";
import { Role } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { authorize } from "@/lib/session";
import { canRenameGroup } from "@/lib/authz";
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
        // Primary leader (one of leaderIds, validated by the schema).
        leaderId: data.primaryLeaderId || null,
        leaderships: data.leaderIds.length
          ? { create: data.leaderIds.map((userId) => ({ userId })) }
          : undefined,
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
    const user = await authorize();
    const parsed = updateGroupSchema.safeParse(input);
    if (!parsed.success) return zodFail(parsed.error);

    const { id, ...data } = parsed.data;

    // Renaming/editing a group is admin-only or PRIMARY-leader-only.
    // Co-leaders manage campers/attendance/scoring but not the group itself.
    if (!(await canRenameGroup(user, id))) {
      return fail("Only the group's primary leader can edit it.");
    }

    const isAdmin = user.role === Role.ADMIN;
    if (isAdmin) {
      // Admins may also (re)assign the full leader set + primary.
      await prisma.$transaction([
        prisma.groupLeadership.deleteMany({ where: { groupId: id } }),
        ...(data.leaderIds.length
          ? [
              prisma.groupLeadership.createMany({
                data: data.leaderIds.map((userId) => ({ groupId: id, userId })),
              }),
            ]
          : []),
        prisma.group.update({
          where: { id },
          data: {
            name: data.name,
            color: data.color,
            description: data.description || null,
            leaderId: data.primaryLeaderId || null,
          },
        }),
      ]);
    } else {
      // Primary leader: may edit details only, not the leadership roster.
      await prisma.group.update({
        where: { id },
        data: {
          name: data.name,
          color: data.color,
          description: data.description || null,
        },
      });
    }

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

/** Replace a group's full leader set and designate its primary. Admin only. */
export async function setGroupLeaders(
  groupId: string,
  leaderIds: string[],
  primaryLeaderId: string | null,
): Promise<ActionResult> {
  try {
    const user = await authorize([Role.ADMIN]);
    if (!groupId) return fail("Missing group id.");
    if (!Array.isArray(leaderIds)) return fail("Invalid leaders payload.");

    // Dedupe and validate the primary belongs to the leader set.
    const ids = Array.from(new Set(leaderIds.filter(Boolean)));
    const primary = primaryLeaderId || null;
    if (ids.length > 0 && (!primary || !ids.includes(primary))) {
      return fail("Choose a primary leader from the selected staff.");
    }

    await prisma.$transaction([
      prisma.groupLeadership.deleteMany({ where: { groupId } }),
      ...(ids.length
        ? [
            prisma.groupLeadership.createMany({
              data: ids.map((userId) => ({ groupId, userId })),
            }),
          ]
        : []),
      prisma.group.update({
        where: { id: groupId },
        data: { leaderId: primary },
      }),
    ]);

    await logActivity({
      userId: user.id,
      action: "UPDATE",
      entity: "Group",
      entityId: groupId,
      message: ids.length
        ? `Updated group leaders (${ids.length})`
        : "Cleared group leaders",
    });

    revalidateGroupViews();
    revalidatePath(`/groups/${groupId}`);
    return ok(undefined, ids.length ? "Group leaders updated." : "Group leaders cleared.");
  } catch (e) {
    return handleActionError(e);
  }
}
