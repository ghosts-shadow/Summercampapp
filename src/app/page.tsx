import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Clock,
  Trophy,
  Users,
  Tent,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { CAMP } from "@/lib/constants";

export default function LandingPage() {
  const facts = [
    { icon: Users, label: "Ages", value: CAMP.ageRange },
    { icon: Tent, label: "Type", value: CAMP.type },
    { icon: CalendarDays, label: "Dates", value: CAMP.dates },
    { icon: Clock, label: "Daily", value: CAMP.hours },
  ];

  return (
    <div className="flex min-h-dvh flex-col bg-gradient-to-b from-background via-background to-primary/5">
      <header className="container flex items-center justify-between py-6">
        <div className="flex items-center gap-2 font-semibold">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Tent className="h-5 w-5" />
          </div>
          <span>{CAMP.shortName}</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button asChild variant="ghost">
            <Link href="/leaderboard">Leaderboard</Link>
          </Button>
          <Button asChild>
            <Link href="/login">Staff Login</Link>
          </Button>
        </div>
      </header>

      <main className="container flex flex-1 flex-col items-center justify-center py-16 text-center">
        <span className="mb-4 inline-flex items-center rounded-full border bg-card px-4 py-1.5 text-sm text-muted-foreground shadow-sm">
          🏕️ Summer {CAMP.dates.split(",")[1] ?? "2026"} Registration Open
        </span>
        <h1 className="max-w-4xl text-balance text-4xl font-bold tracking-tight sm:text-6xl">
          {CAMP.name}
        </h1>
        <p className="mt-6 max-w-2xl text-pretty text-lg text-muted-foreground">
          A modern management system for camp staff to organize campers, track
          groups, record attendance, award points, and celebrate the winning
          teams on a live leaderboard.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link href="/login">
              Staff Sign In <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/leaderboard">
              <Trophy className="h-4 w-4" /> View Live Leaderboard
            </Link>
          </Button>
        </div>

        <div className="mt-16 grid w-full max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4">
          {facts.map((f) => (
            <div
              key={f.label}
              className="rounded-xl border bg-card p-4 text-left shadow-sm"
            >
              <f.icon className="mb-2 h-5 w-5 text-primary" />
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                {f.label}
              </p>
              <p className="font-semibold">{f.value}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="container py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} {CAMP.name}. All rights reserved.
      </footer>
    </div>
  );
}
