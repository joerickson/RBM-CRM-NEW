export type UserRole = "admin" | "sales" | "building-ops" | "customer";

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

export type TaskStatus = "todo" | "in-progress" | "done" | "cancelled";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

export type RequestStatus = "open" | "in-review" | "resolved" | "closed";

export type InteractionType =
  | "call"
  | "email"
  | "meeting"
  | "demo"
  | "proposal"
  | "follow-up"
  | "other";

export interface Profile {
  id: string;
  email: string;
  fullName: string | null;
  role: UserRole;
  phone: string | null;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  brand: Brand;
  companyName: string;
  status: CustomerStatus;
  stage: SalesStage | null;
  industry: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  primaryContactName: string | null;
  primaryContactEmail: string | null;
  primaryContactPhone: string | null;
  assignedRepId: string | null;
  assignedRep?: Profile;
  monthlyValue: number | null;
  contractStartDate: string | null;
  contractEndDate: string | null;
  aiHealthScore: number | null;
  aiRiskScore: number | null;
  aiLeadScore: number | null;
  aiNotes: string | null;
  lastScoreAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  sites?: CustomerSite[];
  interactions?: CustomerInteraction[];
  visits?: Visit[];
  requests?: CustomerRequest[];
}

export interface CustomerSite {
  id: string;
  customerId: string;
  siteName: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  sqft: number | null;
  visitFrequency: string | null;
  notes: string | null;
  createdAt: string;
}

export interface Visit {
  id: string;
  customerId: string;
  siteId: string | null;
  employeeId: string | null;
  employee?: Employee;
  visitDate: string;
  visitType: string;
  status: "scheduled" | "completed" | "missed" | "cancelled";
  notes: string | null;
  customerRating: number | null;
  createdAt: string;
}

export interface Employee {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  role: string;
  brand: Brand;
  status: "active" | "inactive";
  hireDate: string | null;
  profileId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerInteraction {
  id: string;
  customerId: string;
  repId: string;
  rep?: Profile;
  type: InteractionType;
  subject: string;
  notes: string | null;
  outcome: string | null;
  nextFollowUpDate: string | null;
  interactionDate: string;
  createdAt: string;
}

export interface CustomerRequest {
  id: string;
  customerId: string | null;
  customerEmail: string;
  customerName: string;
  subject: string;
  description: string;
  status: RequestStatus;
  priority: TaskPriority;
  assignedToId: string | null;
  assignedTo?: Profile;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assignedToId: string | null;
  assignedTo?: Profile;
  createdById: string;
  createdBy?: Profile;
  customerId: string | null;
  customer?: Pick<Customer, "id" | "companyName" | "brand">;
  dueDate: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  totalCustomers: number;
  activeCustomers: number;
  totalLeads: number;
  atRiskCustomers: number;
  monthlyRevenue: number;
  openTasks: number;
  scheduledVisitsToday: number;
  openRequests: number;
}

export interface AIActionPlan {
  date: string;
  summary: string;
  priorities: {
    customerId: string;
    customerName: string;
    action: string;
    reason: string;
    urgency: "low" | "medium" | "high";
  }[];
  insights: string[];
}

export interface KanbanColumn {
  id: SalesStage;
  label: string;
  customers: Customer[];
}
