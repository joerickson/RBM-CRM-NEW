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
  CheckCircle,
  XCircle,
  Edit,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EventFormDialog } from "./event-form-dialog";
import { deleteEvent, updateAttendance } from "@/server/actions/events";
import { toast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";

interface EventCustomer {
  id: string;
  attended: boolean | null;
  notes: string | null;
  customer: {
    id: string;
    companyName: string;
    brand: string;
  };
}

interface Event {
  id: string;
  name: string;
  date: string | Date;
  location: string | null;
  type: string;
  notes: string | null;
  createdBy: { fullName: string | null } | null;
  eventCustomers: EventCustomer[];
}

interface EventsClientProps {
  events: Event[];
  repId?: string;
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

const EVENT_TYPE_COLORS: Record<string, string> = {
  "delta-center": "bg-blue-100 text-blue-700 border-blue-200",
  theater: "bg-purple-100 text-purple-700 border-purple-200",
  golf: "bg-green-100 text-green-700 border-green-200",
  dinner: "bg-orange-100 text-orange-700 border-orange-200",
  "client-appreciation": "bg-pink-100 text-pink-700 border-pink-200",
  conference: "bg-indigo-100 text-indigo-700 border-indigo-200",
  other: "bg-gray-100 text-gray-700 border-gray-200",
};

export function EventsClient({ events, repId }: EventsClientProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [editEvent, setEditEvent] = useState<Event | null>(null);
  const router = useRouter();

  const upcoming = events.filter((e) => new Date(e.date) >= new Date());
  const past = events.filter((e) => new Date(e.date) < new Date());

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this event? This cannot be undone.")) return;
    const result = await deleteEvent(id);
    if (result.error) {
      toast({ title: result.error, variant: "destructive" });
    } else {
      toast({ title: "Event deleted" });
      router.refresh();
    }
  };

  const handleAttendance = async (
    eventId: string,
    customerId: string,
    attended: boolean
  ) => {
    await updateAttendance(eventId, customerId, attended);
    router.refresh();
  };

  const renderEvent = (event: Event, index: number) => (
    <motion.div
      key={event.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
    >
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <CardTitle className="text-base">{event.name}</CardTitle>
                <Badge
                  className={`text-xs border ${EVENT_TYPE_COLORS[event.type] ?? EVENT_TYPE_COLORS.other}`}
                >
                  {EVENT_TYPE_LABELS[event.type] ?? event.type}
                </Badge>
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
                  {event.eventCustomers.length} client
                  {event.eventCustomers.length !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
            <div className="flex gap-1">
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={() => setEditEvent(event)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-red-500 hover:text-red-700"
                onClick={() => handleDelete(event.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        {event.eventCustomers.length > 0 && (
          <CardContent className="pt-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Invited Clients
            </p>
            <div className="space-y-2">
              {event.eventCustomers.map((ec) => (
                <div
                  key={ec.id}
                  className="flex items-center justify-between py-1.5 px-3 rounded-md bg-gray-50 border"
                >
                  <span className="text-sm font-medium">
                    {ec.customer.companyName}
                  </span>
                  <div className="flex items-center gap-2">
                    {ec.notes && (
                      <span className="text-xs text-muted-foreground italic">
                        {ec.notes}
                      </span>
                    )}
                    <button
                      onClick={() =>
                        handleAttendance(event.id, ec.customer.id, !ec.attended)
                      }
                      className="flex items-center gap-1 text-xs"
                    >
                      {ec.attended ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-gray-400" />
                      )}
                      <span
                        className={
                          ec.attended ? "text-green-600" : "text-gray-400"
                        }
                      >
                        {ec.attended ? "Attended" : "Not confirmed"}
                      </span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {event.notes && (
              <p className="mt-3 text-xs text-muted-foreground italic">
                {event.notes}
              </p>
            )}
          </CardContent>
        )}
      </Card>
    </motion.div>
  );

  return (
    <div className="flex-1 overflow-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Events & Entertaining</h2>
          <p className="text-sm text-muted-foreground">
            Track client events, outings, and entertainment
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Event
        </Button>
      </div>

      {upcoming.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Upcoming ({upcoming.length})
          </h3>
          {upcoming.map((e, i) => renderEvent(e, i))}
        </div>
      )}

      {past.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Past Events ({past.length})
          </h3>
          {past.map((e, i) => renderEvent(e, i))}
        </div>
      )}

      {events.length === 0 && (
        <Card>
          <CardContent className="text-center py-16 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm">No events yet. Create your first event!</p>
          </CardContent>
        </Card>
      )}

      <EventFormDialog
        open={showCreate}
        onClose={() => {
          setShowCreate(false);
          router.refresh();
        }}
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
          repId={repId}
        />
      )}
    </div>
  );
}
