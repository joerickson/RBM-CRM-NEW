"use server";

import { db } from "@/lib/db";
import { customerRequests } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { customerRequestSchema } from "@/lib/validations";
import { z } from "zod";

export async function createCustomerRequest(
  data: z.infer<typeof customerRequestSchema>
) {
  const validated = customerRequestSchema.safeParse(data);
  if (!validated.success) {
    return { error: "Invalid data", details: validated.error.flatten() };
  }

  try {
    const [request] = await db
      .insert(customerRequests)
      .values(validated.data)
      .returning();

    return { data: request };
  } catch (err) {
    console.error(err);
    return { error: "Failed to submit request" };
  }
}

export async function updateRequestStatus(
  id: string,
  status: "open" | "in-review" | "resolved" | "closed",
  assignedToId?: string
) {
  try {
    const updateData: Record<string, any> = {
      status,
      updatedAt: new Date(),
    };

    if (assignedToId) {
      updateData.assignedToId = assignedToId;
    }

    if (status === "resolved" || status === "closed") {
      updateData.resolvedAt = new Date();
    }

    await db
      .update(customerRequests)
      .set(updateData)
      .where(eq(customerRequests.id, id));

    revalidatePath("/admin");
    return { success: true };
  } catch (err) {
    console.error(err);
    return { error: "Failed to update request" };
  }
}
