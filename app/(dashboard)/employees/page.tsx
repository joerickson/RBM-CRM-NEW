export const dynamic = "force-dynamic";

import { Header } from "@/components/layout/header";
import { db } from "@/lib/db";
import { employees } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { EmployeesClient } from "@/components/employees/employees-client";

export default async function EmployeesPage() {
  const allEmployees = await db.query.employees.findMany({
    orderBy: [desc(employees.createdAt)],
  });

  return (
    <div className="flex flex-col h-full">
      <Header title="Employees" />
      <EmployeesClient initialEmployees={allEmployees as any} />
    </div>
  );
}
