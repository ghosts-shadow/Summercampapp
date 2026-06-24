import type { Metadata } from "next";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { PageHeader } from "@/components/shared/page-header";
import { CampersTable } from "@/components/campers/campers-table";

export const metadata: Metadata = { title: "Campers" };

export default async function CampersPage() {
  const user = await requireUser();
  const isAdmin = user.role === "ADMIN";

  const [campers, groups] = await Promise.all([
    prisma.camper.findMany({
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      include: { group: { select: { id: true, name: true, color: true } } },
    }),
    prisma.group.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        // Only this user's leadership row (empty array => not a leader).
        leaderships: { where: { userId: user.id }, select: { id: true } },
      },
    }),
  ]);

  // Admins may add a camper to any group; staff may only add to groups they
  // lead (primary or co-leader). Editing/deleting campers stays admin-only.
  const filterGroups = groups.map(({ id, name }) => ({ id, name }));
  const createGroups = isAdmin
    ? filterGroups
    : groups
        .filter((g) => g.leaderships.length > 0)
        .map(({ id, name }) => ({ id, name }));

  return (
    <div>
      <PageHeader
        title="Campers"
        description={`${campers.length} registered camper${campers.length === 1 ? "" : "s"}`}
      />
      <CampersTable
        campers={campers}
        groups={filterGroups}
        createGroups={createGroups}
        isAdmin={isAdmin}
        canCreate={isAdmin || createGroups.length > 0}
      />
    </div>
  );
}
