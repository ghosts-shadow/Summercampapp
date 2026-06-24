"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { setGroupLeaders } from "@/server/actions/groups";
import { LeaderMultiSelect } from "@/components/groups/leader-multi-select";
import { Button } from "@/components/ui/button";

export function GroupLeaderSelect({
  groupId,
  leaderIds: initialLeaderIds,
  primaryLeaderId,
  staff,
}: {
  groupId: string;
  leaderIds: string[];
  primaryLeaderId: string | null;
  staff: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [leaderIds, setLeaderIds] = useState<string[]>(initialLeaderIds);
  const [primaryId, setPrimaryId] = useState<string>(primaryLeaderId ?? "");

  const dirty =
    primaryId !== (primaryLeaderId ?? "") ||
    leaderIds.length !== initialLeaderIds.length ||
    leaderIds.some((id) => !initialLeaderIds.includes(id));

  function save() {
    startTransition(async () => {
      const result = await setGroupLeaders(groupId, leaderIds, primaryId || null);
      if (result.ok) {
        toast.success(result.message ?? "Updated");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="w-full sm:w-[260px] space-y-2">
      <LeaderMultiSelect
        staff={staff}
        leaderIds={leaderIds}
        primaryId={primaryId}
        onChange={(ids, primary) => {
          setLeaderIds(ids);
          setPrimaryId(primary);
        }}
        disabled={pending}
      />
      {dirty && (
        <Button size="sm" onClick={save} disabled={pending} className="w-full">
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          Save leaders
        </Button>
      )}
    </div>
  );
}
