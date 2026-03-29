import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { inArray } from "drizzle-orm";

export async function getSalesRepProfiles() {
  return db
    .select({ id: profiles.id, clerkId: profiles.clerkId, fullName: profiles.fullName, email: profiles.email })
    .from(profiles)
    .where(inArray(profiles.role, ["sales_rep", "sales_manager"]));
}

export async function getOpsManagerProfiles() {
  return db
    .select({ id: profiles.id, clerkId: profiles.clerkId, fullName: profiles.fullName, email: profiles.email })
    .from(profiles)
    .where(inArray(profiles.role, ["building_ops", "account_manager"]));
}
