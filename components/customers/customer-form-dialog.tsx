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

interface CustomerFormDialogProps {
  open: boolean;
  onClose: () => void;
  customer?: Customer;
}

export function CustomerFormDialog({
  open,
  onClose,
  customer,
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
    },
  });

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
                  <SelectItem value="lead">Lead</SelectItem>
                  <SelectItem value="prospect">Prospect</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="at-risk">At Risk</SelectItem>
                  <SelectItem value="churned">Churned</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Sales Stage</Label>
              <Select
                value={form.watch("stage") ?? ""}
                onValueChange={(v) => form.setValue("stage", v as any || null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select stage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
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
              <Input {...form.register("industry")} placeholder="Healthcare, Office, etc." />
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
