export const dynamic = "force-dynamic";

import { Header } from "@/components/layout/header";
import { getKanbanCustomers } from "@/server/queries/customers";
import { SalesClient } from "@/components/sales/sales-client";

export default async function SalesPage() {
  const customers = await getKanbanCustomers();

  return (
    <div className="flex flex-col h-full">
      <Header title="Sales Pipeline" />
      <SalesClient initialCustomers={customers as any} />
    </div>
  );
}
