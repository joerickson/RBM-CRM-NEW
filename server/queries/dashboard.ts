import { db } from "@/lib/db";
import { customers, tasks, visits, customerRequests } from "@/lib/db/schema";
import { eq, count, and, gte, lte, sql } from "drizzle-orm";
import { DashboardStats } from "@/types";

export async function getDashboardStats(): Promise<DashboardStats> {
  const today = new Date();
  const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
  const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();

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

export async function getAtRiskCustomers(thresholdDays = 90) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - thresholdDays);

  const result = await db.execute(sql`
    SELECT c.id, c.company_name, c.status, c.brand, c.monthly_value,
           c.ai_risk_score, c.ai_health_score, c.risk_threshold_days,
           c.primary_contact_name,
           MAX(v.visit_date) as last_visit_date
    FROM customers c
    LEFT JOIN visits v ON v.customer_id = c.id AND v.status = 'completed'
    WHERE c.status IN ('active', 'at-risk')
    GROUP BY c.id
    HAVING MAX(v.visit_date) IS NULL OR MAX(v.visit_date) < ${cutoff}
    ORDER BY last_visit_date ASC NULLS FIRST
    LIMIT 10
  `);

  return result as unknown as Array<{
    id: string;
    company_name: string;
    status: string;
    brand: string;
    monthly_value: string | null;
    ai_risk_score: number | null;
    ai_health_score: number | null;
    risk_threshold_days: number | null;
    primary_contact_name: string | null;
    last_visit_date: string | null;
  }>;
}

export async function getRecentActivity() {
  const recentCustomers = await db.query.customers.findMany({
    orderBy: (c, { desc }) => [desc(c.updatedAt)],
    limit: 5,
    with: { assignedRep: true },
  });
  return recentCustomers;
}
