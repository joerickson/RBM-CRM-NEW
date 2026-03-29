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
import { eventSchema } from "@/lib/validations";
import { createEvent, updateEvent } from "@/server/actions/events";
import { toast } from "@/hooks/use-toast";

type FormData = z.infer<typeof eventSchema>;

interface EventFormDialogProps {
  open: boolean;
  onClose: () => void;
  event?: {
    id: string;
    name: string;
    date: string | Date;
    location: string | null;
    type: string;
    notes: string | null;
  };
  repId?: string;
}

const EVENT_TYPES = [
  { value: "delta-center", label: "Delta Center Suite" },
  { value: "theater", label: "Hale Center Theater" },
  { value: "golf", label: "Golf Outing" },
  { value: "dinner", label: "Dinner" },
  { value: "client-appreciation", label: "Client Appreciation" },
  { value: "conference", label: "Conference" },
  { value: "other", label: "Other" },
];

export function EventFormDialog({
  open,
  onClose,
  event,
  repId,
}: EventFormDialogProps) {
  const [saving, setSaving] = useState(false);
  const isEdit = !!event;

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: event
      ? {
          name: event.name,
          date: new Date(event.date).toISOString().slice(0, 16),
          location: event.location ?? "",
          type: event.type as any,
          notes: event.notes ?? "",
        }
      : {
          type: "other",
        },
  });

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    try {
      const result = isEdit
        ? await updateEvent(event!.id, data)
        : await createEvent(data, repId);

      if (result.error) {
        toast({ title: result.error, variant: "destructive" });
      } else {
        toast({ title: isEdit ? "Event updated" : "Event created" });
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
          <DialogTitle>{isEdit ? "Edit Event" : "New Event"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <Label>Event Name</Label>
            <Input placeholder="e.g. Delta Center Suite Night" {...register("name")} />
            {errors.name && (
              <p className="text-xs text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Type</Label>
              <Select
                defaultValue={event?.type ?? "other"}
                onValueChange={(v) => setValue("type", v as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Date & Time</Label>
              <Input type="datetime-local" {...register("date")} />
              {errors.date && (
                <p className="text-xs text-red-500">{errors.date.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <Label>Location</Label>
            <Input placeholder="e.g. Delta Center, Salt Lake City" {...register("location")} />
          </div>

          <div className="space-y-1">
            <Label>Notes</Label>
            <Textarea
              placeholder="Event details, dress code, agenda, etc."
              rows={3}
              {...register("notes")}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : isEdit ? "Update Event" : "Create Event"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
