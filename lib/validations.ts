import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const customerSchema = z.object({
  brand: z.enum(["rbm-services", "double-take", "five-star"]),
  companyName: z.string().min(1, "Company name is required"),
  status: z.enum(["lead", "prospect", "active", "at-risk", "churned"]),
  stage: z
    .enum([
      "new-lead",
      "contacted",
      "qualified",
      "proposal-sent",
      "negotiating",
      "closed-won",
      "closed-lost",
    ])
    .optional()
    .nullable(),
  industry: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  zip: z.string().optional().nullable(),
  primaryContactName: z.string().optional().nullable(),
  primaryContactEmail: z.string().email().optional().nullable().or(z.literal("")),
  primaryContactPhone: z.string().optional().nullable(),
  assignedRepId: z.string().uuid().optional().nullable(),
  monthlyValue: z.coerce.number().optional().nullable(),
  contractStartDate: z.string().optional().nullable(),
  contractEndDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const taskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional().nullable(),
  status: z.enum(["todo", "in-progress", "done", "cancelled"]),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  assignedToId: z.string().uuid().optional().nullable(),
  customerId: z.string().uuid().optional().nullable(),
  dueDate: z.string().optional().nullable(),
});

export const interactionSchema = z.object({
  customerId: z.string().uuid("Customer is required"),
  type: z.enum(["call", "email", "meeting", "demo", "proposal", "follow-up", "other"]),
  subject: z.string().min(1, "Subject is required"),
  notes: z.string().optional().nullable(),
  outcome: z.string().optional().nullable(),
  nextFollowUpDate: z.string().optional().nullable(),
  interactionDate: z.string(),
});

export const customerRequestSchema = z.object({
  customerName: z.string().min(1, "Name is required"),
  customerEmail: z.string().email("Invalid email"),
  subject: z.string().min(1, "Subject is required"),
  description: z.string().min(10, "Please provide more detail (min 10 chars)"),
});

export const employeeSchema = z.object({
  fullName: z.string().min(1, "Name is required"),
  email: z.string().email().optional().nullable().or(z.literal("")),
  phone: z.string().optional().nullable(),
  role: z.string().min(1, "Role is required"),
  brand: z.enum(["rbm-services", "double-take", "five-star"]),
  status: z.enum(["active", "inactive"]),
  hireDate: z.string().optional().nullable(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type CustomerInput = z.infer<typeof customerSchema>;
export type TaskInput = z.infer<typeof taskSchema>;
export type InteractionInput = z.infer<typeof interactionSchema>;
export type CustomerRequestInput = z.infer<typeof customerRequestSchema>;
export type EmployeeInput = z.infer<typeof employeeSchema>;
