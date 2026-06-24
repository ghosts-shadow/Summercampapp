import type { Metadata } from "next";
import Link from "next/link";
import { ClipboardCheck } from "lucide-react";

import { Role } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { formatDate, toDateInputValue } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { AttendanceSheet } from "@/components/attendance/attendance-sheet";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Attendance" };

export default async function AttendancePage() {
  // Attendance is for admins and staff (group leaders); scorers are redirected.
  const user = await requireRole([Role.ADMIN, Role.STAFF]);
  const isAdmin = user.role === "ADMIN";

  // Staff only see the groups they lead (primary or co-leader); admins see all.
  const groups = await prisma.group.findMany({
    where: isAdmin ? {} : { leaderships: { some: { userId: user.id } } },
    orderBy: { name: "asc" },
    select: { id: true, name: true, color: true },
  });
  const groupIds = groups.map((g) => g.id);

  const [campers, recent] = await Promise.all([
    prisma.camper.findMany({
      where: { groupId: { in: groupIds } },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      select: { id: true, firstName: true, lastName: true, groupId: true },
    }),
    prisma.attendance.findMany({
      where: isAdmin ? {} : { groupId: { in: groupIds } },
      orderBy: { date: "desc" },
      take: 8,
      include: {
        group: { select: { name: true, color: true } },
        records: { select: { status: true } },
      },
    }),
  ]);

  const campersByGroup: Record<
    string,
    { id: string; firstName: string; lastName: string }[]
  > = {};
  for (const c of campers) {
    if (!c.groupId) continue;
    (campersByGroup[c.groupId] ??= []).push({
      id: c.id,
      firstName: c.firstName,
      lastName: c.lastName,
    });
  }

  const defaultDate = toDateInputValue(new Date());

  return (
    <div>
      <PageHeader
        title="Attendance"
        description={
          isAdmin
            ? "Record daily attendance for each group."
            : "Record daily attendance for your group."
        }
      >
        {isAdmin && (
          <Button asChild variant="outline">
            <Link href="/api/export/attendance?format=csv">Export CSV</Link>
          </Button>
        )}
      </PageHeader>

      {groups.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title="No group to manage"
          description="You aren't assigned as the leader of any group yet. Ask an administrator to assign you, then you can record attendance here."
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <AttendanceSheet
              groups={groups}
              campersByGroup={campersByGroup}
              defaultDate={defaultDate}
            />
          </div>

          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-base">Recent sessions</CardTitle>
              <CardDescription>Last recorded attendance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {recent.length === 0 && (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No sessions recorded yet.
                </p>
              )}
              {recent.map((session) => {
                const present = session.records.filter(
                  (r) => r.status === "PRESENT",
                ).length;
                const total = session.records.length;
                return (
                  <div
                    key={session.id}
                    className="flex items-center justify-between rounded-md border p-3 text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: session.group.color }}
                      />
                      <div>
                        <p className="font-medium">{session.group.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(session.date)}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">
                      {present}/{total} present
                    </span>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
