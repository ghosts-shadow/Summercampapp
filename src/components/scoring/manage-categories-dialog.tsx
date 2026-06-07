"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Pencil, Plus, Tags, Trash2, X } from "lucide-react";

import type { ActionResult } from "@/lib/action";
import {
  createCategory,
  deleteCategory,
  renameCategory,
} from "@/server/actions/categories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function ManageCategoriesDialog({
  categories,
}: {
  categories: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  function run(
    action: () => Promise<ActionResult<unknown>>,
    after?: () => void,
  ) {
    startTransition(async () => {
      const result = await action();
      if (result.ok) {
        toast.success(result.message ?? "Done");
        after?.();
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function add() {
    const name = newName.trim();
    if (!name) return;
    run(() => createCategory({ name }), () => setNewName(""));
  }

  function saveRename(id: string) {
    const name = editName.trim();
    if (!name) return;
    run(() => renameCategory({ id, name }), () => {
      setEditingId(null);
      setEditName("");
    });
  }

  function remove(id: string) {
    run(() => deleteCategory(id), () => setConfirmDeleteId(null));
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) {
          setEditingId(null);
          setConfirmDeleteId(null);
          setNewName("");
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline">
          <Tags className="h-4 w-4" /> Manage categories
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Manage scoring categories</DialogTitle>
          <DialogDescription>
            Add, rename, or remove the categories available when awarding points.
            Renaming also updates past entries; removing keeps history intact.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="New category name"
            maxLength={60}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                add();
              }
            }}
          />
          <Button onClick={add} disabled={pending || !newName.trim()}>
            <Plus className="h-4 w-4" /> Add
          </Button>
        </div>

        <div className="max-h-72 space-y-1 overflow-y-auto scrollbar-thin">
          {categories.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No categories yet. Add one above.
            </p>
          )}
          {categories.map((c) => (
            <div
              key={c.id}
              className="flex items-center gap-2 rounded-md border p-2"
            >
              {editingId === c.id ? (
                <>
                  <Input
                    autoFocus
                    value={editName}
                    maxLength={60}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        saveRename(c.id);
                      }
                      if (e.key === "Escape") setEditingId(null);
                    }}
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label="Save"
                    disabled={pending}
                    onClick={() => saveRename(c.id)}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label="Cancel"
                    onClick={() => {
                      setEditingId(null);
                      setEditName("");
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </>
              ) : confirmDeleteId === c.id ? (
                <>
                  <span className="flex-1 truncate text-sm">
                    Delete <span className="font-medium">{c.name}</span>?
                  </span>
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={pending}
                    onClick={() => remove(c.id)}
                  >
                    Delete
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setConfirmDeleteId(null)}
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  <span className="flex-1 truncate text-sm font-medium">
                    {c.name}
                  </span>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label={`Rename ${c.name}`}
                    onClick={() => {
                      setEditingId(c.id);
                      setEditName(c.name);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label={`Delete ${c.name}`}
                    onClick={() => setConfirmDeleteId(c.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </>
              )}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
