import type { Metadata } from "next";
import Link from "next/link";
import {
  Activity,
  Award,
  Boxes,
  ClipboardCheck,
  Crown,
  Trophy,
  Users,
} from "lucide-react";
import { AttendanceStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getRankings } from "@/lib/rankings";
import { requireUser } from "@/lib/session";
import { formatSigned, timeAgo } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import {
  ScoreBarChart,
  type ScoreDatum,
} from "@/components/dashboard/score-bar-chart";
import {
  AttendanceTrendChart,
  type TrendDatum,
} from "@/components/dashboard/attendance-trend-chart";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Dashboard" };

const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default async function DashboardPage() {
  const user = await requireUser();
  const isAdmin = user.role === "ADMIN";

  const now = new Date();
  const todayUtc = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );

  const [
    totalCampers,
    totalGroups,
    totalStaff,
    rankings,
    presentToday,
    totalToday,
    recentDates,
    activity,
  ] = await Promise.all([
    prisma.camper.count(),
    prisma.group.count(),
    prisma.user.count({ where: { isActive: true } }),
    getRankings(),
    prisma.attendanceRecord.count({
      where: { status: AttendanceStatus.PRESENT, attendance: { date: todayUtc } },
    }),
    prisma.attendanceRecord.count({ where: { attendance: { date: todayUtc } } }),
    prisma.attendance.findMany({
      distinct: ["date"],
      orderBy: { date: "desc" },
      take: 7,
      select: { date: true },
    }),
    prisma.activityLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { user: { select: { name: true } } },
    }),
  ]);

  // Build the attendance trend from the most recent recorded days.
  const since = recentDates.length
    ? recentDates[recentDates.length - 1].date
    : todayUtc;
  const trendSessions = await prisma.attendance.findMany({
    where: { date: { gte: since } },
    select: { date: true, records: { select: { status: true } } },
  });

  const trendMap = new Map<string, TrendDatum>();
  for (const session of trendSessions) {
    const key = session.date.toISOString().slice(0, 10);
    const entry =
      trendMap.get(key) ??
      {
        date: `${DOW[session.date.getUTCDay()]} ${session.date.getUTCDate()}`,
        present: 0,
        late: 0,
        absent: 0,
        excused: 0,
      };
    for (const r of session.records) {
      if (r.status === "PRESENT") entry.present++;
      else if (r.status === "LATE") entry.late++;
      else if (r.status === "ABSENT") entry.absent++;
      else entry.excused++;
    }
    trendMap.set(key, entry);
  }
  const trendData: TrendDatum[] = [...trendMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, v]) => v);

  const scoreData: ScoreDatum[] = rankings.map((g) => ({
    name: g.name,
    score: g.totalScore,
    color: g.color,
  }));

  const topGroup = rankings[0];
  const attendanceRate =
    totalToday > 0 ? Math.round((presentToday / totalToday) * 100) : 0;

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${user.name?.split(" ")[0] ?? "there"} 👋`}
        description="Here's what's happening at camp today."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Campers"
          value={totalCampers}
          icon={Users}
          hint={`${totalGroups} groups`}
        />
        <StatCard
          title="Groups"
          value={totalGroups}
          icon={Boxes}
          hint="Active teams"
          accentClassName="bg-purple-500/10 text-purple-600 dark:text-purple-400"
        />
        <StatCard
          title="Attendance Today"
          value={totalToday > 0 ? `${presentToday}/${totalToday}` : "—"}
          icon={ClipboardCheck}
          hint={totalToday > 0 ? `${attendanceRate}% present` : "Not yet recorded"}
          accentClassName="bg-green-500/10 text-green-600 dark:text-green-400"
        />
        <StatCard
          title="Active Staff"
          value={totalStaff}
          icon={Award}
          hint="Admins & staff"
          accentClassName="bg-orange-500/10 text-orange-600 dark:text-orange-400"
        />
      </div>

      {topGroup && (
        <Card className="mt-4 border-primary/30 bg-gradient-to-r from-primary/5 to-transparent">
          <CardContent className="flex flex-wrap items-center justify-between gap-4 py-5">
            <div className="flex items-center gap-4">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-full text-white shadow"
                style={{ backgroundColor: topGroup.color }}
              >
                <Crown className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Leading group
                </p>
                <p className="text-xl font-bold">{topGroup.name}</p>
                <p className="text-sm text-muted-foreground">
                  {topGroup.camperCount} campers
                  {topGroup.leaderName ? ` · Led by ${topGroup.leaderName}` : ""}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-extrabold">{topGroup.totalScore}</p>
              <p className="text-xs text-muted-foreground">points</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Group Scores</CardTitle>
            <CardDescription>Current standings by total points</CardDescription>
          </CardHeader>
          <CardContent>
            <ScoreBarChart data={scoreData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Attendance Trend</CardTitle>
            <CardDescription>Recent recorded camp days</CardDescription>
          </CardHeader>
          <CardContent>
            <AttendanceTrendChart data={trendData} />
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Top Ranked Groups</CardTitle>
              <CardDescription>Live leaderboard</CardDescription>
            </div>
            <Trophy className="h-5 w-5 text-yellow-500" />
          </CardHeader>
          <CardContent className="space-y-2">
            {rankings.slice(0, 5).map((g) => (
              <Link
                key={g.id}
                href="/rankings"
                className="flex items-center gap-3 rounded-md border p-3 transition-colors hover:bg-accent"
              >
                <span className="w-6 text-center text-sm font-bold text-muted-foreground">
                  {g.rank}
                </span>
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: g.color }}
                />
                <span className="flex-1 font-medium">{g.name}</span>
                {g.gapToLeader > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {formatSigned(-g.gapToLeader)}
                  </span>
                )}
                <Badge variant="secondary">{g.totalScore} pts</Badge>
              </Link>
            ))}
            {rankings.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No groups yet.
              </p>
            )}
          </CardContent>
        </Card>

        {isAdmin && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Recent Activity</CardTitle>
                <CardDescription>Latest actions across the camp</CardDescription>
              </div>
              <Activity className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-3">
              {activity.map((log) => (
                <div key={log.id} className="flex items-start gap-3 text-sm">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate">
                      {log.message ?? `${log.action} ${log.entity}`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {log.user?.name ?? "System"} · {timeAgo(log.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
              {activity.length === 0 && (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No activity recorded yet.
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
