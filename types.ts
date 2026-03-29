import type {
  customers,
  profiles,
  employees,
  tasks,
  customerRequests,
} from "@/lib/db/schema";

// ─── Primitive Union Types ────────────────────────────────────────────────────

export type Brand = "rbm-services" | "double-take" | "five-star";

export type CustomerStatus = "lead" | "prospect" | "active" | "at-risk" | "churned";

export type SalesStage =
  | "new-lead"
  | "contacted"
  | "qualified"
  | "proposal-sent"
  | "negotiating"
  | "closed-won"
  | "closed-lost";

// ─── Database Entity Types ────────────────────────────────────────────────────

export type Profile = typeof profiles.$inferSelect;

export type Customer = typeof customers.$inferSelect & {
  assignedRep?: Profile | null;
};

export type Employee = typeof employees.$inferSelect;

export type Task = typeof tasks.$inferSelect & {
  assignedTo?: Profile | null;
  customer?: Customer | null;
};

export type CustomerRequest = typeof customerRequests.$inferSelect;

// ─── Composite / UI Types ─────────────────────────────────────────────────────

export interface KanbanColumn {
  id: SalesStage;
  label: string;
  customers: Customer[];
}

export interface DashboardStats {
  totalCustomers: number;
  activeCustomers: number;
  totalLeads: number;
  atRiskCustomers: number;
  openTasks: number;
  scheduledVisitsToday: number;
  openRequests: number;
  monthlyRevenue: number;
}

export interface AIActionPlan {
  date: string;
  summary: string;
  priorities: {
    customerId: string;
    customerName: string;
    action: string;
    reason: string;
    urgency: "high" | "medium" | "low";
  }[];
  insights: string[];
}
