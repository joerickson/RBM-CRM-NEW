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

  let events: Awaited<ReturnType<typeof getAllEvents>> = [];
  let dbError = false;

  try {
    events = await getAllEvents();
  } catch (err) {
    console.error("[EventsPage] Failed to load events:", err);
    dbError = true;
  }

  let repId: string | undefined;
  if (userId && !dbError) {
    try {
      const profile = await db.query.profiles.findFirst({
        where: eq(profiles.clerkId, userId),
      });
      repId = profile?.id;
    } catch {
      // non-fatal
    }
  }

  if (dbError) {
    return (
      <div className="flex flex-col h-full">
        <Header title="Events & Entertaining" />
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-md text-center space-y-3">
            <p className="text-lg font-semibold text-destructive">
              Events table not found in database
            </p>
            <p className="text-sm text-muted-foreground">
              The events feature requires database tables that haven&apos;t been
              created yet. Please run the{" "}
              <code className="bg-muted px-1 rounded text-xs">
                events-migration.sql
              </code>{" "}
              script in your Supabase SQL Editor, then refresh this page.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <Header title="Events & Entertaining" />
      <EventsClient events={events as any} repId={repId} />
    </div>
  );
}
