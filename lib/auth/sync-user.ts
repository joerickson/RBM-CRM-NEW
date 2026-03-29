"use server";

import { randomUUID } from "crypto";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";

export async function syncClerkUserToSupabase() {
  const user = await currentUser();
  if (!user) return null;

  const role =
    (user.publicMetadata?.role as
      | "admin"
      | "sales"
      | "building-ops"
      | "customer"
      | undefined) ?? "sales";

  const email = user.emailAddresses[0]?.emailAddress ?? "";
  const fullName =
    [user.firstName, user.lastName].filter(Boolean).join(" ") || null;

  const [profile] = await db
    .insert(profiles)
    .values({
      id: randomUUID(),
      clerkId: user.id,
      email,
      fullName,
      role,
      permissions: [role],
      status: "active",
    })
    .onConflictDoUpdate({
      target: profiles.clerkId,
      set: {
        email,
        fullName,
        role,
        permissions: [role],
        status: "active",
        updatedAt: new Date(),
      },
    })
    .returning();

  return profile ?? null;
}
