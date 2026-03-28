import { Header } from "@/components/layout/header";
import { db } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { TasksClient } from "@/components/tasks/tasks-client";
import { createClient } from "@/lib/supabase/server";
import { profiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export default async function TasksPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [allTasks, profile] = await Promise.all([
    db.query.tasks.findMany({
      with: { assignedTo: true, customer: true, createdBy: true },
      orderBy: [desc(tasks.createdAt)],
    }),
    user ? db.query.profiles.findFirst({ where: eq(profiles.id, user.id) }) : null,
  ]);

  return (
    <div className="flex flex-col h-full">
      <Header title="Tasks" />
      <TasksClient initialTasks={allTasks as any} currentUserId={user?.id ?? ""} />
    </div>
  );
}
