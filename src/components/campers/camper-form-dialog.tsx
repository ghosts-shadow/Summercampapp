"use client";

import { type ReactNode, useState, useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Gender } from "@prisma/client";

import { camperSchema, type CamperInput } from "@/lib/validations";
import { createCamper, updateCamper } from "@/server/actions/campers";
import { GENDER_LABELS } from "@/lib/constants";
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

export interface CamperFormData {
  id: string;
  firstName: string;
  lastName: string;
  age: number;
  gender: Gender;
  guardianName: string;
  guardianPhone: string;
  emergencyContact: string;
  medicalNotes: string | null;
  groupId: string | null;
}

export function CamperFormDialog({
  groups,
  camper,
  trigger,
}: {
  groups: { id: string; name: string }[];
  camper?: CamperFormData;
  trigger: ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const isEdit = Boolean(camper);

  const {
    register,
    handleSubmit,
    control,
    reset,
    setError,
    formState: { errors },
  } = useForm<CamperInput>({
    resolver: zodResolver(camperSchema),
    defaultValues: {
      firstName: camper?.firstName ?? "",
      lastName: camper?.lastName ?? "",
      age: camper?.age,
      gender: camper?.gender ?? Gender.UNSPECIFIED,
      guardianName: camper?.guardianName ?? "",
      guardianPhone: camper?.guardianPhone ?? "",
      emergencyContact: camper?.emergencyContact ?? "",
      medicalNotes: camper?.medicalNotes ?? "",
      groupId: camper?.groupId ?? "",
    },
  });

  function onSubmit(values: CamperInput) {
    startTransition(async () => {
      const result = isEdit
        ? await updateCamper({ ...values, id: camper!.id })
        : await createCamper(values);

      if (result.ok) {
        toast.success(result.message ?? "Saved");
        setOpen(false);
        if (!isEdit) reset();
        router.refresh();
      } else {
        if (result.fieldErrors) {
          for (const [field, msgs] of Object.entries(result.fieldErrors)) {
            if (msgs?.[0]) setError(field as keyof CamperInput, { message: msgs[0] });
          }
        }
        toast.error(result.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit camper" : "Add camper"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update this camper's details."
              : "Register a new camper for the program."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="firstName">First name</Label>
              <Input id="firstName" {...register("firstName")} />
              {errors.firstName && (
                <p className="text-xs text-destructive">{errors.firstName.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lastName">Last name</Label>
              <Input id="lastName" {...register("lastName")} />
              {errors.lastName && (
                <p className="text-xs text-destructive">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="age">Age</Label>
              <Input id="age" type="number" min={8} max={18} {...register("age")} />
              {errors.age && (
                <p className="text-xs text-destructive">{errors.age.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Gender</Label>
              <Controller
                control={control}
                name="gender"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(Gender).map((g) => (
                        <SelectItem key={g} value={g}>
                          {GENDER_LABELS[g]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Group</Label>
            <Controller
              control={control}
              name="groupId"
              render={({ field }) => (
                <Select
                  value={field.value ? field.value : NONE}
                  onValueChange={(v) => field.onChange(v === NONE ? "" : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>Unassigned</SelectItem>
                    {groups.map((g) => (
                      <SelectItem key={g.id} value={g.id}>
                        {g.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="guardianName">Parent / guardian</Label>
              <Input id="guardianName" {...register("guardianName")} />
              {errors.guardianName && (
                <p className="text-xs text-destructive">
                  {errors.guardianName.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="guardianPhone">Parent phone</Label>
              <Input id="guardianPhone" {...register("guardianPhone")} />
              {errors.guardianPhone && (
                <p className="text-xs text-destructive">
                  {errors.guardianPhone.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="emergencyContact">Emergency contact</Label>
            <Input
              id="emergencyContact"
              placeholder="Name — phone number"
              {...register("emergencyContact")}
            />
            {errors.emergencyContact && (
              <p className="text-xs text-destructive">
                {errors.emergencyContact.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="medicalNotes">Medical notes</Label>
            <Textarea
              id="medicalNotes"
              placeholder="Allergies, medications, conditions…"
              {...register("medicalNotes")}
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
              {isEdit ? "Save changes" : "Add camper"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
