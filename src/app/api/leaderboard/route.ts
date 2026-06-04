import { NextResponse } from "next/server";
import { getRankings } from "@/lib/rankings";

export const dynamic = "force-dynamic";

/** Public, read-only rankings feed for the live leaderboard. */
export async function GET() {
  const groups = await getRankings();
  return NextResponse.json(
    { groups, updatedAt: new Date().toISOString() },
    { headers: { "Cache-Control": "no-store" } },
  );
}
