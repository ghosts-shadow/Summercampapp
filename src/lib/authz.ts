import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Whether a user may record scores/attendance and add campers for a group.
 * - Admins may manage any group.
 * - Staff may manage any group they lead — primary OR co-leader (a row in
 *   GroupLeadership).
 */
export async function canManageGroup(
  user: { id: string; role: Role },
  groupId: string,
): Promise<boolean> {
  if (user.role === Role.ADMIN) return true;
  if (!groupId) return false;

  const leadership = await prisma.groupLeadership.findUnique({
    where: { groupId_userId: { groupId, userId: user.id } },
    select: { id: true },
  });
  return Boolean(leadership);
}

/**
 * Whether a user is the PRIMARY leader of a group (Group.leaderId === user.id).
 * Only the primary leader (or an admin) may rename/edit the group itself.
 */
export async function isPrimaryLeader(
  user: { id: string },
  groupId: string,
): Promise<boolean> {
  if (!groupId) return false;
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    select: { leaderId: true },
  });
  return Boolean(group) && group!.leaderId === user.id;
}

/**
 * Whether a user may rename/edit a group's details.
 * - Admins may edit any group.
 * - Staff may edit only a group they are the PRIMARY leader of.
 */
export async function canRenameGroup(
  user: { id: string; role: Role },
  groupId: string,
): Promise<boolean> {
  if (user.role === Role.ADMIN) return true;
  return isPrimaryLeader(user, groupId);
}
