"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Bell, CheckCheck, FileText, AlertTriangle, CheckSquare, Inbox, Calendar, TrendingDown, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/utils";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  createdAt: string | Date;
  customer?: { id: string; companyName: string } | null;
}

const TYPE_ICONS: Record<string, React.ElementType> = {
  "contract-renewal": FileText,
  "at-risk": AlertTriangle,
  "task-assigned": CheckSquare,
  "request-submitted": Inbox,
  "visit-scheduled": Calendar,
  "health-score-drop": TrendingDown,
  general: Info,
};

const TYPE_COLORS: Record<string, string> = {
  "contract-renewal": "text-amber-500",
  "at-risk": "text-red-500",
  "task-assigned": "text-purple-500",
  "request-submitted": "text-orange-500",
  "visit-scheduled": "text-green-600",
  "health-score-drop": "text-red-500",
  general: "text-blue-500",
};

interface NotificationBellProps {
  profileId: string;
}

export function NotificationBell({ profileId }: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications ?? []);
      setUnreadCount(data.unreadCount ?? 0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll every 60 seconds for new notifications
    const interval = setInterval(fetchNotifications, 60_000);
    return () => clearInterval(interval);
  }, []);

  // Close panel on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleMarkRead = async (id: string) => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  const handleMarkAllRead = async () => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAll: true }),
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="relative flex items-center justify-center h-8 w-8 rounded-md hover:bg-gray-100 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-50 w-96 rounded-lg border bg-white shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold">Notifications</p>
              {unreadCount > 0 && (
                <Badge className="bg-red-100 text-red-700 text-xs">{unreadCount} new</Badge>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto">
            {loading && notifications.length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Loading...
              </div>
            )}

            {!loading && notifications.length === 0 && (
              <div className="text-center py-10 text-muted-foreground">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-20" />
                <p className="text-sm">No notifications yet</p>
              </div>
            )}

            {notifications.map((notification) => {
              const Icon = TYPE_ICONS[notification.type] ?? Info;
              const iconColor = TYPE_COLORS[notification.type] ?? "text-gray-500";
              const content = (
                <div
                  className={cn(
                    "flex gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b last:border-0 cursor-pointer",
                    !notification.read && "bg-blue-50 hover:bg-blue-50/70"
                  )}
                  onClick={() => {
                    if (!notification.read) handleMarkRead(notification.id);
                    if (!notification.link) setOpen(false);
                  }}
                >
                  <div
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                      !notification.read ? "bg-white" : "bg-gray-100"
                    )}
                  >
                    <Icon className={`h-4 w-4 ${iconColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        "text-sm truncate",
                        !notification.read ? "font-semibold text-gray-900" : "text-gray-700"
                      )}
                    >
                      {notification.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatRelativeTime(notification.createdAt)}
                    </p>
                  </div>
                  {!notification.read && (
                    <div className="shrink-0 mt-1.5 h-2 w-2 rounded-full bg-blue-500" />
                  )}
                </div>
              );

              return notification.link ? (
                <Link
                  key={notification.id}
                  href={notification.link}
                  onClick={() => setOpen(false)}
                >
                  {content}
                </Link>
              ) : (
                <div key={notification.id}>{content}</div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
