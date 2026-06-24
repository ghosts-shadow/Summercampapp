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
      select: { id: true, name: true },
    }),
  ]);

  // Everyone can browse the roster + filter by group. Creating a new camper is
  // admin-only; staff are read-only here (edit/delete are already admin-only).
  const filterGroups = groups.map(({ id, name }) => ({ id, name }));
  const createGroups = isAdmin ? filterGroups : [];

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
        canCreate={isAdmin}
      />
    </div>
  );
}
