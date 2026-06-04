import type { Metadata } from "next";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { PageHeader } from "@/components/shared/page-header";
import { StaffTable, type StaffRecord } from "@/components/staff/staff-table";

export const metadata: Metadata = { title: "Staff" };

export default async function StaffPage() {
  // Admin-only route.
  const admin = await requireAdmin();

  const staff = await prisma.user.findMany({
    orderBy: [{ role: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      phone: true,
      isActive: true,
      ledGroups: { select: { id: true, name: true, color: true } },
    },
  });

  return (
    <div>
      <PageHeader
        title="Staff Directory"
        description={`${staff.length} account${staff.length === 1 ? "" : "s"}`}
      />
      <StaffTable staff={staff as StaffRecord[]} currentUserId={admin.id} />
    </div>
  );
}
