import type { Metadata } from "next";
import { Boxes, Plus } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { GroupsGrid, type GroupRecord } from "@/components/groups/groups-grid";
import { GroupFormDialog } from "@/components/groups/group-form-dialog";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Groups" };

export default async function GroupsPage() {
  const user = await requireUser();
  const isAdmin = user.role === "ADMIN";

  const [groupsRaw, staff] = await Promise.all([
    prisma.group.findMany({
      orderBy: { totalScore: "desc" },
      include: {
        _count: { select: { campers: true } },
        leader: { select: { id: true, name: true } },
      },
    }),
    prisma.user.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const groups: GroupRecord[] = groupsRaw.map((g) => ({
    id: g.id,
    name: g.name,
    color: g.color,
    description: g.description,
    totalScore: g.totalScore,
    leader: g.leader,
    camperCount: g._count.campers,
  }));

  return (
    <div>
      <PageHeader
        title="Groups"
        description={`${groups.length} group${groups.length === 1 ? "" : "s"}`}
      >
        {isAdmin && (
          <GroupFormDialog
            staff={staff}
            trigger={
              <Button>
                <Plus className="h-4 w-4" /> Create group
              </Button>
            }
          />
        )}
      </PageHeader>

      {groups.length === 0 ? (
        <EmptyState
          icon={Boxes}
          title="No groups yet"
          description="Create your first group to start organizing campers."
          action={
            isAdmin ? (
              <GroupFormDialog
                staff={staff}
                trigger={
                  <Button>
                    <Plus className="h-4 w-4" /> Create group
                  </Button>
                }
              />
            ) : undefined
          }
        />
      ) : (
        <GroupsGrid groups={groups} staff={staff} isAdmin={isAdmin} />
      )}
    </div>
  );
}
