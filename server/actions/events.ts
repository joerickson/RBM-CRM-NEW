"use server";

import { db } from "@/lib/db";
import { events, eventCustomers, eventAttendees } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { eventSchema } from "@/lib/validations";
import { z } from "zod";

export async function createEvent(
  data: z.infer<typeof eventSchema>,
  createdById?: string
) {
  const validated = eventSchema.safeParse(data);
  if (!validated.success) {
    return { error: "Invalid data", details: validated.error.flatten() };
  }

  try {
    const [event] = await db
      .insert(events)
      .values({
        ...validated.data,
        date: new Date(validated.data.date).toISOString(),
        createdById: createdById ?? null,
      })
      .returning();

    revalidatePath("/events");
    return { data: event };
  } catch (err) {
    console.error(err);
    return { error: "Failed to create event" };
  }
}

export async function updateEvent(
  id: string,
  data: Partial<z.infer<typeof eventSchema>>
) {
  try {
    const [updated] = await db
      .update(events)
      .set({
        ...data,
        date: data.date ? new Date(data.date).toISOString() : undefined,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(events.id, id))
      .returning();

    revalidatePath("/events");
    return { data: updated };
  } catch (err) {
    console.error(err);
    return { error: "Failed to update event" };
  }
}

export async function deleteEvent(id: string) {
  try {
    await db.delete(events).where(eq(events.id, id));
    revalidatePath("/events");
    return { success: true };
  } catch (err) {
    console.error(err);
    return { error: "Failed to delete event" };
  }
}

export async function addCustomerToEvent(
  eventId: string,
  customerId: string,
  notes?: string
) {
  try {
    const [link] = await db
      .insert(eventCustomers)
      .values({ eventId, customerId, attended: false, notes: notes ?? null })
      .onConflictDoNothing()
      .returning();

    revalidatePath("/events");
    revalidatePath(`/customers/${customerId}`);
    return { data: link };
  } catch (err) {
    console.error(err);
    return { error: "Failed to add customer to event" };
  }
}

export async function removeCustomerFromEvent(eventId: string, customerId: string) {
  try {
    await db
      .delete(eventCustomers)
      .where(
        and(
          eq(eventCustomers.eventId, eventId),
          eq(eventCustomers.customerId, customerId)
        )
      );

    revalidatePath("/events");
    revalidatePath(`/customers/${customerId}`);
    return { success: true };
  } catch (err) {
    console.error(err);
    return { error: "Failed to remove customer from event" };
  }
}

export async function updateAttendance(
  eventId: string,
  customerId: string,
  attended: boolean
) {
  try {
    await db
      .update(eventCustomers)
      .set({ attended })
      .where(
        and(
          eq(eventCustomers.eventId, eventId),
          eq(eventCustomers.customerId, customerId)
        )
      );

    revalidatePath("/events");
    revalidatePath(`/customers/${customerId}`);
    return { success: true };
  } catch (err) {
    console.error(err);
    return { error: "Failed to update attendance" };
  }
}
