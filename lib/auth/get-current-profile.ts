import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type { AllowedRole } from "./sync-user";

export type CurrentProfile = {
  id: string;
  clerkId: string;
  email: string;
  fullName: string | null;
  role: AllowedRole;
};

/**
 * Returns the current user's profile (id, clerkId, role).
 * Returns null if the user is not authenticated or has no profile.
 */
export async function getCurrentProfile(): Promise<CurrentProfile | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.clerkId, userId),
  });

  if (!profile) return null;

  return {
    id: profile.id,
    clerkId: profile.clerkId ?? userId,
    email: profile.email,
    fullName: profile.fullName ?? null,
    role: (profile.role ?? "sales_rep") as AllowedRole,
  };
}

/**
 * Returns true if the given role has full (manager/admin) access to all records.
 */
export function isManagerRole(role: AllowedRole): boolean {
  return role === "admin" || role === "sales_manager" || role === "sales";
}

/**
 * Returns true if the given role is restricted to their own assigned records.
 */
export function isRestrictedRole(role: AllowedRole): boolean {
  return (
    role === "sales_rep" ||
    role === "account_manager" ||
    role === "building_ops" ||
    role === "building-ops"
  );
}
