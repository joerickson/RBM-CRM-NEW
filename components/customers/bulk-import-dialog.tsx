"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { bulkImportCustomers, BulkImportRow } from "@/server/actions/customers";

// ─── CSV Column → BulkImportRow field mapping ────────────────────────────────

const COLUMN_MAP: Record<string, keyof BulkImportRow> = {
  company_name: "companyName",
  property_name: "propertyName",
  contact_person: "primaryContactName",
  primary_contact_name: "primaryContactName",
  email: "primaryContactEmail",
  phone: "primaryContactPhone",
  address: "address",
  city: "city",
  state: "state",
  zip_code: "zip",
  zip: "zip",
  industry: "industry",
  square_footage: "notes", // stored in notes if no direct schema column
  expected_deal_size: "monthlyValue",
  monthly_value: "monthlyValue",
  status: "status",
  notes: "notes",
  brand: "brand",
  stage: "stage",
};

// ─── CSV Parsing ─────────────────────────────────────────────────────────────

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

function parseCSV(text: string): BulkImportRow[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]).map((h) => h.toLowerCase().trim());
  const rows: BulkImportRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row: Partial<BulkImportRow> = {};

    headers.forEach((header, idx) => {
      const field = COLUMN_MAP[header];
      if (!field || values[idx] === undefined) return;
      const val = values[idx].trim();
      if (!val) return;

      if (field === "monthlyValue") {
        const num = parseFloat(val.replace(/[^0-9.]/g, ""));
        row.monthlyValue = isNaN(num) ? null : num;
      } else if (field === "notes") {
        // Accumulate extra columns into notes
        const existing = row.notes ?? "";
        if (header === "square_footage") {
          row.notes = existing
            ? `${existing}\nSq Ft: ${val}`
            : `Sq Ft: ${val}`;
        } else {
          row.notes = existing ? `${existing}\n${val}` : val;
        }
      } else {
        (row as Record<string, unknown>)[field] = val;
      }
    });

    if (row.companyName) {
      rows.push(row as BulkImportRow);
    }
  }

  return rows;
}

// ─── Component ───────────────────────────────────────────────────────────────

interface BulkImportDialogProps {
  open: boolean;
  onClose: () => void;
}

export function BulkImportDialog({ open, onClose }: BulkImportDialogProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<BulkImportRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setRows(parseCSV(text));
    };
    reader.readAsText(file);
  }

  async function handleImport() {
    if (rows.length === 0) return;
    setLoading(true);
    try {
      const result = await bulkImportCustomers(rows);
      if (result.errors.length > 0 && result.created === 0 && result.updated === 0) {
        toast({
          title: "Import failed",
          description: result.errors[0],
          variant: "destructive",
        });
      } else {
        const parts: string[] = [];
        if (result.created > 0) parts.push(`${result.created} created`);
        if (result.updated > 0) parts.push(`${result.updated} updated`);
        if (result.errors.length > 0) parts.push(`${result.errors.length} error(s)`);
        toast({ title: "Import complete", description: parts.join(", ") });
        handleClose();
        router.refresh();
      }
    } catch {
      toast({
        title: "Import failed",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setRows([]);
    setFileName("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Bulk Import Customers</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 flex-1 overflow-hidden">
          {/* File picker */}
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-4 w-4 mr-2" />
              Choose CSV File
            </Button>
            {fileName && (
              <span className="text-sm text-muted-foreground">{fileName}</span>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* Empty state */}
          {rows.length === 0 && (
            <div className="text-sm text-muted-foreground border rounded-lg p-6 text-center">
              <p className="font-medium mb-1">Select a CSV file to preview before importing.</p>
              <p className="text-xs">
                Supported columns: <code className="bg-gray-100 px-1 rounded">company_name</code>,{" "}
                <code className="bg-gray-100 px-1 rounded">property_name</code>,{" "}
                <code className="bg-gray-100 px-1 rounded">contact_person</code>,{" "}
                <code className="bg-gray-100 px-1 rounded">email</code>,{" "}
                <code className="bg-gray-100 px-1 rounded">phone</code>,{" "}
                <code className="bg-gray-100 px-1 rounded">address</code>,{" "}
                <code className="bg-gray-100 px-1 rounded">city</code>,{" "}
                <code className="bg-gray-100 px-1 rounded">state</code>,{" "}
                <code className="bg-gray-100 px-1 rounded">zip_code</code>,{" "}
                <code className="bg-gray-100 px-1 rounded">industry</code>,{" "}
                <code className="bg-gray-100 px-1 rounded">expected_deal_size</code>,{" "}
                <code className="bg-gray-100 px-1 rounded">status</code>,{" "}
                <code className="bg-gray-100 px-1 rounded">brand</code>,{" "}
                <code className="bg-gray-100 px-1 rounded">notes</code>
              </p>
              <p className="text-xs mt-1">
                Duplicates matched by <strong>company_name</strong> — existing records will be updated.
              </p>
            </div>
          )}

          {/* Preview table */}
          {rows.length > 0 && (
            <div className="flex-1 overflow-hidden flex flex-col">
              <p className="text-sm text-muted-foreground mb-2">
                {rows.length} row{rows.length !== 1 ? "s" : ""} ready to import
              </p>
              <div className="rounded-lg border overflow-auto flex-1">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b sticky top-0 z-10">
                    <tr>
                      <th className="text-left px-3 py-2 font-medium text-muted-foreground whitespace-nowrap">
                        Company
                      </th>
                      <th className="text-left px-3 py-2 font-medium text-muted-foreground whitespace-nowrap">
                        Property
                      </th>
                      <th className="text-left px-3 py-2 font-medium text-muted-foreground whitespace-nowrap">
                        Contact
                      </th>
                      <th className="text-left px-3 py-2 font-medium text-muted-foreground whitespace-nowrap">
                        Email
                      </th>
                      <th className="text-left px-3 py-2 font-medium text-muted-foreground whitespace-nowrap">
                        Phone
                      </th>
                      <th className="text-left px-3 py-2 font-medium text-muted-foreground whitespace-nowrap">
                        City
                      </th>
                      <th className="text-left px-3 py-2 font-medium text-muted-foreground whitespace-nowrap">
                        State
                      </th>
                      <th className="text-left px-3 py-2 font-medium text-muted-foreground whitespace-nowrap">
                        Status
                      </th>
                      <th className="text-left px-3 py-2 font-medium text-muted-foreground whitespace-nowrap">
                        Industry
                      </th>
                      <th className="text-right px-3 py-2 font-medium text-muted-foreground whitespace-nowrap">
                        Deal Size
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {rows.map((row, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-3 py-2 font-medium whitespace-nowrap">
                          {row.companyName}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">
                          {row.propertyName ?? "—"}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          {row.primaryContactName ?? "—"}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          {row.primaryContactEmail ?? "—"}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          {row.primaryContactPhone ?? "—"}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          {row.city ?? "—"}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          {row.state ?? "—"}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100">
                            {row.status ?? "lead"}
                          </span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          {row.industry ?? "—"}
                        </td>
                        <td className="px-3 py-2 text-right whitespace-nowrap">
                          {row.monthlyValue != null
                            ? `$${Number(row.monthlyValue).toLocaleString()}`
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleImport}
            disabled={rows.length === 0 || loading}
          >
            {loading
              ? "Importing..."
              : rows.length > 0
              ? `Import ${rows.length} Row${rows.length !== 1 ? "s" : ""}`
              : "Import"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
