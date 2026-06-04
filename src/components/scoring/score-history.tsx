"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { History, Search, Trash2 } from "lucide-react";

import { deleteScoreEntry } from "@/server/actions/scoring";
import { SCORE_CATEGORIES, PAGE_SIZE } from "@/lib/constants";
import { cn, formatDateTime, formatSigned } from "@/lib/utils";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DataPagination } from "@/components/shared/data-pagination";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

export interface ScoreEntryRecord {
  id: string;
  points: number;
  category: string;
  reason: string;
  createdAt: Date | string;
  group: { name: string; color: string } | null;
  staff: { name: string } | null;
}

const ALL = "__all__";

export function ScoreHistory({
  entries,
  groups,
  isAdmin,
}: {
  entries: ScoreEntryRecord[];
  groups: { id: string; name: string }[];
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [groupFilter, setGroupFilter] = useState(ALL);
  const [categoryFilter, setCategoryFilter] = useState(ALL);
  const [page, setPage] = useState(1);
  const [, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries.filter((e) => {
      const matchesQuery = q === "" || e.reason.toLowerCase().includes(q);
      const matchesGroup =
        groupFilter === ALL || e.group?.name === groupFilter;
      const matchesCategory =
        categoryFilter === ALL || e.category === categoryFilter;
      return matchesQuery && matchesGroup && matchesCategory;
    });
  }, [entries, query, groupFilter, categoryFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const paged = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteScoreEntry(id);
      if (result.ok) {
        toast.success(result.message ?? "Reverted");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search reason…"
            className="pl-9"
          />
        </div>
        <Select
          value={groupFilter}
          onValueChange={(v) => {
            setGroupFilter(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="Group" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All groups</SelectItem>
            {groups.map((g) => (
              <SelectItem key={g.id} value={g.name}>
                {g.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={categoryFilter}
          onValueChange={(v) => {
            setCategoryFilter(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All categories</SelectItem>
            {SCORE_CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={History}
          title="No score entries"
          description="Awarded and deducted points will appear here."
        />
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="hidden md:table-cell">When</TableHead>
                <TableHead>Group</TableHead>
                <TableHead className="hidden sm:table-cell">Category</TableHead>
                <TableHead className="text-right">Points</TableHead>
                <TableHead className="hidden lg:table-cell">Reason</TableHead>
                <TableHead className="hidden xl:table-cell">By</TableHead>
                {isAdmin && <TableHead className="w-[44px]" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="hidden whitespace-nowrap text-xs text-muted-foreground md:table-cell">
                    {formatDateTime(e.createdAt)}
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1.5">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: e.group?.color ?? "#94a3b8" }}
                      />
                      <span className="font-medium">
                        {e.group?.name ?? "—"}
                      </span>
                    </span>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge variant="outline">{e.category}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <span
                      className={cn(
                        "font-semibold",
                        e.points >= 0 ? "text-green-600" : "text-destructive",
                      )}
                    >
                      {formatSigned(e.points)}
                    </span>
                  </TableCell>
                  <TableCell className="hidden max-w-[280px] truncate lg:table-cell">
                    {e.reason}
                  </TableCell>
                  <TableCell className="hidden text-sm text-muted-foreground xl:table-cell">
                    {e.staff?.name ?? "—"}
                  </TableCell>
                  {isAdmin && (
                    <TableCell>
                      <ConfirmDialog
                        destructive
                        title="Revert this entry?"
                        description="This removes the entry and adjusts the group's total accordingly."
                        confirmText="Revert"
                        onConfirm={() => handleDelete(e.id)}
                        trigger={
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        }
                      />
                    </TableCell>
                  )}
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
    </div>
  );
}
