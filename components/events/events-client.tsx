"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Calendar,
  MapPin,
  Plus,
  Users,
  Trash2,
  Edit,
  Ticket,
  Car,
  LayoutGrid,
  List,
  Table2,
  Building2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EventFormDialog } from "./event-form-dialog";
import { EventDetailDialog } from "./event-detail-dialog";
import { CalendarView } from "./calendar-view";
import { AttendeeView, type AttendeeEditEntry } from "./attendee-view";
import { AddAttendeeDialog } from "./add-attendee-dialog";
import { EditAttendeeDialog } from "./edit-attendee-dialog";
import { deleteEvent } from "@/server/actions/events";
import { toast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";

interface EventType {
  id: string;
  name: string;
  slug: string;
  color: string;
  isActive: boolean;
}

interface EventCustomer {
  id: string;
  customerId: string;
  attended: boolean | null;
  ticketsAssigned: number;
  parkingAssigned: number;
  ticketsSent: boolean;
  parkingSent: boolean;
  notes: string | null;
  customer: {
    id: string;
    companyName: string;
    primaryContactName: string | null;
    primaryContactEmail: string | null;
    brand: string;
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
  ticketsSent: boolean;
  parkingSent: boolean;
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

interface EventsClientProps {
  events: Event[];
  eventTypes: EventType[];
  companies?: { id: string; name: string }[];
  repId?: string;
  userRole?: string;
  userCompany?: string;
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

// Legacy fallback color map
const LEGACY_COLORS: Record<string, string> = {
  "delta-center": "bg-blue-100 text-blue-700 border-blue-200",
  theater: "bg-purple-100 text-purple-700 border-purple-200",
  golf: "bg-green-100 text-green-700 border-green-200",
  dinner: "bg-orange-100 text-orange-700 border-orange-200",
  "client-appreciation": "bg-pink-100 text-pink-700 border-pink-200",
  conference: "bg-indigo-100 text-indigo-700 border-indigo-200",
  other: "bg-gray-100 text-gray-700 border-gray-200",
};

function getEventBadgeClass(event: Event) {
  if (event.eventType?.color) return getColorBadge(event.eventType.color);
  return LEGACY_COLORS[event.type] ?? LEGACY_COLORS.other;
}

function getEventTypeName(event: Event) {
  if (event.eventType?.name) return event.eventType.name;
  const names: Record<string, string> = {
    "delta-center": "Delta Center Suite",
    theater: "Hale Center Theater",
    golf: "Golf Outing",
    dinner: "Dinner",
    "client-appreciation": "Client Appreciation",
    conference: "Conference",
    other: "Other",
  };
  return names[event.type] ?? event.type;
}

export function EventsClient({
  events,
  eventTypes,
  companies = [],
  repId,
  userRole,
  userCompany,
}: EventsClientProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [editEvent, setEditEvent] = useState<Event | null>(null);
  const [detailEvent, setDetailEvent] = useState<Event | null>(null);
  const [addAttendeeEvent, setAddAttendeeEvent] = useState<Event | null>(null);
  const [editAttendeeData, setEditAttendeeData] = useState<{
    attendee: AttendeeEditEntry;
    event: Event;
  } | null>(null);
  const router = useRouter();

  // Filter by company for events-only role
  const visibleEvents =
    userRole === "events-only" && userCompany
      ? events.filter((e) => e.company === userCompany)
      : events;

  const upcoming = visibleEvents.filter((e) => new Date(e.date) >= new Date());
  const past = visibleEvents.filter((e) => new Date(e.date) < new Date());

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this event? This will remove all attendee links.")) return;
    const result = await deleteEvent(id);
    if (result.error) {
      toast({ title: result.error, variant: "destructive" });
    } else {
      toast({ title: "Event deleted" });
      router.refresh();
    }
  };

  function getAssignedTickets(event: Event) {
    return (
      event.eventCustomers.reduce((s, ec) => s + (ec.ticketsAssigned ?? 0), 0) +
      event.eventAttendees.reduce((s, ea) => s + (ea.ticketsAssigned ?? 0), 0)
    );
  }

  function getAssignedParking(event: Event) {
    return (
      event.eventCustomers.reduce((s, ec) => s + (ec.parkingAssigned ?? 0), 0) +
      event.eventAttendees.reduce((s, ea) => s + (ea.parkingAssigned ?? 0), 0)
    );
  }

  const renderEventCard = (event: Event, index: number) => {
    const totalAttendees = event.eventCustomers.length + event.eventAttendees.length;
    const assignedTickets = getAssignedTickets(event);
    const assignedParking = getAssignedParking(event);

    return (
      <motion.div
        key={event.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.04 }}
      >
        <Card
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setDetailEvent(event)}
        >
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <CardTitle className="text-base">{event.name}</CardTitle>
                  <Badge className={`text-xs border ${getEventBadgeClass(event)}`}>
                    {getEventTypeName(event)}
                  </Badge>
                  {event.company && (
                    <Badge variant="outline" className="text-xs">
                      <Building2 className="h-3 w-3 mr-1" />
                      {event.company}
                    </Badge>
                  )}
                </div>
                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(event.date)}
                  </span>
                  {event.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {event.location}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {totalAttendees} attendee{totalAttendees !== 1 ? "s" : ""}
                  </span>
                  {event.totalTickets > 0 && (
                    <span className="flex items-center gap-1">
                      <Ticket className="h-3 w-3" />
                      {assignedTickets}/{event.totalTickets}
                      {event.ticketsSent && (
                        <span className="ml-0.5 text-green-600">✓ sent</span>
                      )}
                    </span>
                  )}
                  {event.totalParkingPasses > 0 && (
                    <span className="flex items-center gap-1">
                      <Car className="h-3 w-3" />
                      {assignedParking}/{event.totalParkingPasses}
                      {event.parkingSent && (
                        <span className="ml-0.5 text-green-600">✓ sent</span>
                      )}
                    </span>
                  )}
                </div>
              </div>
              {userRole !== "events-only" && (
                <div className="flex gap-1 ml-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditEvent(event);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-red-500 hover:text-red-700"
                    onClick={(e) => handleDelete(event.id, e)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          {event.notes && (
            <CardContent className="pt-0">
              <p className="text-xs text-muted-foreground italic">{event.notes}</p>
            </CardContent>
          )}
        </Card>
      </motion.div>
    );
  };

  const listView = (
    <div className="space-y-6">
      {upcoming.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Upcoming ({upcoming.length})
          </h3>
          {upcoming.map((e, i) => renderEventCard(e, i))}
        </div>
      )}

      {past.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Past Events ({past.length})
          </h3>
          {past.map((e, i) => renderEventCard(e, i))}
        </div>
      )}

      {visibleEvents.length === 0 && (
        <Card>
          <CardContent className="text-center py-16 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm">No events yet. Create your first event!</p>
          </CardContent>
        </Card>
      )}
    </div>
  );

  return (
    <div className="flex-1 overflow-auto p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Events & Entertaining</h2>
          <p className="text-sm text-muted-foreground">
            Track client events, outings, and entertainment
          </p>
        </div>
        {userRole !== "events-only" && (
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Event
          </Button>
        )}
      </div>

      {/* Views */}
      <Tabs defaultValue="calendar" className="flex-1">
        <TabsList className="grid grid-cols-3 w-full max-w-sm">
          <TabsTrigger value="calendar" className="flex items-center gap-1.5 text-xs">
            <LayoutGrid className="h-3.5 w-3.5" />
            Calendar
          </TabsTrigger>
          <TabsTrigger value="list" className="flex items-center gap-1.5 text-xs">
            <List className="h-3.5 w-3.5" />
            List
          </TabsTrigger>
          <TabsTrigger value="attendees" className="flex items-center gap-1.5 text-xs">
            <Table2 className="h-3.5 w-3.5" />
            Attendee Matrix
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="mt-4">
          <CalendarView
            events={visibleEvents as any}
            onEventClick={(e) => setDetailEvent(e as any)}
          />
        </TabsContent>

        <TabsContent value="list" className="mt-4">
          {listView}
        </TabsContent>

        <TabsContent value="attendees" className="mt-4">
          <AttendeeView
            events={visibleEvents as any}
            onEventClick={(e) => setDetailEvent(e as any)}
            onEditAttendee={(attendee, event) =>
              setEditAttendeeData({ attendee, event: event as Event })
            }
            onAddAttendee={(event) => setAddAttendeeEvent(event as Event)}
          />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <EventFormDialog
        open={showCreate}
        onClose={() => {
          setShowCreate(false);
          router.refresh();
        }}
        eventTypes={eventTypes}
        companies={companies}
        repId={repId}
      />

      {editEvent && (
        <EventFormDialog
          open={!!editEvent}
          onClose={() => {
            setEditEvent(null);
            router.refresh();
          }}
          event={editEvent as any}
          eventTypes={eventTypes}
          companies={companies}
          repId={repId}
        />
      )}

      <EventDetailDialog
        event={detailEvent as any}
        open={!!detailEvent}
        onClose={() => {
          setDetailEvent(null);
          router.refresh();
        }}
      />

      {addAttendeeEvent && (
        <AddAttendeeDialog
          open={!!addAttendeeEvent}
          onClose={() => {
            setAddAttendeeEvent(null);
            router.refresh();
          }}
          eventId={addAttendeeEvent.id}
          totalTickets={addAttendeeEvent.totalTickets}
          totalParkingPasses={addAttendeeEvent.totalParkingPasses}
        />
      )}

      {editAttendeeData && (
        <EditAttendeeDialog
          open={!!editAttendeeData}
          onClose={() => {
            setEditAttendeeData(null);
            router.refresh();
          }}
          eventId={editAttendeeData.event.id}
          eventName={editAttendeeData.event.name}
          totalTickets={editAttendeeData.event.totalTickets}
          totalParkingPasses={editAttendeeData.event.totalParkingPasses}
          attendee={editAttendeeData.attendee}
        />
      )}
    </div>
  );
}
