import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink } from "lucide-react";

import { getRankings } from "@/lib/rankings";
import { requireUser } from "@/lib/session";
import { PageHeader } from "@/components/shared/page-header";
import { Leaderboard } from "@/components/rankings/leaderboard";
import { SnapshotButton } from "@/components/rankings/snapshot-button";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Rankings" };

export default async function RankingsPage() {
  const user = await requireUser();
  const rankings = await getRankings();

  return (
    <div>
      <PageHeader
        title="Rankings"
        description="Live standings ordered by total points."
      >
        {user.role === "ADMIN" && <SnapshotButton />}
        <Button asChild variant="outline">
          <Link href="/leaderboard" target="_blank">
            <ExternalLink className="h-4 w-4" /> Public view
          </Link>
        </Button>
      </PageHeader>

      <Leaderboard groups={rankings} />
    </div>
  );
}
