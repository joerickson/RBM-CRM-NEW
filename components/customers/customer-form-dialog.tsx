"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { customerSchema, CustomerInput } from "@/lib/validations";
import { createCustomer, updateCustomer } from "@/server/actions/customers";
import { Customer } from "@/types";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";

interface LookupItem {
  id: string;
  name: string;
}

interface UserOption {
  clerkId: string | null;
  fullName: string | null;
}

interface CustomerFormDialogProps {
  open: boolean;
  onClose: () => void;
  customer?: Customer;
  customerStatuses?: LookupItem[];
  industries?: LookupItem[];
  visitFrequencies?: LookupItem[];
  salesReps?: UserOption[];
  opsManagers?: UserOption[];
}

const OPS_VISIBLE_STATUSES = ["active", "won", "at-risk"];

export function CustomerFormDialog({
  open,
  onClose,
  customer,
  customerStatuses = [],
  industries = [],
  visitFrequencies = [],
  salesReps = [],
  opsManagers = [],
}: CustomerFormDialogProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm<CustomerInput>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      brand: customer?.brand ?? "rbm-services",
      companyName: customer?.companyName ?? "",
      status: customer?.status ?? "lead",
      stage: customer?.stage ?? null,
      industry: customer?.industry ?? "",
      address: customer?.address ?? "",
      city: customer?.city ?? "",
      state: customer?.state ?? "",
      zip: customer?.zip ?? "",
      primaryContactName: customer?.primaryContactName ?? "",
      primaryContactEmail: customer?.primaryContactEmail ?? "",
      primaryContactPhone: customer?.primaryContactPhone ?? "",
      monthlyValue: customer?.monthlyValue ? Number(customer.monthlyValue) : null,
      notes: customer?.notes ?? "",
      visitFrequency: (customer as any)?.visitFrequency ?? "",
      riskThresholdDays: (customer as any)?.riskThresholdDays ?? 90,
      assignedSalesRepClerkId: (customer as any)?.assignedSalesRepClerkId ?? null,
      assignedOperationsManagerClerkId: (customer as any)?.assignedOperationsManagerClerkId ?? null,
    },
  });

  const currentStatus = form.watch("status");
  const showOpsManager = OPS_VISIBLE_STATUSES.includes(currentStatus?.toLowerCase() ?? "");

  async function onSubmit(data: CustomerInput) {
    setLoading(true);
    try {
      const result = customer
        ? await updateCustomer(customer.id, data)
        : await createCustomer(data);

      if (result.error) {
        toast({ title: "Error", description: result.error, variant: "destructive" });
      } else {
        toast({ title: customer ? "Customer updated" : "Customer created" });
        form.reset();
        onClose();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {customer ? "Edit Customer" : "Add New Customer"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Company Name *</Label>
              <Input {...form.register("companyName")} placeholder="Acme Corp" />
              {form.formState.errors.companyName && (
                <p className="text-xs text-destructive mt-1">
                  {form.formState.errors.companyName.message}
                </p>
              )}
            </div>

            <div>
              <Label>Brand</Label>
              <Select
                value={form.watch("brand")}
                onValueChange={(v) => form.setValue("brand", v as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rbm-services">RBM Services</SelectItem>
                  <SelectItem value="double-take">Double Take</SelectItem>
                  <SelectItem value="five-star">Five Star</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Status</Label>
              <Select
                value={form.watch("status")}
                onValueChange={(v) => form.setValue("status", v as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {customerStatuses.length > 0 ? (
                    customerStatuses.map((s) => (
                      <SelectItem key={s.id} value={s.name}>
                        {s.name}
                      </SelectItem>
                    ))
                  ) : (
                    <>
                      <SelectItem value="lead">Lead</SelectItem>
                      <SelectItem value="prospect">Prospect</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="at-risk">At Risk</SelectItem>
                      <SelectItem value="churned">Churned</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Sales Stage</Label>
              <Select
                value={form.watch("stage") || "none"}
                onValueChange={(v) => form.setValue("stage", v === "none" ? null : v as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select stage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="new-lead">New Lead</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="qualified">Qualified</SelectItem>
                  <SelectItem value="proposal-sent">Proposal Sent</SelectItem>
                  <SelectItem value="negotiating">Negotiating</SelectItem>
                  <SelectItem value="closed-won">Closed Won</SelectItem>
                  <SelectItem value="closed-lost">Closed Lost</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Industry</Label>
              {industries.length > 0 ? (
                <Select
                  value={form.watch("industry") || "none"}
                  onValueChange={(v) => form.setValue("industry" as any, v === "none" ? null : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not set</SelectItem>
                    {industries.map((ind) => (
                      <SelectItem key={ind.id} value={ind.name}>
                        {ind.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input {...form.register("industry")} placeholder="Healthcare, Office, etc." />
              )}
            </div>

            <div>
              <Label>Monthly Value ($)</Label>
              <Input
                type="number"
                {...form.register("monthlyValue")}
                placeholder="2500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Address</Label>
              <Input {...form.register("address")} placeholder="123 Main St" />
            </div>
            <div>
              <Label>City</Label>
              <Input {...form.register("city")} />
            </div>
            <div>
              <Label>State</Label>
              <Input {...form.register("state")} placeholder="CA" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Contact Name</Label>
              <Input {...form.register("primaryContactName")} />
            </div>
            <div>
              <Label>Contact Email</Label>
              <Input {...form.register("primaryContactEmail")} type="email" />
            </div>
            <div>
              <Label>Contact Phone</Label>
              <Input {...form.register("primaryContactPhone")} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Visit Frequency</Label>
              <Select
                value={form.watch("visitFrequency") || "none"}
                onValueChange={(v) => form.setValue("visitFrequency" as any, v === "none" ? null : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Not set</SelectItem>
                  {visitFrequencies.length > 0 ? (
                    visitFrequencies.map((vf) => (
                      <SelectItem key={vf.id} value={vf.name}>
                        {vf.name}
                      </SelectItem>
                    ))
                  ) : (
                    <>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="bi-weekly">Bi-weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="bi-annual">Bi-annual</SelectItem>
                      <SelectItem value="annual">Annual</SelectItem>
                      <SelectItem value="as-needed">As needed</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>At-Risk Threshold (days)</Label>
              <Input
                type="number"
                min={1}
                max={365}
                {...form.register("riskThresholdDays" as any)}
                placeholder="90"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Assigned Sales Rep</Label>
              <Select
                value={form.watch("assignedSalesRepClerkId" as any) || "none"}
                onValueChange={(v) =>
                  form.setValue("assignedSalesRepClerkId" as any, v === "none" ? null : v)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select sales rep" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Not assigned</SelectItem>
                  {salesReps.map((u) =>
                    u.clerkId ? (
                      <SelectItem key={u.clerkId} value={u.clerkId}>
                        {u.fullName ?? u.clerkId}
                      </SelectItem>
                    ) : null
                  )}
                </SelectContent>
              </Select>
            </div>

            {showOpsManager && (
              <div>
                <Label>Assigned Operations Manager</Label>
                <Select
                  value={form.watch("assignedOperationsManagerClerkId" as any) || "none"}
                  onValueChange={(v) =>
                    form.setValue("assignedOperationsManagerClerkId" as any, v === "none" ? null : v)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select ops manager" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not assigned</SelectItem>
                    {opsManagers.map((u) =>
                      u.clerkId ? (
                        <SelectItem key={u.clerkId} value={u.clerkId}>
                          {u.fullName ?? u.clerkId}
                        </SelectItem>
                      ) : null
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea {...form.register("notes")} rows={3} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : customer ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
