import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { customers, tasks, customerRequests, events } from "@/lib/db/schema";
import { ilike, or, and, ne, desc } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();

  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const pattern = `%${q}%`;

  const [matchedCustomers, matchedTasks, matchedRequests, matchedEvents] =
    await Promise.all([
      db.query.customers.findMany({
        where: or(
          ilike(customers.companyName, pattern),
          ilike(customers.primaryContactName, pattern),
          ilike(customers.primaryContactEmail, pattern),
          ilike(customers.city, pattern)
        ),
        columns: {
          id: true,
          companyName: true,
          status: true,
          brand: true,
          primaryContactName: true,
          city: true,
          state: true,
        },
        orderBy: [desc(customers.updatedAt)],
        limit: 5,
      }),

      db.query.tasks.findMany({
        where: or(
          ilike(tasks.title, pattern),
          ilike(tasks.description, pattern)
        ),
        columns: {
          id: true,
          title: true,
          status: true,
          priority: true,
        },
        with: {
          customer: {
            columns: { id: true, companyName: true },
          },
        },
        orderBy: [desc(tasks.updatedAt)],
        limit: 5,
      }),

      db.query.customerRequests.findMany({
        where: and(
          ne(customerRequests.status, "closed"),
          or(
            ilike(customerRequests.subject, pattern),
            ilike(customerRequests.customerName, pattern),
            ilike(customerRequests.description, pattern)
          )
        ),
        columns: {
          id: true,
          subject: true,
          status: true,
          customerName: true,
          priority: true,
        },
        orderBy: [desc(customerRequests.createdAt)],
        limit: 5,
      }),

      db.query.events.findMany({
        where: or(
          ilike(events.name, pattern),
          ilike(events.location, pattern)
        ),
        columns: {
          id: true,
          name: true,
          date: true,
          type: true,
          location: true,
        },
        orderBy: [desc(events.date)],
        limit: 3,
      }),
    ]);

  const results = [
    ...matchedCustomers.map((c) => ({
      type: "customer" as const,
      id: c.id,
      title: c.companyName,
      subtitle: [c.primaryContactName, c.city && c.state ? `${c.city}, ${c.state}` : null]
        .filter(Boolean)
        .join(" · "),
      badge: c.status,
      href: `/customers/${c.id}`,
    })),
    ...matchedTasks.map((t) => ({
      type: "task" as const,
      id: t.id,
      title: t.title,
      subtitle: t.customer ? `${t.customer.companyName}` : "No customer",
      badge: t.status,
      href: `/tasks`,
    })),
    ...matchedRequests.map((r) => ({
      type: "request" as const,
      id: r.id,
      title: r.subject,
      subtitle: r.customerName,
      badge: r.status,
      href: `/admin`,
    })),
    ...matchedEvents.map((e) => ({
      type: "event" as const,
      id: e.id,
      title: e.name,
      subtitle: e.location ?? "",
      badge: e.type,
      href: `/events`,
    })),
  ];

  return NextResponse.json({ results });
}
