export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { Header } from "@/components/layout/header";
import { getCustomerById } from "@/server/queries/customers";
import { getAllEvents } from "@/server/queries/events";
import {
  getAllInteractionTypes,
  getAllCustomerStatuses,
  getAllIndustries,
  getAllVisitFrequencies,
} from "@/server/queries/settings";
import { CustomerDetailClient } from "@/components/customers/customer-detail-client";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { userId } = await auth();

  const [customer, allEvents, interactionTypesList, customerStatusesList, industriesList, visitFrequenciesList] = await Promise.all([
    getCustomerById(id),
    getAllEvents(),
    getAllInteractionTypes(),
    getAllCustomerStatuses(),
    getAllIndustries(),
    getAllVisitFrequencies(),
  ]);

  if (!customer) notFound();

  let repId: string | undefined;
  if (userId) {
    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.clerkId, userId),
    });
    repId = profile?.id;
  }

  return (
    <div className="flex flex-col h-full">
      <Header title={customer.companyName} />
      <CustomerDetailClient
        customer={customer as any}
        repId={repId}
        allEvents={allEvents.map((e) => ({
          id: e.id,
          name: e.name,
          date: e.date,
          location: e.location,
          type: e.type,
        }))}
        interactionTypes={interactionTypesList as any}
        customerStatuses={customerStatusesList as any}
        industries={industriesList as any}
        visitFrequencies={visitFrequenciesList as any}
      />
    </div>
  );
}
