export const dynamic = "force-dynamic";

import { Header } from "@/components/layout/header";
import { getAllEvents } from "@/server/queries/events";
import { EventsClient } from "@/components/events/events-client";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export default async function EventsPage() {
  const { userId } = await auth();
  const events = await getAllEvents();

  let repId: string | undefined;
  if (userId) {
    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.clerkId, userId),
    });
    repId = profile?.id;
  }

  return (
    <div className="flex flex-col h-full">
      <Header title="Events & Entertaining" />
      <EventsClient events={events as any} repId={repId} />
    </div>
  );
}
