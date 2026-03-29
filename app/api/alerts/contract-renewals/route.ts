import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { customers } from "@/lib/db/schema";
import { and, eq, lte, gte, isNotNull, sql } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";

export const dynamic = "force-dynamic";

export interface ContractRenewalAlert {
  id: string;
  company_name: string;
  brand: string;
  monthly_value: string | null;
  contract_end_date: string;
  days_until_renewal: number;
  primary_contact_name: string | null;
  primary_contact_email: string | null;
  assigned_rep_name: string | null;
  urgency: "critical" | "high" | "medium";
}

/**
 * GET /api/alerts/contract-renewals?days=90
 * Returns customers with contracts expiring within the specified days.
 */
export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const days = parseInt(searchParams.get("days") ?? "90", 10);

  const today = new Date();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() + days);

  const result = await db.execute(sql`
    SELECT
      c.id,
      c.company_name,
      c.brand,
      c.monthly_value,
      c.contract_end_date,
      c.primary_contact_name,
      c.primary_contact_email,
      p.full_name as assigned_rep_name,
      (c.contract_end_date::date - CURRENT_DATE) as days_until_renewal
    FROM customers c
    LEFT JOIN profiles p ON p.id = c.assigned_rep_id
    WHERE
      c.status IN ('active', 'prospect')
      AND c.contract_end_date IS NOT NULL
      AND c.contract_end_date::date >= CURRENT_DATE
      AND c.contract_end_date::date <= (CURRENT_DATE + ${days} * INTERVAL '1 day')
    ORDER BY c.contract_end_date ASC
  `);

  const alerts = (result as any[]).map((row) => ({
    ...row,
    days_until_renewal: parseInt(row.days_until_renewal, 10),
    urgency:
      row.days_until_renewal <= 30
        ? "critical"
        : row.days_until_renewal <= 60
        ? "high"
        : "medium",
  })) as ContractRenewalAlert[];

  return NextResponse.json({ alerts, count: alerts.length });
}
