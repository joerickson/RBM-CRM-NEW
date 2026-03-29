import { db } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
import { eq, or, desc } from "drizzle-orm";
import { isRestrictedRole } from "@/lib/auth/get-current-profile";
import type { AllowedRole } from "@/lib/auth/sync-user";

export async function getTasksByRole(role: AllowedRole, clerkId: string) {
  if (isRestrictedRole(role)) {
    // Restricted roles: only tasks assigned to them (by clerk_id)
    return db.query.tasks.findMany({
      where: eq(tasks.assignedSalesRepClerkId, clerkId),
      with: { assignedTo: true, customer: true, createdBy: true },
      orderBy: [desc(tasks.createdAt)],
    });
  }

  // Admins / managers: all tasks
  return db.query.tasks.findMany({
    with: { assignedTo: true, customer: true, createdBy: true },
    orderBy: [desc(tasks.createdAt)],
  });
}
