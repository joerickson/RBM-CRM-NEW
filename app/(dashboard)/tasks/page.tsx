export const dynamic = "force-dynamic";

import { Header } from "@/components/layout/header";
import { TasksClient } from "@/components/tasks/tasks-client";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { getTasksByRole } from "@/server/queries/tasks-by-role";
import { syncClerkUserToSupabase } from "@/lib/auth/sync-user";

export default async function TasksPage() {
  // Ensure profile exists and is in sync
  await syncClerkUserToSupabase();

  const profile = await getCurrentProfile();

  const role = (profile?.role ?? "sales_rep") as any;
  const clerkId = profile?.clerkId ?? "";

  const allTasks = await getTasksByRole(role, clerkId);

  return (
    <div className="flex flex-col h-full">
      <Header title="Tasks" />
      <TasksClient
        initialTasks={allTasks as any}
        currentUserId={profile?.id ?? ""}
      />
    </div>
  );
}
