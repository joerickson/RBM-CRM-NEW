"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { addCustomerToEvent } from "@/server/actions/events";
import { toast } from "@/hooks/use-toast";
import { Calendar, MapPin } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Event {
  id: string;
  name: string;
  date: string | Date;
  location: string | null;
  type: string;
}

interface AddToEventDialogProps {
  open: boolean;
  onClose: () => void;
  customerId: string;
  events: Event[];
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  "delta-center": "Delta Center Suite",
  theater: "Hale Center Theater",
  golf: "Golf Outing",
  dinner: "Dinner",
  "client-appreciation": "Client Appreciation",
  conference: "Conference",
  other: "Other",
};

export function AddToEventDialog({
  open,
  onClose,
  customerId,
  events,
}: AddToEventDialogProps) {
  const [selectedEventId, setSelectedEventId] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!selectedEventId) {
      toast({ title: "Please select an event", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const result = await addCustomerToEvent(
        selectedEventId,
        customerId,
        notes || undefined
      );
      if (result.error) {
        toast({ title: result.error, variant: "destructive" });
      } else {
        toast({ title: "Customer added to event" });
        setSelectedEventId("");
        setNotes("");
        onClose();
      }
    } finally {
      setSaving(false);
    }
  };

  const upcomingEvents = events.filter(
    (e) => new Date(e.date) >= new Date()
  );

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add to Event</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1">
            <Label>Select Event</Label>
            <Select value={selectedEventId} onValueChange={setSelectedEventId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose an event" />
              </SelectTrigger>
              <SelectContent>
                {upcomingEvents.length === 0 ? (
                  <SelectItem value="none" disabled>
                    No upcoming events
                  </SelectItem>
                ) : (
                  upcomingEvents.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      <div className="flex items-center gap-2">
                        <span>{e.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {EVENT_TYPE_LABELS[e.type] ?? e.type}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {selectedEventId && (
            <div className="p-3 bg-gray-50 rounded-lg text-sm space-y-1">
              {(() => {
                const ev = events.find((e) => e.id === selectedEventId);
                if (!ev) return null;
                return (
                  <>
                    <p className="font-medium">{ev.name}</p>
                    <p className="text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(ev.date)}
                    </p>
                    {ev.location && (
                      <p className="text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {ev.location}
                      </p>
                    )}
                  </>
                );
              })()}
            </div>
          )}

          <div className="space-y-1">
            <Label>Notes (optional)</Label>
            <Textarea
              placeholder="Any notes about this invitation"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={saving || !selectedEventId}>
              {saving ? "Adding..." : "Add to Event"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
