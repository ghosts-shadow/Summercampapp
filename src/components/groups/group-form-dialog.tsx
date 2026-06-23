"use client";

import { type ReactNode, useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { groupSchema, type GroupInput } from "@/lib/validations";
import { createGroup, updateGroup } from "@/server/actions/groups";
import { TEAM_COLORS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const NONE = "__none__";

export interface GroupFormData {
  id: string;
  name: string;
  color: string;
  description: string | null;
  leaderId: string | null;
}

export function GroupFormDialog({
  staff,
  group,
  trigger,
}: {
  staff: { id: string; name: string }[];
  group?: GroupFormData;
  trigger: ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const isEdit = Boolean(group);

  const {
    register,
    handleSubmit,
    control,
    reset,
    setError,
    watch,
    setValue,
    formState: { errors },
  } = useForm<GroupInput>({
    resolver: zodResolver(groupSchema),
    defaultValues: {
      name: group?.name ?? "",
      color: group?.color ?? TEAM_COLORS[5].hex,
      description: group?.description ?? "",
      leaderId: group?.leaderId ?? "",
    },
  });

  const color = watch("color");

  function onSubmit(values: GroupInput) {
    startTransition(async () => {
      const result = isEdit
        ? await updateGroup({ ...values, id: group!.id })
        : await createGroup(values);

      if (result.ok) {
        toast.success(result.message ?? "Saved");
        setOpen(false);
        if (!isEdit) reset();
        router.refresh();
      } else {
        if (result.fieldErrors) {
          for (const [field, msgs] of Object.entries(result.fieldErrors)) {
            if (msgs?.[0]) setError(field as keyof GroupInput, { message: msgs[0] });
          }
        }
        toast.error(result.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit group" : "Create group"}</DialogTitle>
          <DialogDescription>
            Groups are the teams that campers join and that earn points.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Group name</Label>
            <Input id="name" {...register("name")} placeholder="e.g. Red Lions" />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Group color</Label>
            <div className="flex flex-wrap items-center gap-2">
              {TEAM_COLORS.map((t) => (
                <button
                  type="button"
                  key={t.hex}
                  title={t.name}
                  onClick={() => setValue("color", t.hex, { shouldDirty: true })}
                  className={cn(
                    "h-7 w-7 rounded-full border-2 transition-transform hover:scale-110",
                    (color ?? "").toLowerCase() === t.hex.toLowerCase()
                      ? "border-foreground"
                      : "border-foreground/15",
                  )}
                  style={{ backgroundColor: t.hex }}
                  aria-label={`Select ${t.name}`}
                />
              ))}
              <Controller
                control={control}
                name="color"
                render={({ field }) => (
                  <input
                    type="color"
                    value={field.value}
                    onChange={field.onChange}
                    className="h-7 w-9 cursor-pointer rounded border bg-transparent"
                    aria-label="Custom color"
                  />
                )}
              />
            </div>
            {errors.color && (
              <p className="text-xs text-destructive">{errors.color.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Group leader</Label>
            <Controller
              control={control}
              name="leaderId"
              render={({ field }) => (
                <Select
                  value={field.value ? field.value : NONE}
                  onValueChange={(v) => field.onChange(v === NONE ? "" : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="No leader" />
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
              )}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="A short description of the group…"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEdit ? "Save changes" : "Create group"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
