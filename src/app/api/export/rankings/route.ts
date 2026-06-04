import { getRankings } from "@/lib/rankings";
import { getSessionUser } from "@/lib/session";
import { buildExportResponse } from "@/lib/export-response";
import type { Column } from "@/lib/export";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Row = {
  rank: number;
  group: string;
  points: number;
  campers: number;
  leader: string;
  gapToLeader: number;
};

export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const format = new URL(req.url).searchParams.get("format");
  const rankings = await getRankings();

  const rows: Row[] = rankings.map((g) => ({
    rank: g.rank,
    group: g.name,
    points: g.totalScore,
    campers: g.camperCount,
    leader: g.leaderName ?? "—",
    gapToLeader: g.gapToLeader,
  }));

  const columns: Column<Row>[] = [
    { key: "rank", header: "Rank", width: 8 },
    { key: "group", header: "Group", width: 20 },
    { key: "points", header: "Points", width: 10 },
    { key: "campers", header: "Campers", width: 10 },
    { key: "leader", header: "Leader", width: 20 },
    { key: "gapToLeader", header: "Gap to #1", width: 12 },
  ];

  return buildExportResponse({
    format,
    filename: "rankings",
    sheetName: "Rankings",
    columns,
    rows,
  });
}
