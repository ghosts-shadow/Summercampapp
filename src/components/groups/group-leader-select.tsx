"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, UserCog } from "lucide-react";

import { setGroupLeader } from "@/server/actions/groups";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const NONE = "__none__";

export function GroupLeaderSelect({
  groupId,
  leaderId,
  staff,
}: {
  groupId: string;
  leaderId: string | null;
  staff: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onChange(value: string) {
    const next = value === NONE ? null : value;
    startTransition(async () => {
      const result = await setGroupLeader(groupId, next);
      if (result.ok) {
        toast.success(result.message ?? "Updated");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="space-y-1.5">
      <Label className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-muted-foreground">
        <UserCog className="h-3.5 w-3.5" /> Group leader
      </Label>
      <Select value={leaderId ?? NONE} onValueChange={onChange} disabled={pending}>
        <SelectTrigger className="w-full sm:w-[240px]">
          {pending ? (
            <span className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Saving…
            </span>
          ) : (
            <SelectValue placeholder="No leader assigned" />
          )}
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE}>No leader</SelectItem>
          {staff.map((s) => (
            <SelectItem key={s.id} value={s.id}>
              {s.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
