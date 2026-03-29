export const dynamic = "force-dynamic";

import { Header } from "@/components/layout/header";
import { getAllCustomers } from "@/server/queries/customers";
import { CustomersClient } from "@/components/customers/customers-client";
import {
  getAllCustomerStatuses,
  getAllIndustries,
  getAllVisitFrequencies,
} from "@/server/queries/settings";

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; brand?: string; search?: string }>;
}) {
  const params = await searchParams;
  const [customers, customerStatuses, industriesList, visitFrequenciesList] =
    await Promise.all([
      getAllCustomers(params),
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
