"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Search, UserMinus, UserPlus } from "lucide-react";

import { assignCampersToGroup } from "@/server/actions/groups";
import { moveCamper } from "@/server/actions/campers";
import { getInitials } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface CamperLite {
  id: string;
  firstName: string;
  lastName: string;
  age: number;
}

export function GroupMembersManager({
  groupId,
  members,
  unassigned,
  isAdmin,
  canAddMembers = isAdmin,
}: {
  groupId: string;
  members: CamperLite[];
  unassigned: CamperLite[];
  /** Admins may remove members. */
  isAdmin: boolean;
  /** Admins and the group's leaders may add unassigned campers. */
  canAddMembers?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const [pending, startTransition] = useTransition();

  const filteredUnassigned = unassigned.filter((c) =>
    `${c.firstName} ${c.lastName}`.toLowerCase().includes(query.toLowerCase()),
  );

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function addSelected() {
    if (selected.size === 0) return;
    startTransition(async () => {
      const result = await assignCampersToGroup(groupId, [...selected]);
      if (result.ok) {
        toast.success(result.message ?? "Members added");
        setSelected(new Set());
        setOpen(false);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function removeMember(camperId: string) {
    startTransition(async () => {
      const result = await moveCamper({ camperId, groupId: "" });
      if (result.ok) {
        toast.success("Camper removed from group");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          Members{" "}
          <span className="text-sm font-normal text-muted-foreground">
            ({members.length})
          </span>
        </h2>
        {canAddMembers && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button disabled={unassigned.length === 0}>
                <UserPlus className="h-4 w-4" /> Add members
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add campers to this group</DialogTitle>
                <DialogDescription>
                  Choose from campers who are not yet assigned to a group.
                </DialogDescription>
              </DialogHeader>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search unassigned campers…"
                  className="pl-9"
                />
              </div>

              <div className="max-h-72 space-y-1 overflow-y-auto scrollbar-thin">
                {filteredUnassigned.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    No unassigned campers.
                  </p>
                ) : (
                  filteredUnassigned.map((c) => (
                    <label
                      key={c.id}
                      className="flex cursor-pointer items-center gap-3 rounded-md p-2 hover:bg-accent"
                    >
                      <Checkbox
                        checked={selected.has(c.id)}
                        onCheckedChange={() => toggle(c.id)}
                      />
                      <span className="flex-1 text-sm">
                        {c.firstName} {c.lastName}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Age {c.age}
                      </span>
                    </label>
                  ))
                )}
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={pending}
                >
                  Cancel
                </Button>
                <Button onClick={addSelected} disabled={pending || selected.size === 0}>
                  {pending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Add {selected.size > 0 ? `(${selected.size})` : ""}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {members.length === 0 ? (
        <EmptyState
          icon={UserPlus}
          title="No campers in this group"
          description="Add campers to build out this team."
        />
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Camper</TableHead>
                <TableHead>Age</TableHead>
                {isAdmin && (
                  <TableHead className="w-[100px] text-right">Action</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
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
                  </TableCell>
                  <TableCell>{c.age}</TableCell>
                  {isAdmin && (
                    <TableCell className="text-right">
                      <ConfirmDialog
                        title={`Remove ${c.firstName}?`}
                        description="The camper will become unassigned."
                        confirmText="Remove"
                        onConfirm={() => removeMember(c.id)}
                        trigger={
                          <Button variant="ghost" size="sm">
                            <UserMinus className="h-4 w-4" /> Remove
                          </Button>
                        }
                      />
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
