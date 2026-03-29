"use server";

import { randomUUID } from "crypto";
import { currentUser, clerkClient } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { profiles, pendingInvitations } from "@/lib/db/schema";
import { and, eq, gt, isNull } from "drizzle-orm";

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
  let role: AllowedRole =
    rawRole && VALID_ROLES.includes(rawRole as AllowedRole)
      ? (rawRole as AllowedRole)
      : "sales_rep";

  const email = user.emailAddresses[0]?.emailAddress ?? "";
  const fullName =
    [user.firstName, user.lastName].filter(Boolean).join(" ") || null;

  // If no role in Clerk metadata, check for a pending invitation by email
  if (!rawRole || !VALID_ROLES.includes(rawRole as AllowedRole)) {
    if (email) {
      const invite = await db.query.pendingInvitations.findFirst({
        where: and(
          eq(pendingInvitations.email, email),
          isNull(pendingInvitations.usedAt),
          gt(pendingInvitations.expiresAt, new Date())
        ),
      });

      if (invite) {
        const inviteRole = invite.role as AllowedRole;
        if (VALID_ROLES.includes(inviteRole)) {
          role = inviteRole;
        }

        // Mark invitation as used
        await db
          .update(pendingInvitations)
          .set({ usedAt: new Date() })
          .where(eq(pendingInvitations.id, invite.id));

        // Persist role in Clerk publicMetadata so future syncs are consistent
        try {
          const client = await clerkClient();
          await client.users.updateUserMetadata(user.id, {
            publicMetadata: { role },
          });
        } catch (err) {
          console.error("[sync-user] failed to update Clerk metadata", err);
        }
      }
    }
  }

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
