import { prisma } from "@/lib/prisma";

/** All managed category names, sorted. */
export async function getCategoryNames(): Promise<string[]> {
  const cats = await prisma.scoreCategory.findMany({
    orderBy: { name: "asc" },
    select: { name: true },
  });
  return cats.map((c) => c.name);
}

/** Managed categories with ids (for the management UI). */
export async function getCategories(): Promise<{ id: string; name: string }[]> {
  return prisma.scoreCategory.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
}
