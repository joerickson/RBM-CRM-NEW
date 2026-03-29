"use server";

import { db } from "@/lib/db";
import {
  companies,
  customerStatuses,
  industries,
  visitFrequencies,
  interactionTypes,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// ─── Generic helpers ──────────────────────────────────────────────────────────

function revalidateSettings() {
  revalidatePath("/admin/settings");
}

// ─── Companies ────────────────────────────────────────────────────────────────

export async function createCompany(name: string) {
  if (!name.trim()) return { error: "Name is required" };
  try {
    const [row] = await db
      .insert(companies)
      .values({ name: name.trim() })
      .returning();
    revalidateSettings();
    revalidatePath("/events");
    return { data: row };
  } catch (err: any) {
    if (err.message?.includes("unique")) return { error: "Name already exists" };
    return { error: "Failed to create" };
  }
}

export async function updateCompany(id: string, name: string) {
  if (!name.trim()) return { error: "Name is required" };
  try {
    const [row] = await db
      .update(companies)
      .set({ name: name.trim() })
      .where(eq(companies.id, id))
      .returning();
    revalidateSettings();
    revalidatePath("/events");
    return { data: row };
  } catch (err: any) {
    if (err.message?.includes("unique")) return { error: "Name already exists" };
    return { error: "Failed to update" };
  }
}

export async function deleteCompany(id: string) {
  try {
    await db.delete(companies).where(eq(companies.id, id));
    revalidateSettings();
    revalidatePath("/events");
    return { success: true };
  } catch {
    return { error: "Failed to delete" };
  }
}

// ─── Customer Statuses ────────────────────────────────────────────────────────

export async function createCustomerStatus(name: string) {
  if (!name.trim()) return { error: "Name is required" };
  try {
    const [row] = await db
      .insert(customerStatuses)
      .values({ name: name.trim() })
      .returning();
    revalidateSettings();
    revalidatePath("/customers");
    return { data: row };
  } catch (err: any) {
    if (err.message?.includes("unique")) return { error: "Name already exists" };
    return { error: "Failed to create" };
  }
}

export async function updateCustomerStatus(id: string, name: string) {
  if (!name.trim()) return { error: "Name is required" };
  try {
    const [row] = await db
      .update(customerStatuses)
      .set({ name: name.trim() })
      .where(eq(customerStatuses.id, id))
      .returning();
    revalidateSettings();
    revalidatePath("/customers");
    return { data: row };
  } catch (err: any) {
    if (err.message?.includes("unique")) return { error: "Name already exists" };
    return { error: "Failed to update" };
  }
}

export async function deleteCustomerStatus(id: string) {
  try {
    await db.delete(customerStatuses).where(eq(customerStatuses.id, id));
    revalidateSettings();
    revalidatePath("/customers");
    return { success: true };
  } catch {
    return { error: "Failed to delete" };
  }
}

// ─── Industries ───────────────────────────────────────────────────────────────

export async function createIndustry(name: string) {
  if (!name.trim()) return { error: "Name is required" };
  try {
    const [row] = await db
      .insert(industries)
      .values({ name: name.trim() })
      .returning();
    revalidateSettings();
    revalidatePath("/customers");
    return { data: row };
  } catch (err: any) {
    if (err.message?.includes("unique")) return { error: "Name already exists" };
    return { error: "Failed to create" };
  }
}

export async function updateIndustry(id: string, name: string) {
  if (!name.trim()) return { error: "Name is required" };
  try {
    const [row] = await db
      .update(industries)
      .set({ name: name.trim() })
      .where(eq(industries.id, id))
      .returning();
    revalidateSettings();
    revalidatePath("/customers");
    return { data: row };
  } catch (err: any) {
    if (err.message?.includes("unique")) return { error: "Name already exists" };
    return { error: "Failed to update" };
  }
}

export async function deleteIndustry(id: string) {
  try {
    await db.delete(industries).where(eq(industries.id, id));
    revalidateSettings();
    revalidatePath("/customers");
    return { success: true };
  } catch {
    return { error: "Failed to delete" };
  }
}

// ─── Visit Frequencies ────────────────────────────────────────────────────────

export async function createVisitFrequency(name: string) {
  if (!name.trim()) return { error: "Name is required" };
  try {
    const [row] = await db
      .insert(visitFrequencies)
      .values({ name: name.trim() })
      .returning();
    revalidateSettings();
    revalidatePath("/customers");
    return { data: row };
  } catch (err: any) {
    if (err.message?.includes("unique")) return { error: "Name already exists" };
    return { error: "Failed to create" };
  }
}

export async function updateVisitFrequency(id: string, name: string) {
  if (!name.trim()) return { error: "Name is required" };
  try {
    const [row] = await db
      .update(visitFrequencies)
      .set({ name: name.trim() })
      .where(eq(visitFrequencies.id, id))
      .returning();
    revalidateSettings();
    revalidatePath("/customers");
    return { data: row };
  } catch (err: any) {
    if (err.message?.includes("unique")) return { error: "Name already exists" };
    return { error: "Failed to update" };
  }
}

export async function deleteVisitFrequency(id: string) {
  try {
    await db.delete(visitFrequencies).where(eq(visitFrequencies.id, id));
    revalidateSettings();
    revalidatePath("/customers");
    return { success: true };
  } catch {
    return { error: "Failed to delete" };
  }
}

// ─── Interaction Types ────────────────────────────────────────────────────────

export async function createInteractionType(name: string) {
  if (!name.trim()) return { error: "Name is required" };
  try {
    const [row] = await db
      .insert(interactionTypes)
      .values({ name: name.trim() })
      .returning();
    revalidateSettings();
    return { data: row };
  } catch (err: any) {
    if (err.message?.includes("unique")) return { error: "Name already exists" };
    return { error: "Failed to create" };
  }
}

export async function updateInteractionType(id: string, name: string) {
  if (!name.trim()) return { error: "Name is required" };
  try {
    const [row] = await db
      .update(interactionTypes)
      .set({ name: name.trim() })
      .where(eq(interactionTypes.id, id))
      .returning();
    revalidateSettings();
    return { data: row };
  } catch (err: any) {
    if (err.message?.includes("unique")) return { error: "Name already exists" };
    return { error: "Failed to update" };
  }
}

export async function deleteInteractionType(id: string) {
  try {
    await db.delete(interactionTypes).where(eq(interactionTypes.id, id));
    revalidateSettings();
    return { success: true };
  } catch {
    return { error: "Failed to delete" };
  }
}
