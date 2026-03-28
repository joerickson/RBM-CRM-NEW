"use server";

import { db } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { taskSchema } from "@/lib/validations";
import { z } from "zod";

export async function createTask(
  data: z.infer<typeof taskSchema>,
  createdById: string
) {
  const validated = taskSchema.safeParse(data);
  if (!validated.success) {
    return { error: "Invalid data" };
  }

  try {
    const [task] = await db
      .insert(tasks)
      .values({
        ...validated.data,
        createdById,
        dueDate: validated.data.dueDate ? new Date(validated.data.dueDate) : null,
      })
      .returning();

    revalidatePath("/tasks");
    return { data: task };
  } catch (err) {
    console.error(err);
    return { error: "Failed to create task" };
  }
}

export async function updateTask(
  id: string,
  data: Partial<z.infer<typeof taskSchema>>
) {
  try {
    const updateData: Record<string, any> = {
      ...data,
      updatedAt: new Date(),
    };

    if (data.dueDate) {
      updateData.dueDate = new Date(data.dueDate);
    }

    if (data.status === "done") {
      updateData.completedAt = new Date();
    }

    const [task] = await db
      .update(tasks)
      .set(updateData)
      .where(eq(tasks.id, id))
      .returning();

    revalidatePath("/tasks");
    return { data: task };
  } catch (err) {
    console.error(err);
    return { error: "Failed to update task" };
  }
}

export async function deleteTask(id: string) {
  try {
    await db.delete(tasks).where(eq(tasks.id, id));
    revalidatePath("/tasks");
    return { success: true };
  } catch (err) {
    console.error(err);
    return { error: "Failed to delete task" };
  }
}
