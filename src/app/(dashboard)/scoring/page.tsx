import type { Metadata } from "next";
import { Award } from "lucide-react";

import { Role } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ScoreForm } from "@/components/scoring/score-form";
import { ManageCategoriesDialog } from "@/components/scoring/manage-categories-dialog";
import {
  ScoreHistory,
  type ScoreEntryRecord,
} from "@/components/scoring/score-history";

export const metadata: Metadata = { title: "Scoring" };

export default async function ScoringPage() {
  // Scoring is for admins and dedicated scorers only.
  const user = await requireRole([Role.ADMIN, Role.SCORER]);
  const isAdmin = user.role === "ADMIN";

  const [allGroups, entries, categoryRows] = await Promise.all([
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
    prisma.scoreCategory.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const categories = categoryRows.map((c) => c.name);

  // Admins and scorers may award points to any group.
  const formGroups = allGroups;

  return (
    <div>
      <PageHeader
        title="Scoring"
        description="Award or deduct points for any group and review the score history."
      >
        <ManageCategoriesDialog categories={categoryRows} isAdmin={isAdmin} />
      </PageHeader>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          {formGroups.length > 0 ? (
            <ScoreForm
              groups={formGroups}
              categories={categories}
              canAddCategory
            />
          ) : (
            <EmptyState
              icon={Award}
              title="No groups yet"
              description="No groups have been created yet. An administrator needs to create groups before points can be awarded."
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
