"use client";

import { useMemo } from "react";
import { Ticket, Car, PlusCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
  ticketsSent: boolean;
  parkingSent: boolean;
  customer: {
    id: string;
    companyName: string;
    primaryContactName: string | null;
  };
}

interface EventAttendee {
  id: string;
  name: string;
  email: string | null;
  company: string | null;
  type: string;
  ticketsAssigned: number;
  parkingAssigned: number;
  ticketsSent: boolean;
  parkingSent: boolean;
}

interface Event {
  id: string;
  name: string;
  date: string | Date;
  company: string | null;
  totalTickets: number;
  totalParkingPasses: number;
  ticketsSent: boolean;
  parkingSent: boolean;
  eventType: EventType | null;
  type: string;
  eventCustomers: EventCustomer[];
  eventAttendees: EventAttendee[];
}

export type AttendeeEditEntry = {
  id: string;
  displayName: string;
  name: string;
  tickets: number;
  parking: number;
  ticketsSent: boolean;
  parkingSent: boolean;
  type: "customer" | "attendee" | "employee";
  customerId?: string;
};

interface AttendeeViewProps {
  events: Event[];
  onEventClick?: (event: Event) => void;
  onEditAttendee?: (attendee: AttendeeEditEntry, event: Event) => void;
  onAddAttendee?: (event: Event) => void;
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

export function AttendeeView({
  events,
  onEventClick,
  onEditAttendee,
  onAddAttendee,
}: AttendeeViewProps) {
  const sortedEvents = useMemo(
    () =>
      [...events].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      ),
    [events]
  );

  // For each event, build a sorted list of attendee entries
  const eventAttendeesList = useMemo<AttendeeEditEntry[][]>(() => {
    return sortedEvents.map((evt) => {
      const entries: AttendeeEditEntry[] = [];

      for (const ec of evt.eventCustomers) {
        const contactName =
          ec.customer.primaryContactName ?? ec.customer.companyName;
        entries.push({
          id: ec.id,
          name: contactName,
          displayName: `${contactName} — ${ec.customer.companyName}`,
          tickets: ec.ticketsAssigned,
          parking: ec.parkingAssigned,
          ticketsSent: ec.ticketsSent ?? false,
          parkingSent: ec.parkingSent ?? false,
          type: "customer",
          customerId: ec.customerId,
        });
      }

      for (const ea of evt.eventAttendees) {
        const rowType = ea.type === "employee" ? "employee" : "attendee";
        entries.push({
          id: ea.id,
          name: ea.name,
          displayName:
            rowType === "employee"
              ? `${ea.name} — Employee`
              : ea.company
              ? `${ea.name} — ${ea.company}`
              : ea.name,
          tickets: ea.ticketsAssigned,
          parking: ea.parkingAssigned,
          ticketsSent: ea.ticketsSent ?? false,
          parkingSent: ea.parkingSent ?? false,
          type: rowType,
        });
      }

      return entries.sort((a, b) => a.name.localeCompare(b.name));
    });
  }, [sortedEvents]);

  const maxRows = useMemo(
    () => Math.max(0, ...eventAttendeesList.map((e) => e.length)),
    [eventAttendeesList]
  );

  if (sortedEvents.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
        No events to display.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border rounded-lg bg-white">
      <table
        className="border-collapse"
        style={{ minWidth: `${sortedEvents.length * 220}px` }}
      >
        <thead>
          <tr className="bg-gray-50 border-b">
            {sortedEvents.map((evt, colIdx) => {
              const color = evt.eventType?.color ?? "gray";
              const assignedTickets = eventAttendeesList[colIdx].reduce(
                (s, a) => s + a.tickets,
                0
              );
              const assignedParking = eventAttendeesList[colIdx].reduce(
                (s, a) => s + a.parking,
                0
              );
              return (
                <th
                  key={evt.id}
                  className="border-r px-3 py-2 text-left min-w-[220px] max-w-[260px]"
                >
                  <button
                    className="w-full text-left"
                    onClick={() => onEventClick?.(evt)}
                  >
                    <Badge
                      className={`text-xs border mb-1 ${getColorBadge(color)}`}
                    >
                      {evt.eventType?.name ?? evt.type}
                    </Badge>
                    <p className="text-xs font-semibold text-gray-900 truncate">
                      {evt.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(evt.date)}
                    </p>
                    {evt.totalTickets > 0 && (
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-0.5">
                          <Ticket className="h-3 w-3" />
                          {assignedTickets}/{evt.totalTickets}
                        </span>
                        <span className="flex items-center gap-0.5">
                          <Car className="h-3 w-3" />
                          {assignedParking}/{evt.totalParkingPasses}
                        </span>
                      </div>
                    )}
                  </button>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {maxRows === 0 ? (
            <tr>
              <td
                colSpan={sortedEvents.length}
                className="text-center py-8 text-muted-foreground text-sm"
              >
                No attendees assigned to any events yet.
              </td>
            </tr>
          ) : (
            Array.from({ length: maxRows }, (_, rowIdx) => (
              <tr
                key={rowIdx}
                className={`border-b ${rowIdx % 2 === 0 ? "" : "bg-gray-50/50"}`}
              >
                {sortedEvents.map((evt, colIdx) => {
                  const attendee = eventAttendeesList[colIdx][rowIdx];
                  if (!attendee) {
                    return (
                      <td
                        key={evt.id}
                        className="border-r px-3 py-2 min-w-[220px]"
                      />
                    );
                  }
                  return (
                    <td
                      key={evt.id}
                      className="border-r px-0 py-0 min-w-[220px] align-top"
                    >
                      <button
                        className="w-full text-left px-3 py-2 hover:bg-blue-50 transition-colors rounded-sm group"
                        onClick={() => onEditAttendee?.(attendee, evt)}
                        title="Click to edit"
                      >
                        <p className="text-sm font-medium truncate group-hover:text-blue-700">
                          {attendee.displayName}
                        </p>
                        <div className="flex items-center gap-2 text-xs mt-1">
                          <span className="flex items-center gap-0.5 text-blue-600">
                            <Ticket className="h-3 w-3" />
                            {attendee.tickets}
                          </span>
                          <span className="flex items-center gap-0.5 text-green-600">
                            <Car className="h-3 w-3" />
                            {attendee.parking}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <label className="flex items-center gap-1 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={attendee.ticketsSent}
                              readOnly
                              className="h-3 w-3 accent-blue-600"
                            />
                            Tkts Sent
                          </label>
                          <label className="flex items-center gap-1 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={attendee.parkingSent}
                              readOnly
                              className="h-3 w-3 accent-green-600"
                            />
                            Park Sent
                          </label>
                        </div>
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
        <tfoot>
          <tr className="border-t bg-gray-50/50">
            {sortedEvents.map((evt) => (
              <td key={evt.id} className="border-r px-3 py-2 min-w-[220px]">
                <button
                  className="w-full flex items-center gap-1.5 text-xs font-medium text-[#1B4F8A] hover:text-blue-700 hover:bg-blue-50 rounded-md px-2 py-1.5 transition-colors"
                  onClick={() => onAddAttendee?.(evt)}
                >
                  <PlusCircle className="h-3.5 w-3.5 shrink-0" />
                  Add Attendee
                </button>
              </td>
            ))}
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
