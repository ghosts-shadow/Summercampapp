import type { Metadata } from "next";
import Link from "next/link";
import { Trophy } from "lucide-react";

import { getRankings } from "@/lib/rankings";
import { CAMP } from "@/lib/constants";
import { LiveLeaderboard } from "@/components/rankings/live-leaderboard";
import { CampLogo } from "@/components/camp-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Live Leaderboard",
  description: `Live group rankings for ${CAMP.name}.`,
};

export const dynamic = "force-dynamic";

export default async function PublicLeaderboardPage() {
  const rankings = await getRankings();

  return (
    <div className="min-h-dvh bg-gradient-to-b from-background via-background to-primary/5">
      <header className="container flex items-center justify-between py-5">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <CampLogo size={36} />
          <span className="hidden sm:inline">{CAMP.shortName}</span>
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button asChild variant="outline">
            <Link href="/login">Staff Login</Link>
          </Button>
        </div>
      </header>

      <main className="container max-w-4xl pb-20">
        <div className="mb-8 text-center">
          <CampLogo size={96} priority className="mx-auto mb-4 shadow-lg" />
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border bg-card px-4 py-1.5 text-sm shadow-sm">
            <Trophy className="h-4 w-4 text-yellow-500" />
            Group Standings
          </div>
          <h1 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            {CAMP.name}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {CAMP.dates} · {CAMP.hours}
          </p>
        </div>

        <LiveLeaderboard initial={rankings} />
      </main>

      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} {CAMP.name}
      </footer>
    </div>
  );
}
