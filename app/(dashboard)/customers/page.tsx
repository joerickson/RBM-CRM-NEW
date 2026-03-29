export const dynamic = "force-dynamic";

import { Header } from "@/components/layout/header";
import { getAllCustomers } from "@/server/queries/customers";
import { CustomersClient } from "@/components/customers/customers-client";
import {
  getAllCustomerStatuses,
  getAllIndustries,
  getAllVisitFrequencies,
} from "@/server/queries/settings";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { syncClerkUserToSupabase } from "@/lib/auth/sync-user";

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; brand?: string; search?: string }>;
}) {
  await syncClerkUserToSupabase();

  const [params, profile] = await Promise.all([
    searchParams,
    getCurrentProfile(),
  ]);

  const ctx = profile
    ? { role: profile.role as any, clerkId: profile.clerkId }
    : undefined;

  const [customers, customerStatuses, industriesList, visitFrequenciesList] =
    await Promise.all([
      getAllCustomers(params, ctx),
      getAllCustomerStatuses(),
      getAllIndustries(),
      getAllVisitFrequencies(),
    ]);

  return (
    <div className="flex flex-col h-full">
      <Header title="Customers" />
      <CustomersClient
        initialCustomers={customers as any}
        customerStatuses={customerStatuses as any}
        industries={industriesList as any}
        visitFrequencies={visitFrequenciesList as any}
      />
    </div>
  );
}
