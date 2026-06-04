"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCheck, Loader2, Save } from "lucide-react";
import { AttendanceStatus } from "@prisma/client";

import { fetchAttendance, saveAttendance } from "@/server/actions/attendance";
import { ATTENDANCE_STATUS_META } from "@/lib/constants";
import { cn, getInitials } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CamperLite {
  id: string;
  firstName: string;
  lastName: string;
}

const STATUS_ORDER: AttendanceStatus[] = [
  "PRESENT",
  "LATE",
  "EXCUSED",
  "ABSENT",
];

export function AttendanceSheet({
  groups,
  campersByGroup,
  defaultDate,
}: {
  groups: { id: string; name: string; color: string }[];
  campersByGroup: Record<string, CamperLite[]>;
  defaultDate: string;
}) {
  const router = useRouter();
  const [groupId, setGroupId] = useState(groups[0]?.id ?? "");
  const [date, setDate] = useState(defaultDate);
  const [statuses, setStatuses] = useState<Record<string, AttendanceStatus>>({});
  const [loading, setLoading] = useState(false);
  const [saving, startSaving] = useTransition();

  const campers = groupId ? (campersByGroup[groupId] ?? []) : [];

  useEffect(() => {
    if (!groupId || !date) return;
    let cancelled = false;
    setLoading(true);
    fetchAttendance(groupId, date)
      .then((existing) => {
        if (cancelled) return;
        const next: Record<string, AttendanceStatus> = {};
        for (const c of campersByGroup[groupId] ?? []) {
          next[c.id] = existing[c.id]?.status ?? AttendanceStatus.PRESENT;
        }
        setStatuses(next);
      })
      .catch(() => toast.error("Could not load attendance."))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [groupId, date, campersByGroup]);

  function setAll(status: AttendanceStatus) {
    const next: Record<string, AttendanceStatus> = {};
    for (const c of campers) next[c.id] = status;
    setStatuses(next);
  }

  function save() {
    if (!groupId) return toast.error("Select a group.");
    if (campers.length === 0) return toast.error("This group has no campers.");
    startSaving(async () => {
      const result = await saveAttendance({
        groupId,
        date,
        records: campers.map((c) => ({
          camperId: c.id,
          status: statuses[c.id] ?? AttendanceStatus.PRESENT,
        })),
      });
      if (result.ok) {
        toast.success(result.message ?? "Saved");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  const counts = STATUS_ORDER.reduce(
    (acc, s) => {
      acc[s] = campers.filter((c) => statuses[c.id] === s).length;
      return acc;
    },
    {} as Record<AttendanceStatus, number>,
  );

  return (
    <Card>
      <CardHeader className="gap-4 border-b sm:flex-row sm:items-end sm:justify-between">
        <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
          <div className="space-y-1.5">
            <Label>Group</Label>
            <Select value={groupId} onValueChange={setGroupId}>
              <SelectTrigger className="sm:w-[200px]">
                <SelectValue placeholder="Select a group" />
              </SelectTrigger>
              <SelectContent>
                {groups.map((g) => (
                  <SelectItem key={g.id} value={g.id}>
                    {g.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="att-date">Date</Label>
            <Input
              id="att-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="sm:w-[180px]"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setAll(AttendanceStatus.PRESENT)}>
            <CheckCheck className="h-4 w-4" /> All present
          </Button>
          <Button onClick={save} disabled={saving || loading}>
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-5">
        <div className="mb-4 flex flex-wrap gap-2">
          {STATUS_ORDER.map((s) => (
            <span
              key={s}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium",
                ATTENDANCE_STATUS_META[s].badge,
              )}
            >
              {ATTENDANCE_STATUS_META[s].label}: {counts[s]}
            </span>
          ))}
        </div>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : campers.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            No campers in this group.
          </p>
        ) : (
          <ul className="divide-y rounded-lg border">
            {campers.map((c) => (
              <li
                key={c.id}
                className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {getInitials(`${c.firstName} ${c.lastName}`)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium">
                    {c.firstName} {c.lastName}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {STATUS_ORDER.map((s) => {
                    const active = statuses[c.id] === s;
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() =>
                          setStatuses((prev) => ({ ...prev, [c.id]: s }))
                        }
                        className={cn(
                          "rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
                          active
                            ? "text-white shadow-sm"
                            : "bg-background text-muted-foreground hover:bg-accent",
                        )}
                        style={
                          active
                            ? {
                                backgroundColor: ATTENDANCE_STATUS_META[s].color,
                                borderColor: ATTENDANCE_STATUS_META[s].color,
                              }
                            : undefined
                        }
                      >
                        {ATTENDANCE_STATUS_META[s].label}
                      </button>
                    );
                  })}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
