import type { Metadata } from "next";
import { Award } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { SCORE_CATEGORIES } from "@/lib/constants";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ScoreForm } from "@/components/scoring/score-form";
import {
  ScoreHistory,
  type ScoreEntryRecord,
} from "@/components/scoring/score-history";

export const metadata: Metadata = { title: "Scoring" };

export default async function ScoringPage() {
  const user = await requireUser();
  const isAdmin = user.role === "ADMIN";

  const [allGroups, entries, usedCategories] = await Promise.all([
    prisma.group.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, color: true },
    }),
    prisma.scoreEntry.findMany({
      orderBy: { createdAt: "desc" },
      take: 250,
      include: {
        group: { select: { name: true, color: true } },
        staff: { select: { name: true } },
      },
    }),
    prisma.scoreEntry.findMany({
      distinct: ["category"],
      select: { category: true },
      orderBy: { category: "asc" },
    }),
  ]);

  // Built-in defaults first, then any custom categories already in use.
  const defaults = SCORE_CATEGORIES as readonly string[];
  const extraCategories = usedCategories
    .map((c) => c.category)
    .filter((c) => !defaults.includes(c))
    .sort();
  const categories = [...defaults, ...extraCategories];

  // Staff may only award points to groups they lead; admins to any group.
  const formGroups = isAdmin
    ? allGroups
    : await prisma.group.findMany({
        where: { leaderId: user.id },
        orderBy: { name: "asc" },
        select: { id: true, name: true, color: true },
      });

  return (
    <div>
      <PageHeader
        title="Scoring"
        description={
          isAdmin
            ? "Award or deduct points and review the full score history."
            : "Award or deduct points for your group and review the score history."
        }
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          {formGroups.length > 0 ? (
            <ScoreForm
              groups={formGroups}
              categories={categories}
              canAddCategory={isAdmin}
            />
          ) : (
            <EmptyState
              icon={Award}
              title="No group to score"
              description="You aren't assigned as the leader of any group yet. Ask an administrator to assign you, then you can award points here."
            />
          )}
        </div>
        <div className="lg:col-span-2">
          <ScoreHistory
            entries={entries as ScoreEntryRecord[]}
            groups={allGroups}
            isAdmin={isAdmin}
          />
        </div>
      </div>
    </div>
  );
}
