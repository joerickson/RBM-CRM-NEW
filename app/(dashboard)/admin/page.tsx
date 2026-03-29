export const dynamic = "force-dynamic";

import { Header } from "@/components/layout/header";
import { db } from "@/lib/db";
import { customerRequests, profiles } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { AdminClient } from "@/components/admin/admin-client";

export default async function AdminPage() {
  const [requests, allProfiles] = await Promise.all([
    db.query.customerRequests.findMany({
      with: { assignedTo: true, customer: true },
      orderBy: [desc(customerRequests.createdAt)],
    }),
    db.query.profiles.findMany({
      orderBy: [desc(profiles.createdAt)],
    }),
  ]);

  return (
    <div className="flex flex-col h-full">
      <Header title="Admin" />
      <AdminClient requests={requests as any} allProfiles={allProfiles as any} />
    </div>
  );
}
