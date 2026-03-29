import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  decimal,
  boolean,
  pgEnum,
  date,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ─── Enums ───────────────────────────────────────────────────────────────────

export const userRoleEnum = pgEnum("user_role", [
  "admin",
  "sales",
  "building-ops",
  "customer",
]);

export const brandEnum = pgEnum("brand", [
  "rbm-services",
  "double-take",
  "five-star",
]);

export const customerStatusEnum = pgEnum("customer_status", [
  "lead",
  "prospect",
  "active",
  "at-risk",
  "churned",
]);

export const salesStageEnum = pgEnum("sales_stage", [
  "new-lead",
  "contacted",
  "qualified",
  "proposal-sent",
  "negotiating",
  "closed-won",
  "closed-lost",
]);

export const taskStatusEnum = pgEnum("task_status", [
  "todo",
  "in-progress",
  "done",
  "cancelled",
]);

export const taskPriorityEnum = pgEnum("task_priority", [
  "low",
  "medium",
  "high",
  "urgent",
]);

export const requestStatusEnum = pgEnum("request_status", [
  "open",
  "in-review",
  "resolved",
  "closed",
]);

export const interactionTypeEnum = pgEnum("interaction_type", [
  "call",
  "email",
  "meeting",
  "demo",
  "proposal",
  "follow-up",
  "other",
]);

export const visitStatusEnum = pgEnum("visit_status", [
  "scheduled",
  "completed",
  "missed",
  "cancelled",
]);

export const employeeStatusEnum = pgEnum("employee_status", [
  "active",
  "inactive",
]);

// ─── Tables ──────────────────────────────────────────────────────────────────

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  clerkId: text("clerk_id").unique(),
  email: text("email").notNull().unique(),
  fullName: text("full_name"),
  role: userRoleEnum("role").notNull().default("sales"),
  permissions: text("permissions").array(),
  status: text("status").notNull().default("active"),
  phone: text("phone"),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const customers = pgTable(
  "customers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    brand: brandEnum("brand").notNull().default("rbm-services"),
    companyName: text("company_name").notNull(),
    status: customerStatusEnum("status").notNull().default("lead"),
    stage: salesStageEnum("stage"),
    industry: text("industry"),
    address: text("address"),
    city: text("city"),
    state: text("state"),
    zip: text("zip"),
    primaryContactName: text("primary_contact_name"),
    primaryContactEmail: text("primary_contact_email"),
    primaryContactPhone: text("primary_contact_phone"),
    assignedRepId: uuid("assigned_rep_id").references(() => profiles.id, {
      onDelete: "set null",
    }),
    monthlyValue: decimal("monthly_value", { precision: 10, scale: 2 }),
    contractStartDate: date("contract_start_date"),
    contractEndDate: date("contract_end_date"),
    aiHealthScore: integer("ai_health_score"),
    aiRiskScore: integer("ai_risk_score"),
    aiLeadScore: integer("ai_lead_score"),
    aiNotes: text("ai_notes"),
    lastScoreAt: timestamp("last_score_at", { withTimezone: true }),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    statusIdx: index("customers_status_idx").on(table.status),
    stageIdx: index("customers_stage_idx").on(table.stage),
    brandIdx: index("customers_brand_idx").on(table.brand),
    assignedRepIdx: index("customers_assigned_rep_idx").on(table.assignedRepId),
  })
);

