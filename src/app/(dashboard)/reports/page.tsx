import type { Metadata } from "next";
import Link from "next/link";
import {
  Award,
  ClipboardCheck,
  Download,
  FileSpreadsheet,
  Trophy,
  Users,
  type LucideIcon,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = { title: "Reports" };

interface ReportDef {
  key: string;
  title: string;
  description: string;
  icon: LucideIcon;
  endpoint: string;
}

const REPORTS: ReportDef[] = [
  {
    key: "campers",
    title: "Camper List",
    description: "All registered campers with guardian and group details.",
    icon: Users,
    endpoint: "/api/export/campers",
  },
  {
    key: "scores",
    title: "Group Scores",
    description: "The complete scoring ledger with categories and reasons.",
    icon: Award,
    endpoint: "/api/export/scores",
  },
  {
    key: "rankings",
    title: "Rankings",
    description: "Current standings ordered by total points.",
    icon: Trophy,
    endpoint: "/api/export/rankings",
  },
  {
    key: "attendance",
    title: "Attendance",
    description: "Per-camper attendance records across all sessions.",
    icon: ClipboardCheck,
    endpoint: "/api/export/attendance",
  },
];

export default async function ReportsPage() {
  // Bulk exports contain camper PII — restrict the whole reports area to admins.
  await requireAdmin();

  const [campers, groups, scoreEntries, sessions] = await Promise.all([
    prisma.camper.count(),
    prisma.group.count(),
    prisma.scoreEntry.count(),
    prisma.attendance.count(),
  ]);

  const stats = [
    { label: "Campers", value: campers },
    { label: "Groups", value: groups },
    { label: "Score entries", value: scoreEntries },
    { label: "Attendance sessions", value: sessions },
  ];

  return (
    <div>
      <PageHeader
        title="Reports"
        description="Generate and export camp reports as CSV or Excel."
      />

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-6">
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {REPORTS.map((r) => (
          <Card key={r.key}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <r.icon className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base">{r.title}</CardTitle>
                  <CardDescription>{r.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex gap-2">
              <Button asChild variant="outline" className="flex-1">
                <Link href={`${r.endpoint}?format=csv`}>
                  <Download className="h-4 w-4" /> CSV
                </Link>
              </Button>
              <Button asChild className="flex-1">
                <Link href={`${r.endpoint}?format=xlsx`}>
                  <FileSpreadsheet className="h-4 w-4" /> Excel
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
