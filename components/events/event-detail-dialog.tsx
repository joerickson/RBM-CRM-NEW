"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  MapPin,
  Users,
  Ticket,
  Car,
  Trash2,
  CheckCircle,
  XCircle,
  UserPlus,
  Building2,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AddAttendeeDialog } from "./add-attendee-dialog";
import {
  removeCustomerFromEvent,
  removeAttendeeFromEvent,
  updateAttendance,
} from "@/server/actions/events";
import { toast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";

interface EventType {
  id: string;
  name: string;
  color: string;
}

interface EventCustomer {
  id: string;
  customerId: string;
  attended: boolean | null;
  ticketsAssigned: number;
  parkingAssigned: number;
  notes: string | null;
  customer: {
    id: string;
    companyName: string;
    primaryContactName: string | null;
    primaryContactEmail: string | null;
  };
}

interface EventAttendee {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  type: string;
  ticketsAssigned: number;
  parkingAssigned: number;
}

interface Event {
  id: string;
  name: string;
  date: string | Date;
  location: string | null;
  type: string;
  eventType: EventType | null;
  company: string | null;
  totalTickets: number;
  totalParkingPasses: number;
  ticketsSent: boolean;
  parkingSent: boolean;
  notes: string | null;
  createdBy: { fullName: string | null } | null;
  eventCustomers: EventCustomer[];
  eventAttendees: EventAttendee[];
}

interface EventDetailDialogProps {
  event: Event | null;
  open: boolean;
  onClose: () => void;
}

function getColorBadge(color: string) {
  const map: Record<string, string> = {
    blue: "bg-blue-100 text-blue-700 border-blue-200",
    purple: "bg-purple-100 text-purple-700 border-purple-200",
    green: "bg-green-100 text-green-700 border-green-200",
    orange: "bg-orange-100 text-orange-700 border-orange-200",
    pink: "bg-pink-100 text-pink-700 border-pink-200",
    indigo: "bg-indigo-100 text-indigo-700 border-indigo-200",
    red: "bg-red-100 text-red-700 border-red-200",
    yellow: "bg-yellow-100 text-yellow-700 border-yellow-200",
    teal: "bg-teal-100 text-teal-700 border-teal-200",
    gray: "bg-gray-100 text-gray-700 border-gray-200",
  };
  return map[color] ?? "bg-gray-100 text-gray-700 border-gray-200";
}

export function EventDetailDialog({ event, open, onClose }: EventDetailDialogProps) {
  const router = useRouter();
  const [showAddAttendee, setShowAddAttendee] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  if (!event) return null;

  const assignedTickets =
    event.eventCustomers.reduce((s, ec) => s + (ec.ticketsAssigned ?? 0), 0) +
    event.eventAttendees.reduce((s, ea) => s + (ea.ticketsAssigned ?? 0), 0);

  const assignedParking =
    event.eventCustomers.reduce((s, ec) => s + (ec.parkingAssigned ?? 0), 0) +
    event.eventAttendees.reduce((s, ea) => s + (ea.parkingAssigned ?? 0), 0);

  const availableTickets = event.totalTickets - assignedTickets;
  const availableParking = event.totalParkingPasses - assignedParking;

  const color = event.eventType?.color ?? "gray";
  const typeName = event.eventType?.name ?? event.type;
  const totalAttendees = event.eventCustomers.length + event.eventAttendees.length;

  async function handleRemoveCustomer(customerId: string) {
    setRemovingId(`c-${customerId}`);
    try {
      const result = await removeCustomerFromEvent(event!.id, customerId);
      if (result.error) {
        toast({ title: result.error, variant: "destructive" });
      } else {
        toast({ title: "Removed from event" });
        router.refresh();
      }
    } finally {
      setRemovingId(null);
    }
  }

  async function handleRemoveAttendee(attendeeId: string) {
    setRemovingId(`a-${attendeeId}`);
    try {
      const result = await removeAttendeeFromEvent(attendeeId);
      if (result.error) {
        toast({ title: result.error, variant: "destructive" });
      } else {
        toast({ title: "Removed from event" });
        router.refresh();
      }
    } finally {
      setRemovingId(null);
    }
  }

  async function handleToggleAttendance(customerId: string, current: boolean | null) {
    await updateAttendance(event!.id, customerId, !current);
    router.refresh();
  }

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <DialogTitle className="text-lg">{event.name}</DialogTitle>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <Badge className={`text-xs border ${getColorBadge(color)}`}>
                    {typeName}
                  </Badge>
                  {event.company && (
                    <Badge variant="outline" className="text-xs">
                      {event.company}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </DialogHeader>

          {/* Event Meta */}
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground border-b pb-4">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {formatDate(event.date)}
            </span>
            {event.location && (
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                {event.location}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              {totalAttendees} attendee{totalAttendees !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Tickets & Parking Summary */}
          {(event.totalTickets > 0 || event.totalParkingPasses > 0) && (
            <div className="grid grid-cols-2 gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
              <div className="flex items-center gap-2">
                <Ticket className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-xs text-muted-foreground">Tickets</p>
                  <p className="text-sm font-semibold">
                    {assignedTickets}/{event.totalTickets} assigned
                    <span className="font-normal text-muted-foreground ml-1">
                      ({availableTickets} available)
                    </span>
                  </p>
                </div>
                {event.ticketsSent && (
                  <Badge className="ml-auto text-xs bg-green-100 text-green-700 border-green-200">
                    Sent ✓
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Car className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-xs text-muted-foreground">Parking</p>
                  <p className="text-sm font-semibold">
                    {assignedParking}/{event.totalParkingPasses} assigned
                    <span className="font-normal text-muted-foreground ml-1">
                      ({availableParking} available)
                    </span>
                  </p>
                </div>
                {event.parkingSent && (
                  <Badge className="ml-auto text-xs bg-green-100 text-green-700 border-green-200">
                    Sent ✓
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          {event.notes && (
            <p className="text-sm text-muted-foreground italic bg-gray-50 px-3 py-2 rounded">
              {event.notes}
            </p>
          )}

          {/* Attendees List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">Attendees ({totalAttendees})</h3>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowAddAttendee(true)}
              >
                <UserPlus className="h-3.5 w-3.5 mr-1.5" />
                Add Attendee
              </Button>
            </div>

            {totalAttendees === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm border rounded-lg">
                No attendees yet.{" "}
                <button
                  className="text-[#1B4F8A] underline"
                  onClick={() => setShowAddAttendee(true)}
                >
                  Add the first one.
                </button>
              </div>
            ) : (
              <div className="space-y-1.5">
                {/* Customer attendees */}
                {event.eventCustomers.map((ec) => (
                  <div
                    key={ec.id}
                    className="flex items-center justify-between px-3 py-2 rounded-lg border bg-white hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Building2 className="h-4 w-4 text-blue-500 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {ec.customer.primaryContactName ?? ec.customer.companyName}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {ec.customer.companyName}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {(ec.ticketsAssigned > 0 || ec.parkingAssigned > 0) && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          {ec.ticketsAssigned > 0 && (
                            <span className="flex items-center gap-0.5">
                              <Ticket className="h-3 w-3" />{ec.ticketsAssigned}
                            </span>
                          )}
                          {ec.parkingAssigned > 0 && (
                            <span className="flex items-center gap-0.5">
                              <Car className="h-3 w-3" />{ec.parkingAssigned}
                            </span>
                          )}
                        </div>
                      )}
                      <button
                        onClick={() => handleToggleAttendance(ec.customerId, ec.attended)}
                        className="flex items-center gap-1 text-xs"
                        title={ec.attended ? "Mark not attended" : "Mark attended"}
                      >
                        {ec.attended ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-gray-300" />
                        )}
                      </button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-red-400 hover:text-red-600"
                        disabled={removingId === `c-${ec.customerId}`}
                        onClick={() => handleRemoveCustomer(ec.customerId)}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}

                {/* Non-customer attendees */}
                {event.eventAttendees.map((ea) => (
                  <div
                    key={ea.id}
                    className="flex items-center justify-between px-3 py-2 rounded-lg border bg-white hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Users className="h-4 w-4 text-purple-500 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {ea.company ? `${ea.name} - ${ea.company}` : ea.name}
                        </p>
                        {ea.email && (
                          <p className="text-xs text-muted-foreground truncate">
                            {ea.email}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {(ea.ticketsAssigned > 0 || ea.parkingAssigned > 0) && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          {ea.ticketsAssigned > 0 && (
                            <span className="flex items-center gap-0.5">
                              <Ticket className="h-3 w-3" />{ea.ticketsAssigned}
                            </span>
                          )}
                          {ea.parkingAssigned > 0 && (
                            <span className="flex items-center gap-0.5">
                              <Car className="h-3 w-3" />{ea.parkingAssigned}
                            </span>
                          )}
                        </div>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-red-400 hover:text-red-600"
                        disabled={removingId === `a-${ea.id}`}
                        onClick={() => handleRemoveAttendee(ea.id)}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AddAttendeeDialog
        open={showAddAttendee}
        onClose={() => {
          setShowAddAttendee(false);
          router.refresh();
        }}
        eventId={event.id}
        totalTickets={event.totalTickets}
        totalParkingPasses={event.totalParkingPasses}
      />
    </>
  );
}
