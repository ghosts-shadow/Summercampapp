/**
 * One-off backfill: create a GroupLeadership row for every existing group
 * that already has a primary `leaderId`, so current leaders keep management
 * access after the multi-leader migration.
 *
 * Safe to run multiple times (idempotent via skipDuplicates + the
 * @@unique([groupId, userId]) constraint).
 *
 *   npx tsx prisma/backfill-leaderships.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const groups = await prisma.group.findMany({
    where: { leaderId: { not: null } },
    select: { id: true, leaderId: true },
  });

  if (groups.length === 0) {
    console.log("No groups with a primary leader — nothing to backfill.");
    return;
  }

  const result = await prisma.groupLeadership.createMany({
    data: groups.map((g) => ({ groupId: g.id, userId: g.leaderId! })),
    skipDuplicates: true,
  });

  console.log(
    `✅  Backfilled ${result.count} leadership row(s) from ${groups.length} group(s) with a primary leader.`,
  );
}

main()
  .catch((e) => {
    console.error("Backfill failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
