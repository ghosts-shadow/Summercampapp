"use client";

import { Star } from "lucide-react";

import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

/**
 * Pick the staff who lead a group, and mark exactly one as the primary leader.
 * - Toggling a checkbox adds/removes a leader.
 * - The star marks the primary (the only one who can rename the group).
 * - Removing the current primary auto-promotes the first remaining leader.
 * - Adding the first leader auto-makes them primary.
 */
export function LeaderMultiSelect({
  staff,
  leaderIds,
  primaryId,
  onChange,
  disabled = false,
}: {
  staff: { id: string; name: string }[];
  leaderIds: string[];
  primaryId: string;
  onChange: (leaderIds: string[], primaryId: string) => void;
  disabled?: boolean;
}) {
  function toggle(id: string) {
    if (leaderIds.includes(id)) {
      const next = leaderIds.filter((x) => x !== id);
      const nextPrimary = primaryId === id ? (next[0] ?? "") : primaryId;
      onChange(next, nextPrimary);
    } else {
      const next = [...leaderIds, id];
      onChange(next, primaryId || id);
    }
  }

  function makePrimary(id: string) {
    if (leaderIds.includes(id)) onChange(leaderIds, id);
    else onChange([...leaderIds, id], id);
  }

  return (
    <div className="space-y-1.5">
      <Label>Group leaders</Label>
      <div className="max-h-52 space-y-0.5 overflow-y-auto rounded-md border p-1">
        {staff.length === 0 ? (
          <p className="px-2 py-1.5 text-sm text-muted-foreground">
            No staff available.
          </p>
        ) : (
          staff.map((s) => {
            const checked = leaderIds.includes(s.id);
            const isPrimary = primaryId === s.id;
            return (
              <div
                key={s.id}
                className={cn(
                  "flex items-center justify-between gap-2 rounded px-2 py-1.5",
                  checked && "bg-muted/50",
                )}
              >
                <label className="flex flex-1 cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={disabled}
                    onChange={() => toggle(s.id)}
                    className="h-4 w-4 accent-primary"
                  />
                  <span className="text-sm">{s.name}</span>
                </label>
                <button
                  type="button"
                  disabled={disabled || !checked}
                  onClick={() => makePrimary(s.id)}
                  title={isPrimary ? "Primary leader" : "Make primary"}
                  className={cn(
                    "flex items-center gap-1 rounded px-1.5 py-0.5 text-xs transition-colors disabled:opacity-40",
                    isPrimary
                      ? "text-yellow-600"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Star
                    className={cn(
                      "h-3.5 w-3.5",
                      isPrimary && "fill-yellow-500 text-yellow-500",
                    )}
                  />
                  {isPrimary && "Primary"}
                </button>
              </div>
            );
          })
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        The starred leader is primary and can rename the group. A primary is
        required once any leader is assigned.
      </p>
    </div>
  );
}
