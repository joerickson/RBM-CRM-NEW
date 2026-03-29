"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  updateCustomerEventFields,
  updateEventAttendeeFields,
} from "@/server/actions/events";
import { toast } from "@/hooks/use-toast";

interface EditAttendeeEntry {
  id: string;
  displayName: string;
  type: "customer" | "attendee" | "employee";
  customerId?: string;
  tickets: number;
  parking: number;
  ticketsSent: boolean;
  parkingSent: boolean;
}

interface EditAttendeeDialogProps {
  open: boolean;
  onClose: () => void;
  eventId: string;
  eventName: string;
  totalTickets: number;
  totalParkingPasses: number;
  attendee: EditAttendeeEntry;
}

export function EditAttendeeDialog({
  open,
  onClose,
  eventId,
  eventName,
  totalTickets,
  totalParkingPasses,
  attendee,
}: EditAttendeeDialogProps) {
  const [tickets, setTickets] = useState(attendee.tickets);
  const [parking, setParking] = useState(attendee.parking);
  const [ticketsSent, setTicketsSent] = useState(attendee.ticketsSent);
  const [parkingSent, setParkingSent] = useState(attendee.parkingSent);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      let result;
      if (attendee.type === "customer" && attendee.customerId) {
        result = await updateCustomerEventFields(
          eventId,
          attendee.customerId,
          tickets,
          parking,
          ticketsSent,
          parkingSent
        );
      } else {
        result = await updateEventAttendeeFields(
          attendee.id,
          tickets,
          parking,
          ticketsSent,
          parkingSent
        );
      }

      if (result?.error) {
        toast({ title: result.error, variant: "destructive" });
      } else {
        toast({ title: "Attendee updated" });
        onClose();
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-5 w-5" />
            Edit Attendee
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-3 bg-gray-50 rounded-lg text-sm">
            <p className="font-medium">{attendee.displayName}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{eventName}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="space-y-1">
              <Label className="text-xs">Tickets Assigned</Label>
              <Input
                type="number"
                min={0}
                max={totalTickets > 0 ? totalTickets : undefined}
                value={tickets}
                onChange={(e) => setTickets(Number(e.target.value))}
              />
              {totalTickets > 0 && (
                <p className="text-xs text-muted-foreground">Max: {totalTickets}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Parking Passes Assigned</Label>
              <Input
                type="number"
                min={0}
                max={totalParkingPasses > 0 ? totalParkingPasses : undefined}
                value={parking}
                onChange={(e) => setParking(Number(e.target.value))}
              />
              {totalParkingPasses > 0 && (
                <p className="text-xs text-muted-foreground">Max: {totalParkingPasses}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-6 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Checkbox
                id="edit-tickets-sent"
                checked={ticketsSent}
                onCheckedChange={(v) => setTicketsSent(!!v)}
              />
              <Label htmlFor="edit-tickets-sent" className="text-sm cursor-pointer">
                Tickets Sent
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="edit-parking-sent"
                checked={parkingSent}
                onCheckedChange={(v) => setParkingSent(!!v)}
              />
              <Label htmlFor="edit-parking-sent" className="text-sm cursor-pointer">
                Parking Sent
              </Label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