export const customerSites = pgTable("customer_sites", {
  id: uuid("id").primaryKey().defaultRandom(),
  customerId: uuid("customer_id")
    .notNull()
    .references(() => customers.id, { onDelete: "cascade" }),
  siteName: text("site_name").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zip: text("zip").notNull(),
  sqft: integer("sqft"),
  visitFrequency: text("visit_frequency"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const employees = pgTable("employees", {
  id: uuid("id").primaryKey().defaultRandom(),
  fullName: text("full_name").notNull(),
  email: text("email"),
  phone: text("phone"),
  role: text("role").notNull(),
  brand: brandEnum("brand").notNull().default("rbm-services"),
  status: employeeStatusEnum("status").notNull().default("active"),
  hireDate: date("hire_date"),
  profileId: uuid("profile_id").references(() => profiles.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const visits = pgTable(
  "visits",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    siteId: uuid("site_id").references(() => customerSites.id, {
      onDelete: "set null",
    }),
    employeeId: uuid("employee_id").references(() => employees.id, {
      onDelete: "set null",
    }),
    visitDate: timestamp("visit_date", { withTimezone: true }).notNull(),
    visitType: text("visit_type").notNull().default("routine"),
    status: visitStatusEnum("status").notNull().default("scheduled"),
    notes: text("notes"),
    customerRating: integer("customer_rating"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    customerIdx: index("visits_customer_idx").on(table.customerId),
    visitDateIdx: index("visits_date_idx").on(table.visitDate),
  })
);

export const customerInteractions = pgTable(
  "customer_interactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    repId: uuid("rep_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    type: interactionTypeEnum("type").notNull(),
    subject: text("subject").notNull(),
    notes: text("notes"),
    outcome: text("outcome"),
    nextFollowUpDate: date("next_follow_up_date"),
    interactionDate: timestamp("interaction_date", { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    customerIdx: index("interactions_customer_idx").on(table.customerId),
    repIdx: index("interactions_rep_idx").on(table.repId),
  })
);

export const customerRequests = pgTable(
  "customer_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    customerId: uuid("customer_id").references(() => customers.id, {
      onDelete: "set null",
    }),
    customerEmail: text("customer_email").notNull(),
    customerName: text("customer_name").notNull(),
    subject: text("subject").notNull(),
    description: text("description").notNull(),
    status: requestStatusEnum("status").notNull().default("open"),
    priority: taskPriorityEnum("priority").notNull().default("medium"),
    assignedToId: uuid("assigned_to_id").references(() => profiles.id, {
      onDelete: "set null",
    }),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    statusIdx: index("requests_status_idx").on(table.status),
  })
);

export const tasks = pgTable(
  "tasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    description: text("description"),
    status: taskStatusEnum("status").notNull().default("todo"),
    priority: taskPriorityEnum("priority").notNull().default("medium"),
    assignedToId: uuid("assigned_to_id").references(() => profiles.id, {
      onDelete: "set null",
    }),
    createdById: uuid("created_by_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    customerId: uuid("customer_id").references(() => customers.id, {
      onDelete: "set null",
    }),
    dueDate: timestamp("due_date", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    statusIdx: index("tasks_status_idx").on(table.status),
    assignedToIdx: index("tasks_assigned_idx").on(table.assignedToId),
  })
);

// ─── Relations ───────────────────────────────────────────────────────────────

export const profilesRelations = relations(profiles, ({ many }) => ({
  assignedCustomers: many(customers),
  interactions: many(customerInteractions),
  tasks: many(tasks),
  createdTasks: many(tasks),
}));

export const customersRelations = relations(customers, ({ one, many }) => ({
  assignedRep: one(profiles, {
    fields: [customers.assignedRepId],
    references: [profiles.id],
  }),
  sites: many(customerSites),
  visits: many(visits),
  interactions: many(customerInteractions),
  requests: many(customerRequests),
  tasks: many(tasks),
}));

export const customerSitesRelations = relations(
  customerSites,
  ({ one, many }) => ({
    customer: one(customers, {
      fields: [customerSites.customerId],
      references: [customers.id],
    }),
    visits: many(visits),
  })
);

export const visitsRelations = relations(visits, ({ one }) => ({
  customer: one(customers, {
    fields: [visits.customerId],
    references: [customers.id],
  }),
  site: one(customerSites, {
    fields: [visits.siteId],
    references: [customerSites.id],
  }),
  employee: one(employees, {
    fields: [visits.employeeId],
    references: [employees.id],
  }),
}));

export const customerInteractionsRelations = relations(
  customerInteractions,
  ({ one }) => ({
    customer: one(customers, {
      fields: [customerInteractions.customerId],
      references: [customers.id],
    }),
    rep: one(profiles, {
      fields: [customerInteractions.repId],
      references: [profiles.id],
    }),
  })
);

export const customerRequestsRelations = relations(
  customerRequests,
  ({ one }) => ({
    customer: one(customers, {
      fields: [customerRequests.customerId],
      references: [customers.id],
    }),
    assignedTo: one(profiles, {
      fields: [customerRequests.assignedToId],
      references: [profiles.id],
    }),
  })
);

export const tasksRelations = relations(tasks, ({ one }) => ({
  assignedTo: one(profiles, {
    fields: [tasks.assignedToId],
    references: [profiles.id],
  }),
  createdBy: one(profiles, {
    fields: [tasks.createdById],
    references: [profiles.id],
  }),
  customer: one(customers, {
    fields: [tasks.customerId],
    references: [customers.id],
  }),
}));

export const employeesRelations = relations(employees, ({ one, many }) => ({
  profile: one(profiles, {
    fields: [employees.profileId],
    references: [profiles.id],
  }),
  visits: many(visits),
}));
