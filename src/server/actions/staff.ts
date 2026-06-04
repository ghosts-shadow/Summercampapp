"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { authorize } from "@/lib/session";
import { logActivity } from "@/lib/activity";
import { ActionResult, fail, handleActionError, ok, zodFail } from "@/lib/action";
import { createStaffSchema, updateStaffSchema } from "@/lib/validations";

function revalidateStaffViews() {
  revalidatePath("/staff");
  revalidatePath("/groups");
  revalidatePath("/dashboard");
}

export async function createStaff(input: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    const admin = await authorize([Role.ADMIN]);
    const parsed = createStaffSchema.safeParse(input);
    if (!parsed.success) return zodFail(parsed.error);

    const data = parsed.data;
    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existing) return fail("That email is already registered.");

    const userRecord = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash: await bcrypt.hash(data.password, 12),
        role: data.role,
        phone: data.phone || null,
      },
    });

    await logActivity({
      userId: admin.id,
      action: "CREATE",
      entity: "User",
      entityId: userRecord.id,
      message: `Created ${data.role.toLowerCase()} account for ${data.name}`,
    });

    revalidateStaffViews();
    return ok({ id: userRecord.id }, "Staff account created.");
  } catch (e) {
    return handleActionError(e);
  }
}

export async function updateStaff(input: unknown): Promise<ActionResult> {
  try {
    const admin = await authorize([Role.ADMIN]);
    const parsed = updateStaffSchema.safeParse(input);
    if (!parsed.success) return zodFail(parsed.error);

    const { id, password, ...data } = parsed.data;

    // Guard against an admin locking themselves out.
    if (id === admin.id) {
      if (data.role !== Role.ADMIN) {
        return fail("You cannot change your own role.");
      }
      if (!data.isActive) {
        return fail("You cannot deactivate your own account.");
      }
    }

    // Don't demote/deactivate the final admin.
    if (data.role !== Role.ADMIN || !data.isActive) {
      const target = await prisma.user.findUnique({ where: { id } });
      if (target?.role === Role.ADMIN) {
        const admins = await prisma.user.count({
          where: { role: Role.ADMIN, isActive: true },
        });
        if (admins <= 1) {
          return fail("At least one active administrator is required.");
        }
      }
    }

    await prisma.user.update({
      where: { id },
      data: {
        name: data.name,
        email: data.email,
        role: data.role,
        phone: data.phone || null,
        isActive: data.isActive,
        ...(password ? { passwordHash: await bcrypt.hash(password, 12) } : {}),
      },
    });

    await logActivity({
      userId: admin.id,
      action: "UPDATE",
      entity: "User",
      entityId: id,
      message: `Updated account for ${data.name}`,
    });

    revalidateStaffViews();
    return ok(undefined, "Staff account updated.");
  } catch (e) {
    return handleActionError(e);
  }
}

export async function deleteStaff(id: string): Promise<ActionResult> {
  try {
    const admin = await authorize([Role.ADMIN]);
    if (!id) return fail("Missing user id.");
    if (id === admin.id) return fail("You cannot delete your own account.");

    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) return fail("User not found.");

    if (target.role === Role.ADMIN) {
      const admins = await prisma.user.count({ where: { role: Role.ADMIN } });
      if (admins <= 1) {
        return fail("At least one administrator is required.");
      }
    }

    await prisma.user.delete({ where: { id } });

    await logActivity({
      userId: admin.id,
      action: "DELETE",
      entity: "User",
      entityId: id,
      message: `Deleted account for ${target.name}`,
    });

    revalidateStaffViews();
    return ok(undefined, "Staff account deleted.");
  } catch (e) {
    return handleActionError(e);
  }
}
