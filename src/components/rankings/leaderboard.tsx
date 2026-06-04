import { Crown, Medal, Minus, TrendingDown } from "lucide-react";

import type { RankedGroup } from "@/lib/rankings";
import { cn, contrastColor } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const MEDAL = ["text-yellow-500", "text-slate-400", "text-amber-700"];

export function Leaderboard({ groups }: { groups: RankedGroup[] }) {
  if (groups.length === 0) {
    return (
      <div className="rounded-lg border border-dashed py-16 text-center text-sm text-muted-foreground">
        No groups to rank yet.
      </div>
    );
  }

  const podium = groups.slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Podium */}
      <div className="grid gap-4 sm:grid-cols-3">
        {podium.map((g) => (
          <Card
            key={g.id}
            className={cn(
              "relative overflow-hidden",
              g.rank === 1 && "sm:-translate-y-2 ring-2 ring-yellow-400/50",
            )}
          >
            <div className="h-1.5" style={{ backgroundColor: g.color }} />
            <CardContent className="pt-6 text-center">
              <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full">
                <span
                  className="flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold shadow-inner"
                  style={{
                    backgroundColor: g.color,
                    color: contrastColor(g.color),
                  }}
                >
                  {g.rank === 1 ? (
                    <Crown className="h-7 w-7" />
                  ) : (
                    <Medal className={cn("h-7 w-7", MEDAL[g.rank - 1])} />
                  )}
                </span>
              </div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                #{g.rank}
              </p>
              <p className="text-lg font-bold">{g.name}</p>
              <p className="mt-1 text-3xl font-extrabold">{g.totalScore}</p>
              <p className="text-xs text-muted-foreground">
                {g.camperCount} campers
                {g.gapToLeader > 0 ? ` · ${g.gapToLeader} behind` : ""}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Full standings */}
      <Card>
        <CardContent className="p-0">
          <ul className="divide-y">
            {groups.map((g) => (
              <li
                key={g.id}
                className="flex items-center gap-4 px-4 py-3 sm:px-6"
              >
                <span className="w-8 text-center text-lg font-bold text-muted-foreground">
                  {g.rank}
                </span>
                <span
                  className="h-4 w-4 shrink-0 rounded-full ring-2 ring-background"
                  style={{ backgroundColor: g.color }}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{g.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {g.camperCount} campers
                    {g.leaderName ? ` · ${g.leaderName}` : ""}
                  </p>
                </div>
                <div className="hidden text-right sm:block">
                  {g.rank === 1 ? (
                    <Badge className="bg-yellow-500 text-yellow-950 hover:bg-yellow-500">
                      Leader
                    </Badge>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      {g.gapToNext > 0 ? (
                        <>
                          <TrendingDown className="h-3 w-3" />
                          {g.gapToNext} to #{g.rank - 1}
                        </>
                      ) : (
                        <Minus className="h-3 w-3" />
                      )}
                    </span>
                  )}
                </div>
                <div className="w-20 text-right">
                  <span className="text-xl font-bold">{g.totalScore}</span>
                  <span className="block text-[10px] uppercase text-muted-foreground">
                    points
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
