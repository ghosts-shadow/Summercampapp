"use server";

import { revalidatePath } from "next/cache";
import { Role } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { authorize } from "@/lib/session";
import { logActivity } from "@/lib/activity";
import { snapshotRankings } from "@/lib/rankings";
import { ActionResult, fail, handleActionError, ok, zodFail } from "@/lib/action";
import { scoreEntrySchema } from "@/lib/validations";

function revalidateScoreViews() {
  revalidatePath("/scoring");
  revalidatePath("/rankings");
  revalidatePath("/leaderboard");
  revalidatePath("/groups");
  revalidatePath("/dashboard");
}

export async function createScoreEntry(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  try {
    // Scoring is restricted to admins and dedicated scorers; both may score any group.
    const user = await authorize([Role.ADMIN, Role.SCORER]);
    const parsed = scoreEntrySchema.safeParse(input);
    if (!parsed.success) return zodFail(parsed.error);

    const data = parsed.data;

    // Categories are admin-managed. Scorers must use an existing one; an admin
    // who types a new one auto-registers it in the managed list.
    const existingCategory = await prisma.scoreCategory.findUnique({
      where: { name: data.category },
    });
    if (!existingCategory) {
      if (user.role !== Role.ADMIN) {
        return fail("Only an administrator can create a new category.");
      }
      await prisma.scoreCategory
        .create({ data: { name: data.category } })
        .catch(() => undefined); // ignore rare unique race
    }

    // Create the ledger entry and keep the denormalized total in sync.
    const entry = await prisma.$transaction(async (tx) => {
      const created = await tx.scoreEntry.create({
        data: {
          groupId: data.groupId,
          points: data.points,
          category: data.category,
          reason: data.reason,
          staffId: user.id,
        },
      });
      await tx.group.update({
        where: { id: data.groupId },
        data: { totalScore: { increment: data.points } },
      });
      return created;
    });

    await logActivity({
      userId: user.id,
      action: "SCORE",
      entity: "Group",
      entityId: data.groupId,
      message: `${data.points > 0 ? "+" : ""}${data.points} pts (${data.category}): ${data.reason}`,
      metadata: { points: data.points, category: data.category },
    });

    revalidateScoreViews();
    return ok({ id: entry.id }, "Points recorded.");
  } catch (e) {
    return handleActionError(e);
  }
}

export async function deleteScoreEntry(id: string): Promise<ActionResult> {
  try {
    const user = await authorize([Role.ADMIN]);
    if (!id) return fail("Missing entry id.");

    await prisma.$transaction(async (tx) => {
      const entry = await tx.scoreEntry.delete({ where: { id } });
      await tx.group.update({
        where: { id: entry.groupId },
        data: { totalScore: { decrement: entry.points } },
      });
    });

    await logActivity({
      userId: user.id,
      action: "DELETE",
      entity: "ScoreEntry",
      entityId: id,
      message: "Reverted a score entry",
    });

    revalidateScoreViews();
    return ok(undefined, "Entry reverted.");
  } catch (e) {
    return handleActionError(e);
  }
}

/** Persist a snapshot of the current standings to RankingHistory. */
export async function takeRankingSnapshot(): Promise<ActionResult<{ count: number }>> {
  try {
    const user = await authorize([Role.ADMIN]);
    const count = await snapshotRankings();

    await logActivity({
      userId: user.id,
      action: "SNAPSHOT",
      entity: "RankingHistory",
      message: `Captured ranking snapshot for ${count} groups`,
    });

    revalidatePath("/rankings");
    return ok({ count }, `Snapshot saved for ${count} groups.`);
  } catch (e) {
    return handleActionError(e);
  }
}
