export const dynamic = "force-dynamic";

import { Header } from "@/components/layout/header";
import { getAllCustomers } from "@/server/queries/customers";
import { CustomersClient } from "@/components/customers/customers-client";

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; brand?: string; search?: string }>;
}) {
  const params = await searchParams;
  const customers = await getAllCustomers(params);

  return (
    <div className="flex flex-col h-full">
      <Header title="Customers" />
      <CustomersClient initialCustomers={customers as any} />
    </div>
  );
}
