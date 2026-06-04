import { NextResponse } from "next/server";
import { snapshotRankings } from "@/lib/rankings";

export const dynamic = "force-dynamic";

/**
 * Capture a ranking snapshot. Intended to be triggered by a Vercel Cron job.
 *
 * Protect it by setting CRON_SECRET in the environment; Vercel Cron sends it
 * as `Authorization: Bearer <CRON_SECRET>`. If CRON_SECRET is unset, the
 * endpoint is disabled to avoid accidental public access.
 *
 * Example vercel.json crons entry:
 *   { "path": "/api/cron/snapshot", "schedule": "0 20 * * *" }
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Cron is not configured." }, { status: 404 });
  }

  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const count = await snapshotRankings();
  return NextResponse.json({ ok: true, groups: count, at: new Date().toISOString() });
}
