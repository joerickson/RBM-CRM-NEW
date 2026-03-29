import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function syncClerkUser() {
  const user = await currentUser();
  if (!user) return null;

  const existing = await db.query.profiles.findFirst({
    where: eq(profiles.clerkId, user.id),
  });

  if (existing) return existing;

  const role =
    (user.publicMetadata?.role as
      | "admin"
      | "sales"
      | "building-ops"
      | "customer"
      | undefined) ?? "sales";

  const [created] = await db
    .insert(profiles)
    .values({
      clerkId: user.id,
      email: user.emailAddresses[0]?.emailAddress ?? "",
      fullName: [user.firstName, user.lastName].filter(Boolean).join(" ") || null,
      role,
    })
    .onConflictDoNothing()
    .returning();

  return created ?? null;
}
