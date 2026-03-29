"use client";

import { useMemo } from "react";
import {
  MessageSquare,
  Calendar,
  PartyPopper,
  Inbox,
  CheckSquare,
  Star,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

interface TimelineItem {
  id: string;
  type: "interaction" | "visit" | "event" | "request" | "task";
  date: string | Date;
  title: string;
  subtitle?: string;
  badge?: string;
  badgeColor?: string;
  meta?: string;
}

interface ActivityTimelineProps {
  interactions: any[];
  visits: any[];
  requests: any[];
  eventCustomers: any[];
  tasks?: any[];
}

function timelineDate(item: TimelineItem): number {
  return new Date(item.date).getTime();
}

const ICON_MAP = {
  interaction: MessageSquare,
  visit: Calendar,
  event: PartyPopper,
  request: Inbox,
  task: CheckSquare,
};

const TYPE_COLORS: Record<string, string> = {
  interaction: "bg-blue-50 border-blue-200",
  visit: "bg-green-50 border-green-200",
  event: "bg-purple-50 border-purple-200",
  request: "bg-orange-50 border-orange-200",
  task: "bg-gray-50 border-gray-200",
};

const ICON_COLORS: Record<string, string> = {
  interaction: "text-blue-500 bg-blue-100",
  visit: "text-green-600 bg-green-100",
  event: "text-purple-600 bg-purple-100",
  request: "text-orange-500 bg-orange-100",
  task: "text-gray-500 bg-gray-100",
};

export function ActivityTimeline({
  interactions,
  visits,
  requests,
  eventCustomers,
  tasks = [],
}: ActivityTimelineProps) {
  const items = useMemo<TimelineItem[]>(() => {
    const result: TimelineItem[] = [];

    for (const i of interactions) {
      result.push({
        id: `interaction-${i.id}`,
        type: "interaction",
        date: i.interactionDate,
        title: i.subject,
        subtitle: i.rep ? `By ${i.rep.fullName}` : undefined,
        badge: i.type,
        meta: i.outcome ?? i.notes,
      });
    }

    for (const v of visits) {
      result.push({
        id: `visit-${v.id}`,
        type: "visit",
        date: v.visitDate,
        title: `${v.visitType.replace(/-/g, " ")} visit`,
        subtitle: v.employee ? v.employee.fullName : undefined,
        badge: v.status,
        meta: v.customerRating
          ? `${"★".repeat(v.customerRating)}${"☆".repeat(5 - v.customerRating)}`
          : v.notes,
      });
    }

    for (const r of requests) {
      result.push({
        id: `request-${r.id}`,
        type: "request",
        date: r.createdAt,
        title: r.subject,
        subtitle: r.customerName,
        badge: r.status,
        meta: r.description,
      });
    }

    for (const ec of eventCustomers) {
      result.push({
        id: `event-${ec.id}`,
        type: "event",
        date: ec.event.date,
        title: ec.event.name,
        subtitle: ec.event.location ?? undefined,
        badge: ec.attended ? "attended" : "invited",
        meta: ec.notes,
      });
    }

    for (const t of tasks) {
      result.push({
        id: `task-${t.id}`,
        type: "task",
        date: t.createdAt,
        title: t.title,
        subtitle: t.assignedTo ? `Assigned to ${t.assignedTo.fullName}` : undefined,
        badge: t.status,
        meta: t.description,
      });
    }

    return result.sort((a, b) => timelineDate(b) - timelineDate(a));
  }, [interactions, visits, requests, eventCustomers, tasks]);

  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm">
        No activity recorded yet
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-6 top-4 bottom-4 w-px bg-gray-200" />

      <div className="space-y-4 py-2">
        {items.map((item) => {
          const Icon = ICON_MAP[item.type];
          return (
            <div key={item.id} className="flex gap-4">
              {/* Icon dot */}
              <div
                className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${ICON_COLORS[item.type]}`}
              >
                <Icon className="h-3.5 w-3.5" />
              </div>

              {/* Content */}
              <div
                className={`flex-1 rounded-lg border p-3 mb-1 ${TYPE_COLORS[item.type]}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium capitalize truncate">
                      {item.title}
                    </p>
                    {item.subtitle && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {item.subtitle}
                      </p>
                    )}
                    {item.meta && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {item.meta}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0 text-right">
                    {item.badge && (
                      <Badge variant="outline" className="text-xs capitalize">
                        {item.badge.replace(/-/g, " ")}
                      </Badge>
                    )}
                    <p className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDate(item.date)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
