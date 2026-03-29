export const dynamic = "force-dynamic";

import { Header } from "@/components/layout/header";
import { getAllEventTypes } from "@/server/queries/events";
import { EventTypesClient } from "@/components/admin/event-types-client";

export default async function EventTypesPage() {
  const eventTypesList = await getAllEventTypes();

  return (
    <div className="flex flex-col h-full">
      <Header title="Event Types" />
      <EventTypesClient eventTypes={eventTypesList as any} />
    </div>
  );
}
