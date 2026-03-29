"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { visitSchema } from "@/lib/validations";
import { createVisit } from "@/server/actions/visits";
import { toast } from "@/hooks/use-toast";

type FormData = z.infer<typeof visitSchema>;

interface ScheduleVisitDialogProps {
  open: boolean;
  onClose: () => void;
  customerId: string;
  sites?: Array<{ id: string; siteName: string }>;
}

const VISIT_TYPES = [
  "routine",
  "deep-clean",
  "inspection",
  "follow-up",
  "emergency",
  "sales",
  "other",
];

export function ScheduleVisitDialog({
  open,
  onClose,
  customerId,
  sites = [],
}: ScheduleVisitDialogProps) {
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(visitSchema),
    defaultValues: {
      customerId,
      visitType: "routine",
      status: "scheduled",
    },
  });

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    try {
      const result = await createVisit(data);
      if (result.error) {
        toast({ title: result.error, variant: "destructive" });
      } else {
        toast({ title: "Visit scheduled successfully" });
        reset();
        onClose();
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Schedule Visit</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <input type="hidden" {...register("customerId")} />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Visit Type</Label>
              <Select
                defaultValue="routine"
                onValueChange={(v) => setValue("visitType", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {VISIT_TYPES.map((t) => (
                    <SelectItem key={t} value={t} className="capitalize">
                      {t.replace("-", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Status</Label>
              <Select
                defaultValue="scheduled"
                onValueChange={(v) => setValue("status", v as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="missed">Missed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <Label>Visit Date & Time</Label>
            <Input type="datetime-local" {...register("visitDate")} />
            {errors.visitDate && (
              <p className="text-xs text-red-500">{errors.visitDate.message}</p>
            )}
          </div>

          {sites.length > 0 && (
            <div className="space-y-1">
              <Label>Site (optional)</Label>
              <Select onValueChange={(v) => setValue("siteId", v === "none" ? null : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a site" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No specific site</SelectItem>
                  {sites.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.siteName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1">
            <Label>Notes</Label>
            <Textarea
              placeholder="Visit notes or instructions"
              rows={3}
              {...register("notes")}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Schedule Visit"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
