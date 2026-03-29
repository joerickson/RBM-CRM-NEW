export const dynamic = "force-dynamic";

import { Header } from "@/components/layout/header";
import { getDashboardStats, getAtRiskCustomers } from "@/server/queries/dashboard";
import { DashboardClient } from "@/components/dashboard/dashboard-client";

export default async function DashboardPage() {
  const [stats, atRiskCustomers] = await Promise.all([
    getDashboardStats(),
    getAtRiskCustomers(),
  ]);

  return (
    <div className="flex flex-col h-full">
      <Header title="Dashboard" />
      <DashboardClient stats={stats} atRiskCustomers={atRiskCustomers as any} />
    </div>
  );
}
