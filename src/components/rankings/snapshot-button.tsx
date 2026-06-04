"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Camera, Loader2 } from "lucide-react";

import { takeRankingSnapshot } from "@/server/actions/scoring";
import { Button } from "@/components/ui/button";

export function SnapshotButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function snapshot() {
    startTransition(async () => {
      const result = await takeRankingSnapshot();
      if (result.ok) {
        toast.success(result.message ?? "Snapshot saved");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Button variant="outline" onClick={snapshot} disabled={pending}>
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Camera className="h-4 w-4" />
      )}
      Save snapshot
    </Button>
  );
}
