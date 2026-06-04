import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Whether a user may record scores/attendance for a given group.
 * - Admins may manage any group.
 * - Staff may only manage groups they lead (Group.leaderId === user.id).
 */
export async function canManageGroup(
  user: { id: string; role: Role },
  groupId: string,
): Promise<boolean> {
  if (user.role === Role.ADMIN) return true;
  if (!groupId) return false;

  const group = await prisma.group.findUnique({
    where: { id: groupId },
    select: { leaderId: true },
  });
  return Boolean(group) && group!.leaderId === user.id;
}
