import { db } from "@/lib/db";
import { customers } from "@/lib/db/schema";
import { eq, ilike, or, and, desc } from "drizzle-orm";
import { isRestrictedRole } from "@/lib/auth/get-current-profile";
import type { AllowedRole } from "@/lib/auth/sync-user";

export interface CustomerQueryContext {
  role: AllowedRole;
  clerkId: string;
}

export async function getAllCustomers(
  filters?: {
    status?: string;
    brand?: string;
    search?: string;
  },
  ctx?: CustomerQueryContext
) {
  const conditions: any[] = [];

  if (filters?.status) {
    conditions.push(eq(customers.status, filters.status as any));
  }
  if (filters?.brand) {
    conditions.push(eq(customers.brand, filters.brand as any));
  }
  if (filters?.search) {
    conditions.push(
      or(
        ilike(customers.companyName, `%${filters.search}%`),
        ilike(customers.primaryContactName, `%${filters.search}%`),
        ilike(customers.primaryContactEmail, `%${filters.search}%`)
      )
    );
  }

  // RBAC: restricted roles only see their own assigned records
  if (ctx && isRestrictedRole(ctx.role)) {
    conditions.push(eq(customers.assignedSalesRepClerkId, ctx.clerkId));
  }

  return db.query.customers.findMany({
    where: conditions.length > 0 ? and(...conditions) : undefined,
    with: { assignedRep: true },
    orderBy: [desc(customers.updatedAt)],
  });
}

export async function getCustomerById(id: string) {
  return db.query.customers.findFirst({
    where: eq(customers.id, id),
    with: {
      assignedRep: true,
      sites: true,
      visits: {
        with: { employee: true },
        orderBy: (v, { desc }) => [desc(v.visitDate)],
        limit: 10,
      },
      interactions: {
        with: { rep: true },
        orderBy: (i, { desc }) => [desc(i.interactionDate)],
        limit: 20,
      },
      requests: {
        orderBy: (r, { desc }) => [desc(r.createdAt)],
        limit: 10,
      },
      eventCustomers: {
        with: { event: true },
        orderBy: (ec, { desc }) => [desc(ec.createdAt)],
        limit: 20,
      },
    },
  });
}

export async function getLeadsForSales(ctx?: CustomerQueryContext) {
  const conditions: any[] = [
    or(eq(customers.status, "lead"), eq(customers.status, "prospect"))!,
  ];

  if (ctx && isRestrictedRole(ctx.role)) {
    conditions.push(eq(customers.assignedSalesRepClerkId, ctx.clerkId));
  }

  return db.query.customers.findMany({
    where: and(...conditions),
    with: { assignedRep: true },
    orderBy: [desc(customers.updatedAt)],
  });
}

export async function getKanbanCustomers(ctx?: CustomerQueryContext) {
  const stageFilter = (c: any, { isNotNull, or: _or, eq: _eq }: any) =>
    _or(
      isNotNull(c.stage),
      _eq(c.status, "lead"),
      _eq(c.status, "prospect"),
      _eq(c.status, "active"),
      _eq(c.status, "at-risk"),
      _eq(c.status, "churned")
    );

  if (ctx && isRestrictedRole(ctx.role)) {
    return db.query.customers.findMany({
      where: (c, helpers) =>
        and(
          stageFilter(c, helpers),
          eq(customers.assignedSalesRepClerkId, ctx.clerkId)
        ),
      with: { assignedRep: true },
      orderBy: [desc(customers.updatedAt)],
    });
  }

  return db.query.customers.findMany({
    where: stageFilter,
    with: { assignedRep: true },
    orderBy: [desc(customers.updatedAt)],
  });
}
