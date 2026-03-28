import { db } from "@/lib/db";
import { customers, tasks, visits, customerRequests } from "@/lib/db/schema";
import { eq, count, and, gte, lte, sql } from "drizzle-orm";
import { DashboardStats } from "@/types";

export async function getDashboardStats(): Promise<DashboardStats> {
  const today = new Date();
  const startOfDay = new Date(today.setHours(0, 0, 0, 0));
  const endOfDay = new Date(today.setHours(23, 59, 59, 999));

  const [
    totalCustomersResult,
    activeCustomersResult,
    totalLeadsResult,
    atRiskCustomersResult,
    openTasksResult,
    scheduledVisitsResult,
    openRequestsResult,
    revenueResult,
  ] = await Promise.all([
    db.select({ count: count() }).from(customers),
    db
      .select({ count: count() })
      .from(customers)
      .where(eq(customers.status, "active")),
    db
      .select({ count: count() })
      .from(customers)
      .where(eq(customers.status, "lead")),
    db
      .select({ count: count() })
      .from(customers)
      .where(eq(customers.status, "at-risk")),
    db
      .select({ count: count() })
      .from(tasks)
      .where(eq(tasks.status, "todo")),
    db
      .select({ count: count() })
      .from(visits)
      .where(
        and(
          eq(visits.status, "scheduled"),
          gte(visits.visitDate, startOfDay),
          lte(visits.visitDate, endOfDay)
        )
      ),
    db
      .select({ count: count() })
      .from(customerRequests)
      .where(eq(customerRequests.status, "open")),
    db
      .select({
        total: sql<string>`COALESCE(SUM(monthly_value), 0)`,
      })
      .from(customers)
      .where(eq(customers.status, "active")),
  ]);

  return {
    totalCustomers: totalCustomersResult[0]?.count ?? 0,
    activeCustomers: activeCustomersResult[0]?.count ?? 0,
    totalLeads: totalLeadsResult[0]?.count ?? 0,
    atRiskCustomers: atRiskCustomersResult[0]?.count ?? 0,
    openTasks: openTasksResult[0]?.count ?? 0,
    scheduledVisitsToday: scheduledVisitsResult[0]?.count ?? 0,
    openRequests: openRequestsResult[0]?.count ?? 0,
    monthlyRevenue: parseFloat(revenueResult[0]?.total ?? "0"),
  };
}

export async function getAtRiskCustomers() {
  return db.query.customers.findMany({
    where: eq(customers.status, "at-risk"),
    with: { assignedRep: true },
    limit: 10,
  });
}

export async function getRecentActivity() {
  const recentCustomers = await db.query.customers.findMany({
    orderBy: (c, { desc }) => [desc(c.updatedAt)],
    limit: 5,
    with: { assignedRep: true },
  });
  return recentCustomers;
}
