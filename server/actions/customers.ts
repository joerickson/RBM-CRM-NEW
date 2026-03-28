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
