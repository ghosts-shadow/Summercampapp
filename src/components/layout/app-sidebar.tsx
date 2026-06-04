import Link from "next/link";
import { ExternalLink, Tent } from "lucide-react";
import type { Role } from "@prisma/client";

import { NavLinks } from "@/components/layout/nav-links";
import { CAMP } from "@/lib/constants";

export function AppSidebar({ role }: { role: Role }) {
  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r bg-card md:flex">
      <div className="flex h-16 items-center gap-2 border-b px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Tent className="h-4 w-4" />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold">St. Joseph&apos;s</p>
          <p className="text-xs text-muted-foreground">Summer Camp</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 scrollbar-thin">
        <NavLinks role={role} />
      </div>

      <div className="border-t p-3">
        <Link
          href="/leaderboard"
          target="_blank"
          className="flex items-center justify-between rounded-md border px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <span>Public Leaderboard</span>
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
        <p className="mt-3 px-1 text-[11px] text-muted-foreground">
          {CAMP.dates}
        </p>
      </div>
    </aside>
  );
}
