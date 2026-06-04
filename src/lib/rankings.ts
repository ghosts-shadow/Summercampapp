import { prisma } from "@/lib/prisma";

export interface RankedGroup {
  id: string;
  name: string;
  color: string;
  description: string | null;
  totalScore: number;
  rank: number;
  camperCount: number;
  leaderName: string | null;
  /** Points behind the #1 group. */
  gapToLeader: number;
  /** Points behind the group directly above. */
  gapToNext: number;
}

/**
 * Current leaderboard, ordered by score. Uses standard competition ranking
 * (ties share a rank, e.g. 1, 2, 2, 4).
 */
export async function getRankings(): Promise<RankedGroup[]> {
  const groups = await prisma.group.findMany({
    orderBy: [{ totalScore: "desc" }, { name: "asc" }],
    include: {
      _count: { select: { campers: true } },
      leader: { select: { name: true } },
    },
  });

  const topScore = groups[0]?.totalScore ?? 0;
  let lastScore: number | null = null;
  let lastRank = 0;

  return groups.map((g, i) => {
    const rank = g.totalScore === lastScore ? lastRank : i + 1;
    lastScore = g.totalScore;
    lastRank = rank;

    return {
      id: g.id,
      name: g.name,
      color: g.color,
      description: g.description,
      totalScore: g.totalScore,
      rank,
      camperCount: g._count.campers,
      leaderName: g.leader?.name ?? null,
      gapToLeader: topScore - g.totalScore,
      gapToNext: i === 0 ? 0 : groups[i - 1].totalScore - g.totalScore,
    };
  });
}

/**
 * Persist a snapshot of the current standings to RankingHistory. Useful to
 * call on a schedule (e.g. a daily Vercel Cron) or after a scoring session.
 */
export async function snapshotRankings(): Promise<number> {
  const ranked = await getRankings();
  if (ranked.length === 0) return 0;

  await prisma.rankingHistory.createMany({
    data: ranked.map((g) => ({
      groupId: g.id,
      rank: g.rank,
      score: g.totalScore,
    })),
  });
  return ranked.length;
}
