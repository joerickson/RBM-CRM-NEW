"use server";

import { db } from "@/lib/db";
import { employees } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { employeeSchema } from "@/lib/validations";
import { z } from "zod";

export async function createEmployee(data: z.infer<typeof employeeSchema>) {
  const validated = employeeSchema.safeParse(data);
  if (!validated.success) {
    return { error: "Invalid data" };
  }

  try {
    const [employee] = await db
      .insert(employees)
      .values({
        ...validated.data,
        hireDate: validated.data.hireDate || null,
      })
      .returning();

    revalidatePath("/employees");
    return { data: employee };
  } catch (err) {
    console.error(err);
    return { error: "Failed to create employee" };
  }
}

export async function updateEmployee(
  id: string,
  data: Partial<z.infer<typeof employeeSchema>>
) {
  try {
    const [employee] = await db
      .update(employees)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(employees.id, id))
      .returning();

    revalidatePath("/employees");
    return { data: employee };
  } catch (err) {
    console.error(err);
    return { error: "Failed to update employee" };
  }
}

export async function deleteEmployee(id: string) {
  try {
    await db.delete(employees).where(eq(employees.id, id));
    revalidatePath("/employees");
    return { success: true };
  } catch (err) {
    console.error(err);
    return { error: "Failed to delete employee" };
  }
}
