import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Brand, SalesStage } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number | string | null): string {
  if (value === null || value === undefined) return "$0";
  const num = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

export function formatDate(date: string | Date | null): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

export function formatRelativeTime(date: string | Date): string {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return formatDate(date);
}

export const BRAND_LABELS: Record<Brand, string> = {
  "rbm-services": "RBM Services",
  "double-take": "Double Take",
  "five-star": "Five Star",
};

export const BRAND_COLORS: Record<Brand, string> = {
  "rbm-services": "bg-blue-100 text-blue-800 border-blue-200",
  "double-take": "bg-green-100 text-green-800 border-green-200",
  "five-star": "bg-yellow-100 text-yellow-800 border-yellow-200",
};

export const STAGE_LABELS: Record<SalesStage, string> = {
  "new-lead": "New Lead",
  contacted: "Contacted",
  qualified: "Qualified",
  "proposal-sent": "Proposal Sent",
  negotiating: "Negotiating",
  "closed-won": "Closed Won",
  "closed-lost": "Closed Lost",
};

export const STATUS_LABELS: Record<string, string> = {
  lead: "Lead",
  prospect: "Prospect",
  active: "Active",
  "at-risk": "At Risk",
  churned: "Churned",
};

export const STATUS_COLORS: Record<string, string> = {
  lead: "bg-slate-100 text-slate-700",
  prospect: "bg-blue-100 text-blue-700",
  active: "bg-green-100 text-green-700",
  "at-risk": "bg-red-100 text-red-700",
  churned: "bg-gray-100 text-gray-500",
};

export function getRiskColor(score: number | null): string {
  if (score === null) return "text-gray-400";
  if (score >= 70) return "text-red-600";
  if (score >= 40) return "text-amber-500";
  return "text-green-600";
}

export function getHealthColor(score: number | null): string {
  if (score === null) return "text-gray-400";
  if (score >= 70) return "text-green-600";
  if (score >= 40) return "text-amber-500";
  return "text-red-600";
}

export function applyMergeFields(
  template: string,
  fields: Record<string, string>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => fields[key] ?? `{{${key}}}`);
}

export function getScoreBg(score: number | null, type: "health" | "risk"): string {
  if (score === null) return "bg-gray-100";
  if (type === "health") {
    if (score >= 70) return "bg-green-100";
    if (score >= 40) return "bg-amber-100";
    return "bg-red-100";
  } else {
    if (score >= 70) return "bg-red-100";
    if (score >= 40) return "bg-amber-100";
    return "bg-green-100";
  }
}
