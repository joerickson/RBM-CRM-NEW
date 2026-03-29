export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { Header } from "@/components/layout/header";
import { getCustomerById } from "@/server/queries/customers";
import { CustomerDetailClient } from "@/components/customers/customer-detail-client";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const customer = await getCustomerById(id);

  if (!customer) notFound();

  return (
    <div className="flex flex-col h-full">
      <Header title={customer.companyName} />
      <CustomerDetailClient customer={customer as any} />
    </div>
  );
}
