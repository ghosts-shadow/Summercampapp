import type { Metadata } from "next";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { PageHeader } from "@/components/shared/page-header";
import { CampersTable } from "@/components/campers/campers-table";

export const metadata: Metadata = { title: "Campers" };

export default async function CampersPage() {
  const user = await requireUser();

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

  return (
    <div>
      <PageHeader
        title="Campers"
        description={`${campers.length} registered camper${campers.length === 1 ? "" : "s"}`}
      />
      <CampersTable
        campers={campers}
        groups={groups}
        isAdmin={user.role === "ADMIN"}
      />
    </div>
  );
}
