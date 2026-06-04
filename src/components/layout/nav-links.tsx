"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Award,
  Boxes,
  ClipboardCheck,
  FileText,
  LayoutDashboard,
  type LucideIcon,
  ShieldCheck,
  Trophy,
  Users,
} from "lucide-react";
import type { Role } from "@prisma/client";

import { cn } from "@/lib/utils";

interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  adminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Campers", href: "/campers", icon: Users },
  { title: "Groups", href: "/groups", icon: Boxes },
  { title: "Attendance", href: "/attendance", icon: ClipboardCheck },
  { title: "Scoring", href: "/scoring", icon: Award },
  { title: "Rankings", href: "/rankings", icon: Trophy },
  { title: "Reports", href: "/reports", icon: FileText },
  { title: "Staff", href: "/staff", icon: ShieldCheck, adminOnly: true },
];

export function NavLinks({
  role,
  onNavigate,
}: {
  role: Role;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.filter((item) => !item.adminOnly || role === "ADMIN").map(
        (item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.title}
            </Link>
          );
        },
      )}
    </nav>
  );
}
