"use server";

import { db } from "@/lib/db";
import { customers, customerInteractions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { customerSchema, interactionSchema } from "@/lib/validations";
import { z } from "zod";

export async function createCustomer(
  data: z.infer<typeof customerSchema>
) {
  const validated = customerSchema.safeParse(data);
  if (!validated.success) {
    return { error: "Invalid data", details: validated.error.flatten() };
  }

  try {
    const [customer] = await db
      .insert(customers)
      .values({
        ...validated.data,
        monthlyValue: validated.data.monthlyValue?.toString(),
      })
      .returning();

    revalidatePath("/customers");
    revalidatePath("/sales");
    return { data: customer };
  } catch (err) {
    console.error(err);
    return { error: "Failed to create customer" };
  }
}

export async function updateCustomer(
  id: string,
  data: Partial<z.infer<typeof customerSchema>>
) {
  try {
    const [updated] = await db
      .update(customers)
      .set({
        ...data,
        monthlyValue: data.monthlyValue?.toString(),
        updatedAt: new Date(),
      })
      .where(eq(customers.id, id))
      .returning();

    revalidatePath("/customers");
    revalidatePath(`/customers/${id}`);
    revalidatePath("/sales");
    return { data: updated };
  } catch (err) {
    console.error(err);
    return { error: "Failed to update customer" };
  }
}

export async function updateCustomerStage(id: string, stage: string) {
  try {
    await db
      .update(customers)
      .set({ stage: stage as any, updatedAt: new Date() })
      .where(eq(customers.id, id));

    revalidatePath("/sales");
    revalidatePath(`/customers/${id}`);
    return { success: true };
  } catch (err) {
    console.error(err);
    return { error: "Failed to update stage" };
  }
}

export async function deleteCustomer(id: string) {
  try {
    await db.delete(customers).where(eq(customers.id, id));
    revalidatePath("/customers");
    revalidatePath("/sales");
    return { success: true };
  } catch (err) {
    console.error(err);
    return { error: "Failed to delete customer" };
  }
}

export async function createInteraction(
  data: z.infer<typeof interactionSchema>,
  repId: string
) {
  const validated = interactionSchema.safeParse(data);
  if (!validated.success) {
    return { error: "Invalid data" };
  }

  try {
    const [interaction] = await db
      .insert(customerInteractions)
      .values({
        ...validated.data,
        repId,
        interactionDate: new Date(validated.data.interactionDate),
        nextFollowUpDate: validated.data.nextFollowUpDate || null,
      })
      .returning();

    revalidatePath(`/customers/${data.customerId}`);
    return { data: interaction };
  } catch (err) {
    console.error(err);
    return { error: "Failed to log interaction" };
  }
}

export interface BulkImportRow {
  companyName: string;
  propertyName?: string;
  primaryContactName?: string;
  primaryContactEmail?: string;
  primaryContactPhone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  industry?: string;
  monthlyValue?: number | null;
  status?: string;
  notes?: string;
  brand?: string;
  stage?: string;
}

const VALID_STATUSES = ["lead", "prospect", "active", "at-risk", "churned"] as const;
const VALID_BRANDS = ["rbm-services", "double-take", "five-star"] as const;
const VALID_STAGES = [
  "new-lead",
  "contacted",
  "qualified",
  "proposal-sent",
  "negotiating",
  "closed-won",
  "closed-lost",
] as const;

export async function bulkImportCustomers(rows: BulkImportRow[]) {
  let created = 0;
  let updated = 0;
  const errors: string[] = [];

  // Load all existing customers once for duplicate detection
  const existing = await db
    .select({ id: customers.id, companyName: customers.companyName })
    .from(customers);

  const existingMap = new Map(
    existing.map((c) => [c.companyName.toLowerCase().trim(), c.id])
  );

  for (const row of rows) {
    try {
      const companyKey = row.companyName.toLowerCase().trim();

      // Build notes: prepend property name if supplied
      let notes = row.notes ?? "";
      if (row.propertyName) {
        notes = `Property: ${row.propertyName}${notes ? "\n" + notes : ""}`;
      }

      const brand = VALID_BRANDS.includes(row.brand as any)
        ? (row.brand as typeof VALID_BRANDS[number])
        : "rbm-services";

      const status = VALID_STATUSES.includes(row.status as any)
        ? (row.status as typeof VALID_STATUSES[number])
        : "lead";

      const stage = VALID_STAGES.includes(row.stage as any)
        ? (row.stage as typeof VALID_STAGES[number])
        : null;

      const data = {
        brand,
        companyName: row.companyName,
        status,
        stage,
        industry: row.industry || null,
        address: row.address || null,
        city: row.city || null,
        state: row.state || null,
        zip: row.zip || null,
        primaryContactName: row.primaryContactName || null,
        primaryContactEmail: row.primaryContactEmail || null,
        primaryContactPhone: row.primaryContactPhone || null,
        monthlyValue: row.monthlyValue != null ? String(row.monthlyValue) : null,
        notes: notes || null,
      };

      const existingId = existingMap.get(companyKey);

      if (existingId) {
        await db
          .update(customers)
          .set({ ...data, updatedAt: new Date() })
          .where(eq(customers.id, existingId));
        updated++;
      } else {
        await db.insert(customers).values(data);
        created++;
        // Add to map so subsequent rows with same name are treated as updates
        existingMap.set(companyKey, "pending");
      }
    } catch (err) {
      errors.push(
        `"${row.companyName}": ${err instanceof Error ? err.message : "Unknown error"}`
      );
    }
  }

  revalidatePath("/customers");
  revalidatePath("/sales");

  return { created, updated, errors };
}
