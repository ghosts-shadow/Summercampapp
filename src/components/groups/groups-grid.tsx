"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  Trophy,
  UsersRound,
} from "lucide-react";

import { deleteGroup } from "@/server/actions/groups";
import {
  GroupFormDialog,
  type GroupFormData,
} from "@/components/groups/group-form-dialog";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface GroupRecord {
  id: string;
  name: string;
  color: string;
  description: string | null;
  totalScore: number;
  leader: { id: string; name: string } | null;
  camperCount: number;
}

export function GroupsGrid({
  groups,
  staff,
  isAdmin,
}: {
  groups: GroupRecord[];
  staff: { id: string; name: string }[];
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteGroup(id);
      if (result.ok) {
        toast.success(result.message ?? "Deleted");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {groups.map((g) => {
        const formData: GroupFormData = {
          id: g.id,
          name: g.name,
          color: g.color,
          description: g.description,
          leaderId: g.leader?.id ?? null,
        };
        return (
          <Card key={g.id} className="overflow-hidden">
            <div className="h-2" style={{ backgroundColor: g.color }} />
            <CardContent className="pt-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="h-3.5 w-3.5 rounded-full"
                    style={{ backgroundColor: g.color }}
                  />
                  <h3 className="text-lg font-semibold">{g.name}</h3>
                </div>
                {isAdmin && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <GroupFormDialog
                        staff={staff}
                        group={formData}
                        trigger={
                          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                            <Pencil className="h-4 w-4" /> Edit
                          </DropdownMenuItem>
                        }
                      />
                      <DropdownMenuSeparator />
                      <ConfirmDialog
                        destructive
                        title={`Delete ${g.name}?`}
                        description="Campers in this group will become unassigned. Scores and attendance for the group are removed."
                        confirmText="Delete"
                        onConfirm={() => handleDelete(g.id)}
                        trigger={
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onSelect={(e) => e.preventDefault()}
                          >
                            <Trash2 className="h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        }
                      />
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>

              <p className="mt-1 min-h-[2.5rem] text-sm text-muted-foreground">
                {g.description || "No description."}
              </p>

              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm">
                  <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                    <UsersRound className="h-4 w-4" /> {g.camperCount}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Trophy className="h-4 w-4 text-yellow-500" />
                    <span className="font-semibold">{g.totalScore}</span>
                  </span>
                </div>
                <Badge variant="secondary">
                  {g.leader ? g.leader.name : "No leader"}
                </Badge>
              </div>

              <Button asChild variant="outline" className="mt-4 w-full">
                <Link href={`/groups/${g.id}`}>Manage group</Link>
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
