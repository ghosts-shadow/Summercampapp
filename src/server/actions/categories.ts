"use server";

import { revalidatePath } from "next/cache";
import { Role } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { authorize } from "@/lib/session";
import { logActivity } from "@/lib/activity";
import { ActionResult, fail, handleActionError, ok, zodFail } from "@/lib/action";
import { categorySchema, renameCategorySchema } from "@/lib/validations";

function revalidateScoring() {
  revalidatePath("/scoring");
}

export async function createCategory(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  try {
    // Admins and scorers may add categories; renaming/removing stays admin-only.
    const user = await authorize([Role.ADMIN, Role.SCORER]);
    const parsed = categorySchema.safeParse(input);
    if (!parsed.success) return zodFail(parsed.error);

    const { name } = parsed.data;
    const existing = await prisma.scoreCategory.findUnique({ where: { name } });
    if (existing) return fail("That category already exists.");

    const category = await prisma.scoreCategory.create({ data: { name } });

    await logActivity({
      userId: user.id,
      action: "CREATE",
      entity: "ScoreCategory",
      entityId: category.id,
      message: `Added scoring category "${name}"`,
    });

    revalidateScoring();
    return ok({ id: category.id }, "Category added.");
  } catch (e) {
    return handleActionError(e);
  }
}

export async function renameCategory(input: unknown): Promise<ActionResult> {
  try {
    const user = await authorize([Role.ADMIN]);
    const parsed = renameCategorySchema.safeParse(input);
    if (!parsed.success) return zodFail(parsed.error);

    const { id, name } = parsed.data;
    const current = await prisma.scoreCategory.findUnique({ where: { id } });
    if (!current) return fail("Category not found.");
    if (current.name === name) return ok(undefined, "No change.");

    const clash = await prisma.scoreCategory.findUnique({ where: { name } });
    if (clash) return fail("Another category already has that name.");

    // Rename the category AND relabel historical score entries to match.
    await prisma.$transaction([
      prisma.scoreCategory.update({ where: { id }, data: { name } }),
      prisma.scoreEntry.updateMany({
        where: { category: current.name },
        data: { category: name },
      }),
    ]);

    await logActivity({
      userId: user.id,
      action: "UPDATE",
      entity: "ScoreCategory",
      entityId: id,
      message: `Renamed category "${current.name}" → "${name}"`,
    });

    revalidateScoring();
    revalidatePath("/rankings");
    return ok(undefined, "Category renamed.");
  } catch (e) {
    return handleActionError(e);
  }
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  try {
    const user = await authorize([Role.ADMIN]);
    if (!id) return fail("Missing category id.");

    const category = await prisma.scoreCategory.delete({ where: { id } });

    await logActivity({
      userId: user.id,
      action: "DELETE",
      entity: "ScoreCategory",
      entityId: id,
      message: `Deleted scoring category "${category.name}"`,
    });

    revalidateScoring();
    return ok(undefined, "Category deleted.");
  } catch (e) {
    return handleActionError(e);
  }
}
