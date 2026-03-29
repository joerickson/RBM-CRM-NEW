"use server";

import { db } from "@/lib/db";
import { emailTemplates, profiles } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";

export async function getAllEmailTemplates() {
  return db.query.emailTemplates.findMany({
    with: { createdBy: true },
    orderBy: [desc(emailTemplates.updatedAt)],
  });
}

export async function createEmailTemplate(data: {
  name: string;
  subject: string;
  body: string;
  category: string;
}) {
  const { userId } = await auth();
  let profileId: string | undefined;
  if (userId) {
    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.clerkId, userId),
    });
    profileId = profile?.id;
  }

  await db.insert(emailTemplates).values({
    name: data.name,
    subject: data.subject,
    body: data.body,
    category: data.category,
    createdById: profileId,
  });

  revalidatePath("/email-templates");
}

export async function updateEmailTemplate(
  id: string,
  data: {
    name: string;
    subject: string;
    body: string;
    category: string;
  }
) {
  await db
    .update(emailTemplates)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(emailTemplates.id, id));

  revalidatePath("/email-templates");
}

export async function deleteEmailTemplate(id: string) {
  await db.delete(emailTemplates).where(eq(emailTemplates.id, id));
  revalidatePath("/email-templates");
}

