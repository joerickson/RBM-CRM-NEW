"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Edit, Trash2, Search } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Employee } from "@/types";
import { employeeSchema, EmployeeInput } from "@/lib/validations";
import { createEmployee, updateEmployee, deleteEmployee } from "@/server/actions/employees";
import { BRAND_LABELS, BRAND_COLORS, formatDate } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

interface EmployeesClientProps {
  initialEmployees: Employee[];
}

export function EmployeesClient({ initialEmployees }: EmployeesClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(false);

  const form = useForm<EmployeeInput>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      brand: "rbm-services",
      status: "active",
    },
  });

  const filtered = initialEmployees.filter(
    (e) =>
      !search ||
      e.fullName.toLowerCase().includes(search.toLowerCase()) ||
      e.role.toLowerCase().includes(search.toLowerCase())
  );

  const openEdit = (emp: Employee) => {
    setEditing(emp);
    form.reset({
      fullName: emp.fullName,
      email: emp.email ?? "",
      phone: emp.phone ?? "",
      role: emp.role,
      brand: emp.brand,
      status: emp.status,
      hireDate: emp.hireDate ?? "",
    });
    setShowForm(true);
  };

  const openCreate = () => {
    setEditing(null);
    form.reset({ brand: "rbm-services", status: "active" });
    setShowForm(true);
  };

  const onSubmit = async (data: EmployeeInput) => {
    setLoading(true);
    try {
      const result = editing
        ? await updateEmployee(editing.id, data)
        : await createEmployee(data);

      if (result.error) {
        toast({ title: "Error", description: result.error, variant: "destructive" });
      } else {
        toast({ title: editing ? "Employee updated" : "Employee added" });
        setShowForm(false);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this employee?")) return;
    const result = await deleteEmployee(id);
    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    } else {
      toast({ title: "Employee deleted" });
      router.refresh();
    }
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex items-center gap-3 border-b bg-white px-6 py-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search employees..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Add Employee
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="rounded-lg border bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Role</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Brand</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Contact</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Hire Date</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((emp, i) => (
                <motion.tr
                  key={emp.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => openEdit(emp)}
                >
                  <td className="px-4 py-3 font-medium">{emp.fullName}</td>
                  <td className="px-4 py-3 text-muted-foreground">{emp.role}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 text-xs rounded-full border ${BRAND_COLORS[emp.brand]}`}>
                      {BRAND_LABELS[emp.brand]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p>{emp.email ?? "—"}</p>
                    <p className="text-xs text-muted-foreground">{emp.phone ?? ""}</p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDate(emp.hireDate)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge
                      variant={emp.status === "active" ? "default" : "secondary"}
                    >
                      {emp.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1 justify-end">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={(e) => { e.stopPropagation(); openEdit(emp); }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={(e) => { e.stopPropagation(); handleDelete(emp.id); }}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </motion.tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                    No employees found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={showForm} onOpenChange={(o) => !o && setShowForm(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Employee" : "Add Employee"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Full Name *</Label>
                <Input {...form.register("fullName")} />
                {form.formState.errors.fullName && (
                  <p className="text-xs text-destructive mt-1">
                    {form.formState.errors.fullName.message}
                  </p>
                )}
              </div>
              <div>
                <Label>Role *</Label>
                <Input {...form.register("role")} placeholder="Crew Lead, Supervisor..." />
              </div>
              <div>
                <Label>Brand</Label>
                <Select
                  value={form.watch("brand")}
                  onValueChange={(v) => form.setValue("brand", v as any)}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rbm-services">RBM Services</SelectItem>
                    <SelectItem value="double-take">Double Take</SelectItem>
                    <SelectItem value="five-star">Five Star</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Email</Label>
                <Input {...form.register("email")} type="email" />
              </div>
              <div>
                <Label>Phone</Label>
                <Input {...form.register("phone")} />
              </div>
              <div>
                <Label>Hire Date</Label>
                <Input {...form.register("hireDate")} type="date" />
              </div>
              <div>
                <Label>Status</Label>
                <Select
                  value={form.watch("status")}
                  onValueChange={(v) => form.setValue("status", v as any)}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : editing ? "Update" : "Add"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
