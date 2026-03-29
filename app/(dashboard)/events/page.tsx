export const dynamic = "force-dynamic";

import { Header } from "@/components/layout/header";
import { getAllEvents, getAllEventTypes } from "@/server/queries/events";
import { getAllCompanies } from "@/server/queries/settings";
import { EventsClient } from "@/components/events/events-client";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export default async function EventsPage() {
  const { userId } = await auth();
  const [eventsList, eventTypesList, companiesList] = await Promise.all([
    getAllEvents(),
    getAllEventTypes(),
    getAllCompanies(),
  ]);

  let repId: string | undefined;
  let userRole: string | undefined;
  let userCompany: string | undefined;

  if (userId) {
    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.clerkId, userId),
    });
    repId = profile?.id;
    userRole = profile?.role ?? undefined;
  }

  return (
    <div className="flex flex-col h-full">
      <Header title="Events & Entertaining" />
      <EventsClient
        events={eventsList as any}
        eventTypes={eventTypesList as any}
        companies={companiesList as any}
        repId={repId}
        userRole={userRole}
        userCompany={userCompany}
      />
    </div>
  );
}
