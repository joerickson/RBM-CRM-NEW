import { db } from "@/lib/db";
import { customers } from "@/lib/db/schema";
import { eq, ilike, or, and, desc } from "drizzle-orm";

export async function getAllCustomers(filters?: {
  status?: string;
  brand?: string;
  search?: string;
}) {
  const conditions = [];

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

export async function getLeadsForSales() {
  return db.query.customers.findMany({
    where: or(
      eq(customers.status, "lead"),
      eq(customers.status, "prospect")
    ),
    with: { assignedRep: true },
    orderBy: [desc(customers.updatedAt)],
  });
}

export async function getKanbanCustomers() {
  return db.query.customers.findMany({
    where: (c, { isNotNull, or, eq }) =>
      or(
        isNotNull(c.stage),
        eq(c.status, "lead"),
        eq(c.status, "prospect"),
        eq(c.status, "active"),
        eq(c.status, "at-risk"),
        eq(c.status, "churned")
      ),
    with: { assignedRep: true },
    orderBy: [desc(customers.updatedAt)],
  });
}
