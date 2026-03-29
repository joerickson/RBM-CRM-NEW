import { db } from "@/lib/db";
import { events, eventCustomers } from "@/lib/db/schema";
import { eq, desc, sql } from "drizzle-orm";

export async function getAllEvents() {
  return db.query.events.findMany({
    with: {
      createdBy: true,
      eventCustomers: {
        with: { customer: true },
      },
      eventAttendees: true,
    },
    orderBy: [desc(events.date)],
  });
}

export async function getEventById(id: string) {
  return db.query.events.findFirst({
    where: eq(events.id, id),
    with: {
      createdBy: true,
      eventCustomers: {
        with: { customer: true },
      },
      eventAttendees: {
        with: { profile: true },
      },
    },
  });
}

export async function getEventsForCustomer(customerId: string) {
  return db.query.eventCustomers.findMany({
    where: eq(eventCustomers.customerId, customerId),
    with: {
      event: {
        with: { eventAttendees: true },
      },
    },
    orderBy: (ec, { desc }) => [desc(ec.createdAt)],
  });
}

export async function getAtRiskByVisits(thresholdDays = 90) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - thresholdDays);

  // Find active customers whose last completed visit is older than threshold
  // or who have never had a visit
  const result = await db.execute(sql`
    SELECT c.id, c.company_name, c.status, c.brand, c.monthly_value,
           c.ai_risk_score, c.ai_health_score, c.risk_threshold_days,
           c.primary_contact_name, c.primary_contact_email,
           MAX(v.visit_date) as last_visit_date
    FROM customers c
    LEFT JOIN visits v ON v.customer_id = c.id AND v.status = 'completed'
    WHERE c.status IN ('active', 'at-risk')
    GROUP BY c.id
    HAVING MAX(v.visit_date) IS NULL OR MAX(v.visit_date) < ${cutoff}
    ORDER BY last_visit_date ASC NULLS FIRST
    LIMIT 20
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
    primary_contact_email: string | null;
    last_visit_date: string | null;
  }>;
}
