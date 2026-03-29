"use server";

import { db } from "@/lib/db";
import {
  events,
  eventCustomers,
  eventAttendees,
  eventTypes,
  attendees,
  customers,
  employees,
} from "@/lib/db/schema";
import { eq, and, ilike, or, desc, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { eventSchema, eventTypeSchema, eventAttendeeSchema } from "@/lib/validations";
import { z } from "zod";

// ─── Events CRUD ─────────────────────────────────────────────────────────────

export async function createEvent(
  data: z.infer<typeof eventSchema>,
  createdById?: string
) {
  const validated = eventSchema.safeParse(data);
  if (!validated.success) {
    return { error: "Invalid data", details: validated.error.flatten() };
  }

  try {
    const { type, eventTypeId, ...rest } = validated.data;
    const [event] = await db
      .insert(events)
      .values({
        ...rest,
        type: (type ?? "other") as any,
        eventTypeId: eventTypeId ?? null,
        date: new Date(validated.data.date),
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
    const { type, eventTypeId, ...rest } = data;
    const [updated] = await db
      .update(events)
      .set({
        ...rest,
        ...(type ? { type: type as any } : {}),
        ...(eventTypeId !== undefined ? { eventTypeId } : {}),
        date: data.date ? new Date(data.date) : undefined,
        updatedAt: new Date(),
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
    await db.delete(eventCustomers).where(eq(eventCustomers.eventId, id));
    await db.delete(eventAttendees).where(eq(eventAttendees.eventId, id));
    await db.delete(events).where(eq(events.id, id));
    revalidatePath("/events");
    return { success: true };
  } catch (err) {
    console.error(err);
    return { error: "Failed to delete event" };
  }
}

// ─── Customer ↔ Event ─────────────────────────────────────────────────────────

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

export async function updateCustomerEventTickets(
  eventId: string,
  customerId: string,
  ticketsAssigned: number,
  parkingAssigned: number
) {
  try {
    await db
      .update(eventCustomers)
      .set({ ticketsAssigned, parkingAssigned })
      .where(
        and(
          eq(eventCustomers.eventId, eventId),
          eq(eventCustomers.customerId, customerId)
        )
      );

    revalidatePath("/events");
    return { success: true };
  } catch (err) {
    console.error(err);
    return { error: "Failed to update tickets" };
  }
}

export async function updateCustomerEventFields(
  eventId: string,
  customerId: string,
  ticketsAssigned: number,
  parkingAssigned: number,
  ticketsSent: boolean,
  parkingSent: boolean
) {
  try {
    await db
      .update(eventCustomers)
      .set({ ticketsAssigned, parkingAssigned, ticketsSent, parkingSent })
      .where(
        and(
          eq(eventCustomers.eventId, eventId),
          eq(eventCustomers.customerId, customerId)
        )
      );

    revalidatePath("/events");
    return { success: true };
  } catch (err) {
    console.error(err);
    return { error: "Failed to update attendee" };
  }
}

// ─── Non-customer Attendees ───────────────────────────────────────────────────

export async function addAttendeeToEvent(
  eventId: string,
  data: z.infer<typeof eventAttendeeSchema>
) {
  const validated = eventAttendeeSchema.safeParse(data);
  if (!validated.success) {
    return { error: "Invalid data" };
  }

  try {
    // If attendeeId is provided, link to existing attendee record
    // Otherwise create/find an attendee record
    let attendeeId = validated.data.attendeeId ?? null;

    if (!attendeeId && validated.data.name) {
      // Create a new attendee record for future re-use
      const [newAttendee] = await db
        .insert(attendees)
        .values({
          fullName: validated.data.name,
          email: validated.data.email ?? null,
          phone: validated.data.phone ?? null,
          company: validated.data.company ?? null,
          notes: validated.data.notes ?? null,
        })
        .returning();
      attendeeId = newAttendee.id;
    }

    const [ea] = await db
      .insert(eventAttendees)
      .values({
        eventId,
        attendeeId,
        name: validated.data.name,
        email: validated.data.email ?? null,
        phone: validated.data.phone ?? null,
        company: validated.data.company ?? null,
        type: validated.data.type,
        ticketsAssigned: validated.data.ticketsAssigned,
        parkingAssigned: validated.data.parkingAssigned,
      })
      .returning();

    // Increment attendance count on the attendees record
    if (attendeeId) {
      await db.execute(
        sql`UPDATE attendees SET attendance_count = attendance_count + 1, last_attended = NOW() WHERE id = ${attendeeId}`
      );
    }

    revalidatePath("/events");
    return { data: ea };
  } catch (err) {
    console.error(err);
    return { error: "Failed to add attendee" };
  }
}

export async function removeAttendeeFromEvent(eventAttendeeId: string) {
  try {
    await db.delete(eventAttendees).where(eq(eventAttendees.id, eventAttendeeId));
    revalidatePath("/events");
    return { success: true };
  } catch (err) {
    console.error(err);
    return { error: "Failed to remove attendee" };
  }
}

export async function updateEventAttendeeTickets(
  eventAttendeeId: string,
  ticketsAssigned: number,
  parkingAssigned: number
) {
  try {
    await db
      .update(eventAttendees)
      .set({ ticketsAssigned, parkingAssigned })
      .where(eq(eventAttendees.id, eventAttendeeId));

    revalidatePath("/events");
    return { success: true };
  } catch (err) {
    console.error(err);
    return { error: "Failed to update tickets" };
  }
}

export async function updateEventAttendeeFields(
  eventAttendeeId: string,
  ticketsAssigned: number,
  parkingAssigned: number,
  ticketsSent: boolean,
  parkingSent: boolean
) {
  try {
    await db
      .update(eventAttendees)
      .set({ ticketsAssigned, parkingAssigned, ticketsSent, parkingSent })
      .where(eq(eventAttendees.id, eventAttendeeId));

    revalidatePath("/events");
    return { success: true };
  } catch (err) {
    console.error(err);
    return { error: "Failed to update attendee" };
  }
}

// ─── Event Type Settings ──────────────────────────────────────────────────────

export async function createEventType(data: z.infer<typeof eventTypeSchema>) {
  const validated = eventTypeSchema.safeParse(data);
  if (!validated.success) {
    return { error: "Invalid data", details: validated.error.flatten() };
  }

  try {
    const [et] = await db
      .insert(eventTypes)
      .values(validated.data)
      .returning();

    revalidatePath("/admin/event-types");
    revalidatePath("/events");
    return { data: et };
  } catch (err: any) {
    console.error(err);
    if (err.message?.includes("unique")) {
      return { error: "A type with this slug already exists" };
    }
    return { error: "Failed to create event type" };
  }
}

export async function updateEventType(
  id: string,
  data: Partial<z.infer<typeof eventTypeSchema>>
) {
  try {
    const [updated] = await db
      .update(eventTypes)
      .set(data)
      .where(eq(eventTypes.id, id))
      .returning();

    revalidatePath("/admin/event-types");
    revalidatePath("/events");
    return { data: updated };
  } catch (err) {
    console.error(err);
    return { error: "Failed to update event type" };
  }
}

export async function deleteEventType(id: string) {
  try {
    await db.delete(eventTypes).where(eq(eventTypes.id, id));
    revalidatePath("/admin/event-types");
    revalidatePath("/events");
    return { success: true };
  } catch (err) {
    console.error(err);
    return { error: "Failed to delete event type" };
  }
}

// ─── Attendee Search ──────────────────────────────────────────────────────────

export async function searchAttendeesAndCustomers(query: string) {
  if (!query || query.length < 2) return { data: [] };

  try {
    const [customerResults, attendeeResults, employeeResults] = await Promise.all([
      db.query.customers.findMany({
        where: or(
          ilike(customers.companyName, `%${query}%`),
          ilike(customers.primaryContactName, `%${query}%`)
        ),
        columns: {
          id: true,
          companyName: true,
          primaryContactName: true,
          primaryContactEmail: true,
          primaryContactPhone: true,
        },
        limit: 5,
      }),
      db.query.attendees.findMany({
        where: or(
          ilike(attendees.fullName, `%${query}%`),
          ilike(attendees.company, `%${query}%`)
        ),
        orderBy: [desc(attendees.attendanceCount)],
        limit: 5,
      }),
      db.query.employees.findMany({
        where: ilike(employees.fullName, `%${query}%`),
        columns: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
        },
        limit: 5,
      }),
    ]);

    const results = [
      ...customerResults.map((c) => ({
        id: c.id,
        name: c.primaryContactName ?? c.companyName,
        company: c.companyName,
        email: c.primaryContactEmail,
        phone: c.primaryContactPhone,
        type: "customer" as const,
        customerId: c.id,
        attendeeId: null as string | null,
        employeeId: null as string | null,
      })),
      ...attendeeResults.map((a) => ({
        id: a.id,
        name: a.fullName,
        company: a.company,
        email: a.email,
        phone: a.phone,
        type: "attendee" as const,
        customerId: null as string | null,
        attendeeId: a.id,
        employeeId: null as string | null,
      })),
      ...employeeResults.map((e) => ({
        id: e.id,
        name: e.fullName,
        company: null as string | null,
        email: e.email,
        phone: e.phone,
        type: "employee" as const,
        customerId: null as string | null,
        attendeeId: null as string | null,
        employeeId: e.id,
      })),
    ];

    return { data: results };
  } catch (err) {
    console.error(err);
    return { error: "Search failed", data: [] };
  }
}
