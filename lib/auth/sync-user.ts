"use server";

import { randomUUID } from "crypto";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";

export type AllowedRole =
  | "admin"
  | "sales_manager"
  | "sales_rep"
  | "account_manager"
  | "building_ops"
  | "sales"
  | "building-ops"
  | "customer"
  | "events-only";

const VALID_ROLES: AllowedRole[] = [
  "admin",
  "sales_manager",
  "sales_rep",
  "account_manager",
  "building_ops",
  // legacy values kept for backward compat
  "sales",
  "building-ops",
  "customer",
  "events-only",
];

export async function syncClerkUserToSupabase() {
  const user = await currentUser();
  if (!user) return null;

  const rawRole = user.publicMetadata?.role as string | undefined;
  const role: AllowedRole =
    rawRole && VALID_ROLES.includes(rawRole as AllowedRole)
      ? (rawRole as AllowedRole)
      : "sales_rep";

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
