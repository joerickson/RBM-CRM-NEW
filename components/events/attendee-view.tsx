"use client";

import { useMemo } from "react";
import { CheckCircle, Ticket, Car } from "lucide-react";
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
  ticketsAssigned: number;
  parkingAssigned: number;
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

interface AttendeeViewProps {
  events: Event[];
  onEventClick?: (event: Event) => void;
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

type AttendeeRow = {
  key: string;
  name: string;
  company: string | null;
  subtitle: string;
  isCustomer: boolean;
};

export function AttendeeView({ events, onEventClick }: AttendeeViewProps) {
  // Build deduplicated list of all attendees across all events
  const attendeeRows = useMemo<AttendeeRow[]>(() => {
    const seen = new Map<string, AttendeeRow>();

    for (const evt of events) {
      for (const ec of evt.eventCustomers) {
        const key = `customer-${ec.customerId}`;
        if (!seen.has(key)) {
          seen.set(key, {
            key,
            name: ec.customer.primaryContactName ?? ec.customer.companyName,
            company: ec.customer.companyName,
            subtitle: ec.customer.companyName,
            isCustomer: true,
          });
        }
      }
      for (const ea of evt.eventAttendees) {
        const key = `attendee-${ea.name}-${ea.company ?? ""}`;
        if (!seen.has(key)) {
          seen.set(key, {
            key,
            name: ea.name,
            company: ea.company ?? null,
            subtitle: ea.company ?? "",
            isCustomer: false,
          });
        }
      }
    }

    return Array.from(seen.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [events]);

  function getCellForAttendee(event: Event, row: AttendeeRow) {
    if (row.isCustomer) {
      const customerId = row.key.replace("customer-", "");
      const ec = event.eventCustomers.find((c) => c.customerId === customerId);
      if (!ec) return null;
      return { tickets: ec.ticketsAssigned, parking: ec.parkingAssigned, attended: ec.attended };
    } else {
      const name = row.name;
      const ea = event.eventAttendees.find((a) => a.name === name);
      if (!ea) return null;
      return { tickets: ea.ticketsAssigned, parking: ea.parkingAssigned, attended: null };
    }
  }

  function getAssignedTickets(event: Event) {
    const fromCustomers = event.eventCustomers.reduce((s, ec) => s + (ec.ticketsAssigned ?? 0), 0);
    const fromAttendees = event.eventAttendees.reduce((s, ea) => s + (ea.ticketsAssigned ?? 0), 0);
    return fromCustomers + fromAttendees;
  }

  function getAssignedParking(event: Event) {
    const fromCustomers = event.eventCustomers.reduce((s, ec) => s + (ec.parkingAssigned ?? 0), 0);
    const fromAttendees = event.eventAttendees.reduce((s, ea) => s + (ea.parkingAssigned ?? 0), 0);
    return fromCustomers + fromAttendees;
  }

  if (events.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
        No events to display.
      </div>
    );
  }

  if (attendeeRows.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
        No attendees assigned to any events yet.
      </div>
    );
  }

  return (
    <div className="overflow-auto border rounded-lg bg-white">
      <table className="border-collapse" style={{ minWidth: `${200 + events.length * 180}px` }}>
        <thead>
          {/* Event header row */}
          <tr className="bg-gray-50 border-b">
            <th className="sticky left-0 z-10 bg-gray-50 border-r px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider min-w-[200px]">
              Attendee
            </th>
            {events.map((evt) => {
              const color = evt.eventType?.color ?? "gray";
              const assigned = getAssignedTickets(evt);
              const assignedPark = getAssignedParking(evt);
              return (
                <th
                  key={evt.id}
                  className="border-r px-3 py-2 text-center min-w-[160px] max-w-[180px]"
                >
                  <button
                    className="w-full text-left"
                    onClick={() => onEventClick?.(evt)}
                  >
                    <Badge className={`text-xs border mb-1 ${getColorBadge(color)}`}>
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
                          {assigned}/{evt.totalTickets}
                        </span>
                        <span className="flex items-center gap-0.5">
                          <Car className="h-3 w-3" />
                          {assignedPark}/{evt.totalParkingPasses}
                        </span>
                      </div>
                    )}
                    <div className="flex gap-1 mt-1">
                      {evt.ticketsSent && (
                        <span className="text-xs bg-green-100 text-green-700 px-1 rounded">Tkts ✓</span>
                      )}
                      {evt.parkingSent && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-1 rounded">Park ✓</span>
                      )}
                    </div>
                  </button>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {attendeeRows.map((row, rowIdx) => (
            <tr
              key={row.key}
              className={`border-b hover:bg-gray-50 ${rowIdx % 2 === 0 ? "" : "bg-gray-50/50"}`}
            >
              <td className="sticky left-0 z-10 bg-inherit border-r px-4 py-3 min-w-[200px]">
                <p className="text-sm font-medium">
                  {row.isCustomer
                    ? row.name
                    : row.company
                      ? `${row.name} - ${row.company}`
                      : row.name}
                </p>
                {row.isCustomer && (
                  <p className="text-xs text-muted-foreground truncate">{row.subtitle}</p>
                )}
                {!row.isCustomer && (
                  <span className="text-xs text-purple-600 font-medium">Guest</span>
                )}
              </td>
              {events.map((evt) => {
                const cell = getCellForAttendee(evt, row);
                return (
                  <td
                    key={evt.id}
                    className="border-r px-3 py-2 text-center min-w-[160px]"
                  >
                    {cell ? (
                      <div className="space-y-1">
                        {cell.attended !== null && (
                          <div className="flex justify-center">
                            <CheckCircle
                              className={`h-4 w-4 ${
                                cell.attended ? "text-green-500" : "text-gray-300"
                              }`}
                            />
                          </div>
                        )}
                        <div className="flex items-center justify-center gap-2 text-xs">
                          {cell.tickets > 0 && (
                            <span className="flex items-center gap-0.5 text-blue-600">
                              <Ticket className="h-3 w-3" />
                              {cell.tickets}
                            </span>
                          )}
                          {cell.parking > 0 && (
                            <span className="flex items-center gap-0.5 text-green-600">
                              <Car className="h-3 w-3" />
                              {cell.parking}
                            </span>
                          )}
                          {cell.tickets === 0 && cell.parking === 0 && (
                            <span className="text-green-600 font-medium text-xs">✓</span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-200 text-lg">—</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
          {/* Totals row */}
          <tr className="bg-gray-100 border-t-2 font-semibold">
            <td className="sticky left-0 z-10 bg-gray-100 border-r px-4 py-2 text-xs text-muted-foreground uppercase tracking-wider">
              Totals
            </td>
            {events.map((evt) => {
              const total = evt.eventCustomers.length + evt.eventAttendees.length;
              return (
                <td key={evt.id} className="border-r px-3 py-2 text-center">
                  <span className="text-sm font-bold text-gray-700">{total}</span>
                  <span className="text-xs text-muted-foreground"> attendees</span>
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
