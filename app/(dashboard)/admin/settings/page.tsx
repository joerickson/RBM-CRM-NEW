export const dynamic = "force-dynamic";

import { Header } from "@/components/layout/header";
import { getAllSettingsData } from "@/server/queries/settings";
import { SettingsClient } from "@/components/admin/settings-client";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const { userId } = await auth();

  if (userId) {
    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.clerkId, userId),
    });
    if (profile?.role !== "admin") {
      redirect("/");
    }
  }

  const settingsData = await getAllSettingsData();

  return (
    <div className="flex flex-col h-full">
      <Header title="Admin Settings" />
      <SettingsClient {...settingsData} />
    </div>
  );
}
