"use client";

import { useEffect, useState } from "react";
import { RadioTower } from "lucide-react";

import type { RankedGroup } from "@/lib/rankings";
import { Leaderboard } from "@/components/rankings/leaderboard";

const POLL_MS = 10_000;

export function LiveLeaderboard({ initial }: { initial: RankedGroup[] }) {
  const [groups, setGroups] = useState<RankedGroup[]>(initial);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  useEffect(() => {
    let active = true;
    setUpdatedAt(new Date());

    async function tick() {
      try {
        const res = await fetch("/api/leaderboard", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as {
          groups: RankedGroup[];
          updatedAt: string;
        };
        if (active) {
          setGroups(data.groups);
          setUpdatedAt(new Date(data.updatedAt));
        }
      } catch {
        // Network blip — keep showing the last good data.
      }
    }

    const id = setInterval(tick, POLL_MS);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
        </span>
        <RadioTower className="h-3.5 w-3.5" />
        Live · auto-updates every {POLL_MS / 1000}s
        {updatedAt && (
          <span className="hidden sm:inline">
            · updated{" "}
            {updatedAt.toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
              second: "2-digit",
            })}
          </span>
        )}
      </div>
      <Leaderboard groups={groups} />
    </div>
  );
}
