"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Trash2 } from "lucide-react";
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
import { createEvent, updateEvent, deleteEvent } from "@/server/actions/events";
import { toast } from "@/hooks/use-toast";

type FormData = z.infer<typeof eventSchema>;

interface EventType {
  id: string;
  name: string;
  slug: string;
  color: string;
  isActive: boolean;
}

interface EventFormDialogProps {
  open: boolean;
  onClose: () => void;
  event?: {
    id: string;
    name: string;
    date: string | Date;
    location: string | null;
    type: string;
    eventTypeId?: string | null;
    company?: string | null;
    totalTickets?: number;
    totalParkingPasses?: number;
    ticketsSent?: boolean;
    parkingSent?: boolean;
    notes: string | null;
  };
  eventTypes?: EventType[];
  repId?: string;
}

const COMPANIES = ["RBM Services", "TruCo", "Alpine", "DT"];

export function EventFormDialog({
  open,
  onClose,
  event,
  eventTypes = [],
  repId,
}: EventFormDialogProps) {
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const isEdit = !!event;

  const activeTypes = eventTypes.filter((t) => t.isActive);

  // Find matching event type for existing event
  const defaultTypeId = event?.eventTypeId
    ?? (activeTypes.find((t) => t.slug === event?.type)?.id ?? activeTypes[0]?.id ?? "");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
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
          eventTypeId: defaultTypeId || null,
          company: event.company ?? "",
          totalTickets: event.totalTickets ?? 0,
          totalParkingPasses: event.totalParkingPasses ?? 0,
          ticketsSent: event.ticketsSent ?? false,
          parkingSent: event.parkingSent ?? false,
          notes: event.notes ?? "",
        }
      : {
          type: "other" as any,
          eventTypeId: activeTypes[0]?.id ?? null,
          totalTickets: 0,
          totalParkingPasses: 0,
          ticketsSent: false,
          parkingSent: false,
        },
  });

  const ticketsSent = watch("ticketsSent");
  const parkingSent = watch("parkingSent");

  const handleDelete = async () => {
    if (!event) return;
    if (!confirm("Are you sure you want to delete this event? This will remove all attendee links.")) return;
    setDeleting(true);
    try {
      const result = await deleteEvent(event.id);
      if (result.error) {
        toast({ title: result.error, variant: "destructive" });
      } else {
        toast({ title: "Event deleted" });
        onClose();
      }
    } finally {
      setDeleting(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    try {
      // Resolve legacy type from eventTypeId slug
      if (data.eventTypeId) {
        const matched = activeTypes.find((t) => t.id === data.eventTypeId);
        if (matched) {
          const legacyTypes = ["delta-center","theater","golf","dinner","client-appreciation","conference","other"];
          data.type = legacyTypes.includes(matched.slug) ? (matched.slug as any) : "other";
        }
      }

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
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Event" : "New Event"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <Label>Event Name *</Label>
            <Input placeholder="e.g. Delta Center Suite Night" {...register("name")} />
            {errors.name && (
              <p className="text-xs text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Event Type</Label>
              {activeTypes.length > 0 ? (
                <Select
                  defaultValue={defaultTypeId}
                  onValueChange={(v) => setValue("eventTypeId", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeTypes.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-xs text-muted-foreground py-2">
                  No event types configured.{" "}
                  <a href="/admin/event-types" className="text-[#1B4F8A] underline">
                    Add types in Admin → Event Types.
                  </a>
                </p>
              )}
            </div>

            <div className="space-y-1">
              <Label>Date & Time *</Label>
              <Input type="datetime-local" {...register("date")} />
              {errors.date && (
                <p className="text-xs text-red-500">{errors.date.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Company</Label>
              <Select
                defaultValue={event?.company ?? ""}
                onValueChange={(v) => setValue("company", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select company" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">— None —</SelectItem>
                  {COMPANIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Location</Label>
              <Input
                placeholder="e.g. Delta Center, Salt Lake City"
                {...register("location")}
              />
            </div>
          </div>

          {/* Tickets & Parking */}
          <div className="grid grid-cols-2 gap-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Total Tickets</Label>
              <Input
                type="number"
                min={0}
                placeholder="0"
                {...register("totalTickets")}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Total Parking Passes</Label>
              <Input
                type="number"
                min={0}
                placeholder="0"
                {...register("totalParkingPasses")}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="ticketsSent"
                className="h-4 w-4 rounded border-gray-300"
                checked={ticketsSent}
                onChange={(e) => setValue("ticketsSent", e.target.checked)}
              />
              <Label htmlFor="ticketsSent" className="text-xs cursor-pointer">
                Tickets Sent
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="parkingSent"
                className="h-4 w-4 rounded border-gray-300"
                checked={parkingSent}
                onChange={(e) => setValue("parkingSent", e.target.checked)}
              />
              <Label htmlFor="parkingSent" className="text-xs cursor-pointer">
                Parking Sent
              </Label>
            </div>
          </div>

          <div className="space-y-1">
            <Label>Notes</Label>
            <Textarea
              placeholder="Event details, dress code, agenda, etc."
              rows={3}
              {...register("notes")}
            />
          </div>

          <div className="flex justify-between gap-2 pt-2">
            {isEdit && (
              <Button
                type="button"
                variant="ghost"
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                onClick={handleDelete}
                disabled={deleting || saving}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {deleting ? "Deleting..." : "Delete"}
              </Button>
            )}
            <div className="flex gap-2 ml-auto">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving || deleting}>
                {saving ? "Saving..." : isEdit ? "Update Event" : "Create Event"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
