import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Trophy, UserCog, UsersRound } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { GroupMembersManager } from "@/components/groups/group-members-manager";
import { GroupLeaderSelect } from "@/components/groups/group-leader-select";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "Group" };

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;

  const group = await prisma.group.findUnique({
    where: { id },
    include: {
      leader: { select: { name: true } },
      leaderships: { include: { user: { select: { id: true, name: true } } } },
      campers: {
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
        select: { id: true, firstName: true, lastName: true, age: true },
      },
    },
  });

  if (!group) notFound();

  const isAdmin = user.role === "ADMIN";
  const unassigned = isAdmin
    ? await prisma.camper.findMany({
        where: { groupId: null },
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
        select: { id: true, firstName: true, lastName: true, age: true },
      })
    : [];
  const staff = await prisma.user.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/groups">
          <ArrowLeft className="h-4 w-4" /> Back to groups
        </Link>
      </Button>

      <Card className="overflow-hidden">
        <div className="h-2" style={{ backgroundColor: group.color }} />
        <CardContent className="flex flex-wrap items-center justify-between gap-4 pt-5">
          <div className="flex items-center gap-3">
            <span
              className="flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold text-white shadow"
              style={{ backgroundColor: group.color }}
            >
              {group.name.charAt(0)}
            </span>
            <div>
              <h1 className="text-2xl font-bold">{group.name}</h1>
              <p className="text-sm text-muted-foreground">
                {group.description || "No description."}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <Stat icon={UsersRound} label="Members" value={group.campers.length} />
            <Stat icon={Trophy} label="Points" value={group.totalScore} />
            {isAdmin ? (
              <GroupLeaderSelect
                groupId={group.id}
                leaderIds={group.leaderships.map((l) => l.user.id)}
                primaryLeaderId={group.leaderId}
                staff={staff}
              />
            ) : (
              <Stat
                icon={UserCog}
                label="Leaders"
                value={
                  group.leaderships.length === 0
                    ? "—"
                    : group.leader?.name +
                      (group.leaderships.length > 1
                        ? ` +${group.leaderships.length - 1}`
                        : "")
                }
              />
            )}
          </div>
        </CardContent>
      </Card>

      <GroupMembersManager
        groupId={group.id}
        members={group.campers}
        unassigned={unassigned}
        isAdmin={isAdmin}
      />
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Trophy;
  label: string;
  value: string | number;
}) {
  return (
    <div className="text-center">
      <Icon className="mx-auto mb-1 h-4 w-4 text-muted-foreground" />
      <p className="text-lg font-bold leading-none">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
