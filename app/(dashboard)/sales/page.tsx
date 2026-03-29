export const dynamic = "force-dynamic";

import { Header } from "@/components/layout/header";
import { getKanbanCustomers } from "@/server/queries/customers";
import { SalesClient } from "@/components/sales/sales-client";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { syncClerkUserToSupabase } from "@/lib/auth/sync-user";

export default async function SalesPage() {
  await syncClerkUserToSupabase();

  const profile = await getCurrentProfile();

  const ctx = profile
    ? { role: profile.role as any, clerkId: profile.clerkId }
    : undefined;

  const customers = await getKanbanCustomers(ctx);

  return (
    <div className="flex flex-col h-full">
      <Header title="Sales Pipeline" />
      <SalesClient initialCustomers={customers as any} />
    </div>
  );
}
