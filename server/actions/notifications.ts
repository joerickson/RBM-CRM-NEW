"use server";

import { db } from "@/lib/db";
import { notifications, profiles } from "@/lib/db/schema";
import { eq, and, desc, count } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";

async function getCurrentProfileId(): Promise<string | null> {
  const { userId } = await auth();
  if (!userId) return null;
  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.clerkId, userId),
  });
  return profile?.id ?? null;
}

export async function getNotifications() {
  const profileId = await getCurrentProfileId();
  if (!profileId) return [];

  return db.query.notifications.findMany({
    where: eq(notifications.profileId, profileId),
    with: { customer: { columns: { id: true, companyName: true } } },
    orderBy: [desc(notifications.createdAt)],
    limit: 50,
  });
}

export async function getUnreadCount(): Promise<number> {
  const profileId = await getCurrentProfileId();
  if (!profileId) return 0;

  const result = await db
    .select({ count: count() })
    .from(notifications)
    .where(and(eq(notifications.profileId, profileId), eq(notifications.read, false)));

  return result[0]?.count ?? 0;
}

export async function markNotificationRead(id: string) {
  const profileId = await getCurrentProfileId();
  if (!profileId) return;

  await db
    .update(notifications)
    .set({ read: true })
    .where(and(eq(notifications.id, id), eq(notifications.profileId, profileId)));

  revalidatePath("/");
}

export async function markAllNotificationsRead() {
  const profileId = await getCurrentProfileId();
  if (!profileId) return;

  await db
    .update(notifications)
    .set({ read: true })
    .where(and(eq(notifications.profileId, profileId), eq(notifications.read, false)));

  revalidatePath("/");
}

export async function createNotification(data: {
  profileId: string;
  type: "contract-renewal" | "at-risk" | "task-assigned" | "request-submitted" | "visit-scheduled" | "health-score-drop" | "general";
  title: string;
  message: string;
  link?: string;
  customerId?: string;
}) {
  await db.insert(notifications).values(data);
}
