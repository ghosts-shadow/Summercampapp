"use client";

import { type ChangeEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Upload } from "lucide-react";

import { parseCSVToObjects } from "@/lib/csv";
import { bulkImportCampers } from "@/server/actions/campers";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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

const TEMPLATE =
  "firstName,lastName,age,gender,guardianName,guardianPhone,emergencyContact,medicalNotes,group";

export function CamperImportDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [pending, startTransition] = useTransition();

  function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setText(String(reader.result ?? ""));
    reader.readAsText(file);
  }

  function submit() {
    const rows = parseCSVToObjects(text);
    if (rows.length === 0) {
      toast.error("No rows found. Check the CSV format and headers.");
      return;
    }
    startTransition(async () => {
      const result = await bulkImportCampers(rows);
      if (result.ok) {
        toast.success(result.message ?? "Imported");
        setOpen(false);
        setText("");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="h-4 w-4" /> Import
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Import campers from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file or paste rows below. The first row must be the
            header.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-md border bg-muted/40 p-3 text-xs">
            <p className="font-medium">Expected columns</p>
            <code className="mt-1 block break-words text-muted-foreground">
              {TEMPLATE}
            </code>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="csv-file">Upload file</Label>
            <Input
              id="csv-file"
              type="file"
              accept=".csv,text/csv"
              onChange={handleFile}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="csv-text">…or paste CSV</Label>
            <Textarea
              id="csv-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={`${TEMPLATE}\nJohn,Doe,12,MALE,Jane Doe,(555) 123-4567,Jane Doe (555) 123-4567,,Red Lions`}
              className="min-h-[140px] font-mono text-xs"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={pending}
          >
            Cancel
          </Button>
          <Button onClick={submit} disabled={pending || text.trim() === ""}>
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            Import
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
