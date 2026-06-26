"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { authorize } from "@/lib/session";
import { logActivity } from "@/lib/activity";
import { ActionResult, fail, handleActionError, ok, zodFail } from "@/lib/action";
import { updateProfileSchema } from "@/lib/validations";
import { unstable_update as updateSession } from "@/auth";

/**
 * Update the signed-in user's own account: name, email, phone, and optionally
 * their password. A password change requires the correct current password.
 */
export async function updateProfile(input: unknown): Promise<ActionResult> {
  try {
    const me = await authorize();
    const parsed = updateProfileSchema.safeParse(input);
    if (!parsed.success) return zodFail(parsed.error);

    const { name, email, phone, currentPassword, newPassword } = parsed.data;

    const user = await prisma.user.findUnique({ where: { id: me.id } });
    if (!user) return fail("Your account could not be found.");

    // Email must stay unique across users.
    if (email !== user.email) {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing && existing.id !== user.id) {
        return fail("That email is already in use.", {
          email: ["That email is already in use."],
        });
      }
    }

    // Verify the current password before allowing a change.
    let passwordHash: string | undefined;
    if (newPassword) {
      const valid = await bcrypt.compare(currentPassword ?? "", user.passwordHash);
      if (!valid) {
        return fail("Your current password is incorrect.", {
          currentPassword: ["Your current password is incorrect."],
        });
      }
      passwordHash = await bcrypt.hash(newPassword, 12);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        name,
        email,
        phone: phone || null,
        ...(passwordHash ? { passwordHash } : {}),
      },
    });

    await logActivity({
      userId: user.id,
      action: "UPDATE",
      entity: "User",
      entityId: user.id,
      message: passwordHash
        ? "Updated own profile and changed password"
        : "Updated own profile",
    });

    // Refresh the session token so the header shows the new name/email at once.
    await updateSession({ user: { name, email } });

    revalidatePath("/profile");
    revalidatePath("/dashboard");
    return ok(undefined, "Profile updated.");
  } catch (e) {
    return handleActionError(e);
  }
}
