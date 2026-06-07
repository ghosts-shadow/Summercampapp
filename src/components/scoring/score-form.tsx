"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Minus, Plus, PlusCircle, X } from "lucide-react";

import { createScoreEntry } from "@/server/actions/scoring";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Mode = "award" | "deduct";
const QUICK = [5, 10, 25, 50];
const ADD_CATEGORY = "__add_category__";

export function ScoreForm({
  groups,
  categories,
  canAddCategory = false,
}: {
  groups: { id: string; name: string; color: string }[];
  categories: string[];
  canAddCategory?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [groupId, setGroupId] = useState("");
  const [mode, setMode] = useState<Mode>("award");
  const [points, setPoints] = useState("");
  const [category, setCategory] = useState<string>(categories[0] ?? "General");
  const [addingCategory, setAddingCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState("");
  const [reason, setReason] = useState("");

  function onCategoryChange(value: string) {
    if (value === ADD_CATEGORY) {
      setAddingCategory(true);
      setCustomCategory("");
    } else {
      setCategory(value);
    }
  }

  function submit() {
    const magnitude = Number(points);
    const effectiveCategory = addingCategory ? customCategory.trim() : category;

    if (!groupId) return toast.error("Select a group.");
    if (!magnitude || Number.isNaN(magnitude)) return toast.error("Enter points.");
    if (!effectiveCategory) return toast.error("Enter a category name.");
    if (!reason.trim()) return toast.error("Add a reason.");

    const signed = mode === "deduct" ? -Math.abs(magnitude) : Math.abs(magnitude);

    startTransition(async () => {
      const result = await createScoreEntry({
        groupId,
        points: signed,
        category: effectiveCategory,
        reason: reason.trim(),
      });
      if (result.ok) {
        toast.success(result.message ?? "Points recorded");
        // Keep the (possibly new) category selected; it now appears in the list
        // after refresh because it's persisted on the score entry.
        setCategory(effectiveCategory);
        setAddingCategory(false);
        setCustomCategory("");
        setPoints("");
        setReason("");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Award or deduct points</CardTitle>
        <CardDescription>
          Every entry is logged to the score history and audit trail.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label>Group</Label>
          <Select value={groupId} onValueChange={setGroupId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a group" />
            </SelectTrigger>
            <SelectContent>
              {groups.map((g) => (
                <SelectItem key={g.id} value={g.id}>
                  <span className="inline-flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: g.color }}
                    />
                    {g.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant={mode === "award" ? "default" : "outline"}
            onClick={() => setMode("award")}
            className={cn(mode === "award" && "bg-green-600 hover:bg-green-600/90")}
          >
            <Plus className="h-4 w-4" /> Award
          </Button>
          <Button
            type="button"
            variant={mode === "deduct" ? "default" : "outline"}
            onClick={() => setMode("deduct")}
            className={cn(mode === "deduct" && "bg-destructive hover:bg-destructive/90")}
          >
            <Minus className="h-4 w-4" /> Deduct
          </Button>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="points">Points</Label>
          <Input
            id="points"
            type="number"
            min={1}
            value={points}
            onChange={(e) => setPoints(e.target.value)}
            placeholder="0"
          />
          <div className="flex flex-wrap gap-1.5 pt-1">
            {QUICK.map((q) => (
              <Button
                key={q}
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setPoints(String(q))}
              >
                {mode === "deduct" ? "−" : "+"}
                {q}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={addingCategory ? "new-category" : undefined}>
            Category
          </Label>
          {addingCategory ? (
            <div className="flex gap-2">
              <Input
                id="new-category"
                autoFocus
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder="New category name"
                maxLength={60}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Cancel new category"
                onClick={() => {
                  setAddingCategory(false);
                  setCustomCategory("");
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Select value={category} onValueChange={onCategoryChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
                {canAddCategory && (
                  <>
                    <SelectSeparator />
                    <SelectItem value={ADD_CATEGORY}>
                      <span className="inline-flex items-center gap-2 text-primary">
                        <PlusCircle className="h-4 w-4" /> Add new category…
                      </span>
                    </SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="reason">Reason</Label>
          <Textarea
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Won the relay race"
          />
        </div>

        <Button onClick={submit} disabled={pending} className="w-full">
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          Record {mode === "deduct" ? "deduction" : "points"}
        </Button>
      </CardContent>
    </Card>
  );
}
