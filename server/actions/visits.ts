"use server";

import { db } from "@/lib/db";
import { visits } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { visitSchema } from "@/lib/validations";
import { z } from "zod";

export async function createVisit(data: z.infer<typeof visitSchema>) {
  const validated = visitSchema.safeParse(data);
  if (!validated.success) {
    return { error: "Invalid data", details: validated.error.flatten() };
  }

  try {
    const [visit] = await db
      .insert(visits)
      .values({
        ...validated.data,
        visitDate: new Date(validated.data.visitDate).toISOString(),
        customerRating: validated.data.customerRating ?? null,
      })
      .returning();

    revalidatePath(`/customers/${data.customerId}`);
    return { data: visit };
  } catch (err) {
    console.error(err);
    return { error: "Failed to create visit" };
  }
}

export async function updateVisit(id: string, data: Partial<z.infer<typeof visitSchema>>) {
  try {
    const [updated] = await db
      .update(visits)
      .set({
        ...data,
        visitDate: data.visitDate ? new Date(data.visitDate).toISOString() : undefined,
      })
      .where(eq(visits.id, id))
      .returning();

    if (updated.customerId) {
      revalidatePath(`/customers/${updated.customerId}`);
    }
    return { data: updated };
  } catch (err) {
    console.error(err);
    return { error: "Failed to update visit" };
  }
}
