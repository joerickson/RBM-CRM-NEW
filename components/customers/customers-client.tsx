"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, Filter } from "lucide-react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Customer } from "@/types";
import {
  BRAND_LABELS,
  BRAND_COLORS,
  STATUS_LABELS,
  STATUS_COLORS,
  formatCurrency,
  getHealthColor,
  getRiskColor,
} from "@/lib/utils";
import { CustomerFormDialog } from "./customer-form-dialog";

interface CustomersClientProps {
  initialCustomers: Customer[];
}

export function CustomersClient({ initialCustomers }: CustomersClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [brandFilter, setBrandFilter] = useState<string>("all");
  const [showForm, setShowForm] = useState(false);

  const filtered = initialCustomers.filter((c) => {
    const matchSearch =
      !search ||
      c.companyName.toLowerCase().includes(search.toLowerCase()) ||
      c.primaryContactName?.toLowerCase().includes(search.toLowerCase()) ||
      c.primaryContactEmail?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || c.status === statusFilter;
    const matchBrand = brandFilter === "all" || c.brand === brandFilter;
    return matchSearch && matchStatus && matchBrand;
  });

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 border-b bg-white px-6 py-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search customers..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="lead">Lead</SelectItem>
            <SelectItem value="prospect">Prospect</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="at-risk">At Risk</SelectItem>
            <SelectItem value="churned">Churned</SelectItem>
          </SelectContent>
        </Select>
        <Select value={brandFilter} onValueChange={setBrandFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Brand" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Brands</SelectItem>
            <SelectItem value="rbm-services">RBM Services</SelectItem>
            <SelectItem value="double-take">Double Take</SelectItem>
            <SelectItem value="five-star">Five Star</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Customer
        </Button>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto p-6">
        <div className="rounded-lg border bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Company</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Brand</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Contact</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Value/Mo</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Health</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Risk</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((customer, i) => (
                <motion.tr
                  key={customer.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => router.push(`/customers/${customer.id}`)}
                >
                  <td className="px-4 py-3">
                    <p className="font-medium">{customer.companyName}</p>
                    {customer.assignedRep && (
                      <p className="text-xs text-muted-foreground">
                        Rep: {customer.assignedRep.fullName}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs border ${BRAND_COLORS[customer.brand]}`}
                    >
                      {BRAND_LABELS[customer.brand]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[customer.status]}`}
                    >
                      {STATUS_LABELS[customer.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p>{customer.primaryContactName ?? "—"}</p>
                    <p className="text-xs text-muted-foreground">
                      {customer.primaryContactEmail ?? ""}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-right font-medium">
                    {customer.monthlyValue ? formatCurrency(customer.monthlyValue) : "—"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`font-bold ${getHealthColor(customer.aiHealthScore)}`}>
                      {customer.aiHealthScore ?? "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`font-bold ${getRiskColor(customer.aiRiskScore)}`}>
                      {customer.aiRiskScore ?? "—"}
                    </span>
                  </td>
                </motion.tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-12 text-center text-muted-foreground"
                  >
                    No customers found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <CustomerFormDialog
        open={showForm}
        onClose={() => {
          setShowForm(false);
          router.refresh();
        }}
      />
    </div>
  );
}
