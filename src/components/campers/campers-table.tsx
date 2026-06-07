"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Download,
  Eye,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserPlus,
} from "lucide-react";
import { Gender } from "@prisma/client";

import { deleteCamper } from "@/server/actions/campers";
import { GENDER_LABELS, PAGE_SIZE } from "@/lib/constants";
import { formatDate, getInitials } from "@/lib/utils";
import {
  CamperFormDialog,
  type CamperFormData,
} from "@/components/campers/camper-form-dialog";
import { CamperImportDialog } from "@/components/campers/camper-import-dialog";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DataPagination } from "@/components/shared/data-pagination";
import { EmptyState } from "@/components/shared/empty-state";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface CamperRecord {
  id: string;
  firstName: string;
  lastName: string;
  age: number;
  gender: Gender;
  guardianName: string;
  guardianPhone: string;
  emergencyContact: string;
  medicalNotes: string | null;
  registrationDate: Date | string;
  group: { id: string; name: string; color: string } | null;
}

const ALL = "__all__";
const UNASSIGNED = "__unassigned__";

export function CampersTable({
  campers,
  groups,
  isAdmin,
}: {
  campers: CamperRecord[];
  groups: { id: string; name: string }[];
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [groupFilter, setGroupFilter] = useState(ALL);
  const [genderFilter, setGenderFilter] = useState(ALL);
  const [page, setPage] = useState(1);
  const [view, setView] = useState<CamperRecord | null>(null);
  const [, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return campers.filter((c) => {
      const matchesQuery =
        q === "" ||
        `${c.firstName} ${c.lastName}`.toLowerCase().includes(q) ||
        c.guardianName.toLowerCase().includes(q) ||
        c.guardianPhone.toLowerCase().includes(q);
      const matchesGroup =
        groupFilter === ALL ||
        (groupFilter === UNASSIGNED ? c.group === null : c.group?.id === groupFilter);
      const matchesGender = genderFilter === ALL || c.gender === genderFilter;
      return matchesQuery && matchesGroup && matchesGender;
    });
  }, [campers, query, groupFilter, genderFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const paged = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  function resetPageAnd<T>(setter: (v: T) => void) {
    return (value: T) => {
      setter(value);
      setPage(1);
    };
  }

  function handleDelete(camper: CamperRecord) {
    startTransition(async () => {
      const result = await deleteCamper(camper.id);
      if (result.ok) {
        toast.success(result.message ?? "Deleted");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function toFormData(c: CamperRecord): CamperFormData {
    return {
      id: c.id,
      firstName: c.firstName,
      lastName: c.lastName,
      age: c.age,
      gender: c.gender,
      guardianName: c.guardianName,
      guardianPhone: c.guardianPhone,
      emergencyContact: c.emergencyContact,
      medicalNotes: c.medicalNotes,
      groupId: c.group?.id ?? null,
    };
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => resetPageAnd(setQuery)(e.target.value)}
            placeholder="Search name, guardian, phone…"
            className="pl-9"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select value={groupFilter} onValueChange={resetPageAnd(setGroupFilter)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Group" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All groups</SelectItem>
              <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>
              {groups.map((g) => (
                <SelectItem key={g.id} value={g.id}>
                  {g.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={genderFilter} onValueChange={resetPageAnd(setGenderFilter)}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All genders</SelectItem>
              {Object.values(Gender).map((g) => (
                <SelectItem key={g} value={g}>
                  {GENDER_LABELS[g]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {isAdmin && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Download className="h-4 w-4" /> Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <a href="/api/export/campers?format=csv">Export as CSV</a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href="/api/export/campers?format=xlsx">Export as Excel</a>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {isAdmin && <CamperImportDialog />}
          {isAdmin && (
            <CamperFormDialog
              groups={groups}
              trigger={
                <Button>
                  <Plus className="h-4 w-4" /> Add camper
                </Button>
              }
            />
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={UserPlus}
          title="No campers found"
          description={
            campers.length === 0
              ? "Add your first camper to get started."
              : "Try adjusting your search or filters."
          }
        />
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Camper</TableHead>
                <TableHead className="hidden sm:table-cell">Age</TableHead>
                <TableHead className="hidden md:table-cell">Gender</TableHead>
                <TableHead>Group</TableHead>
                <TableHead className="hidden lg:table-cell">Guardian</TableHead>
                <TableHead className="hidden xl:table-cell">Registered</TableHead>
                <TableHead className="w-[60px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {getInitials(`${c.firstName} ${c.lastName}`)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate font-medium">
                          {c.firstName} {c.lastName}
                        </p>
                        <p className="truncate text-xs text-muted-foreground sm:hidden">
                          Age {c.age}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">{c.age}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    {GENDER_LABELS[c.gender]}
                  </TableCell>
                  <TableCell>
                    {c.group ? (
                      <span className="inline-flex items-center gap-1.5 text-sm">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: c.group.color }}
                        />
                        {c.group.name}
                      </span>
                    ) : (
                      <Badge variant="outline">Unassigned</Badge>
                    )}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <p className="text-sm">{c.guardianName}</p>
                    <p className="text-xs text-muted-foreground">
                      {c.guardianPhone}
                    </p>
                  </TableCell>
                  <TableCell className="hidden xl:table-cell text-sm text-muted-foreground">
                    {formatDate(c.registrationDate)}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setView(c)}>
                          <Eye className="h-4 w-4" /> View details
                        </DropdownMenuItem>
                        {isAdmin && (
                          <>
                            <CamperFormDialog
                              groups={groups}
                              camper={toFormData(c)}
                              trigger={
                                <DropdownMenuItem
                                  onSelect={(e) => e.preventDefault()}
                                >
                                  <Pencil className="h-4 w-4" /> Edit
                                </DropdownMenuItem>
                              }
                            />
                            <DropdownMenuSeparator />
                            <ConfirmDialog
                              destructive
                              title={`Delete ${c.firstName} ${c.lastName}?`}
                              description="This permanently removes the camper and their attendance history."
                              confirmText="Delete"
                              onConfirm={() => handleDelete(c)}
                              trigger={
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onSelect={(e) => e.preventDefault()}
                                >
                                  <Trash2 className="h-4 w-4" /> Delete
                                </DropdownMenuItem>
                              }
                            />
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="px-3 pb-3">
            <DataPagination
              page={currentPage}
              pageSize={PAGE_SIZE}
              total={filtered.length}
              onPageChange={setPage}
            />
          </div>
        </div>
      )}

      <Dialog open={!!view} onOpenChange={(o) => !o && setView(null)}>
        <DialogContent>
          {view && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {view.firstName} {view.lastName}
                </DialogTitle>
                <DialogDescription>
                  Registered {formatDate(view.registrationDate)}
                </DialogDescription>
              </DialogHeader>
              <dl className="grid grid-cols-2 gap-4 text-sm">
                <Detail label="Age" value={String(view.age)} />
                <Detail label="Gender" value={GENDER_LABELS[view.gender]} />
                <Detail label="Group" value={view.group?.name ?? "Unassigned"} />
                <Detail label="Guardian" value={view.guardianName} />
                <Detail label="Parent phone" value={view.guardianPhone} />
                <Detail
                  label="Emergency contact"
                  value={view.emergencyContact}
                  full
                />
                <Detail
                  label="Medical notes"
                  value={view.medicalNotes || "None on file"}
                  full
                />
              </dl>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Detail({
  label,
  value,
  full,
}: {
  label: string;
  value: string;
  full?: boolean;
}) {
  return (
    <div className={full ? "col-span-2" : ""}>
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-0.5 font-medium">{value}</dd>
    </div>
  );
}
