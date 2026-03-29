"use client";

import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Users,
  Calendar as CalendarIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface EventType {
  id: string;
  name: string;
  slug: string;
  color: string;
}

interface Event {
  id: string;
  name: string;
  date: string | Date;
  location: string | null;
  type: string;
  eventType: EventType | null;
  company: string | null;
  totalTickets: number;
  eventCustomers: { id: string }[];
  eventAttendees: { id: string }[];
}

interface CalendarViewProps {
  events: Event[];
  onEventClick: (event: Event) => void;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function getColorDot(color: string) {
  const map: Record<string, string> = {
    blue: "bg-blue-500",
    purple: "bg-purple-500",
    green: "bg-green-500",
    orange: "bg-orange-500",
    pink: "bg-pink-500",
    indigo: "bg-indigo-500",
    red: "bg-red-500",
    yellow: "bg-yellow-500",
    teal: "bg-teal-500",
    gray: "bg-gray-500",
  };
  return map[color] ?? "bg-gray-500";
}

function getColorBadge(color: string) {
  const map: Record<string, string> = {
    blue: "bg-blue-100 text-blue-700 border-blue-200",
    purple: "bg-purple-100 text-purple-700 border-purple-200",
    green: "bg-green-100 text-green-700 border-green-200",
    orange: "bg-orange-100 text-orange-700 border-orange-200",
    pink: "bg-pink-100 text-pink-700 border-pink-200",
    indigo: "bg-indigo-100 text-indigo-700 border-indigo-200",
    red: "bg-red-100 text-red-700 border-red-200",
    yellow: "bg-yellow-100 text-yellow-700 border-yellow-200",
    teal: "bg-teal-100 text-teal-700 border-teal-200",
    gray: "bg-gray-100 text-gray-700 border-gray-200",
  };
  return map[color] ?? "bg-gray-100 text-gray-700 border-gray-200";
}

export function CalendarView({ events, onEventClick }: CalendarViewProps) {
  const today = new Date();
  const [viewMode, setViewMode] = useState<"month" | "week">("month");
  const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  function prevPeriod() {
    if (viewMode === "month") {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    } else {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - 7);
      setCurrentDate(d);
    }
  }

  function nextPeriod() {
    if (viewMode === "month") {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    } else {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + 7);
      setCurrentDate(d);
    }
  }

  function goToday() {
    if (viewMode === "month") {
      setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));
    } else {
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      setCurrentDate(startOfWeek);
    }
  }

  function getEventsForDay(day: Date) {
    return events.filter((e) => {
      const d = new Date(e.date);
      return (
        d.getFullYear() === day.getFullYear() &&
        d.getMonth() === day.getMonth() &&
        d.getDate() === day.getDate()
      );
    });
  }

  function getAttendeeCount(event: Event) {
    return event.eventCustomers.length + event.eventAttendees.length;
  }

  function getEventColor(event: Event) {
    return event.eventType?.color ?? "gray";
  }

  // ─── Month View ─────────────────────────────────────────────────────────────

  function renderMonthView() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const cells: { date: Date; isCurrentMonth: boolean }[] = [];

    // Prev month fill
    for (let i = firstDay - 1; i >= 0; i--) {
      cells.push({
        date: new Date(year, month - 1, daysInPrevMonth - i),
        isCurrentMonth: false,
      });
    }
    // Current month
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ date: new Date(year, month, d), isCurrentMonth: true });
    }
    // Next month fill
    const remaining = 42 - cells.length;
    for (let d = 1; d <= remaining; d++) {
      cells.push({ date: new Date(year, month + 1, d), isCurrentMonth: false });
    }

    return (
      <div className="flex-1">
        <div className="grid grid-cols-7 border-b">
          {DAYS.map((d) => (
            <div
              key={d}
              className="py-2 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider"
            >
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 flex-1">
          {cells.map((cell, idx) => {
            const dayEvents = getEventsForDay(cell.date);
            const isToday =
              cell.date.toDateString() === today.toDateString();

            return (
              <div
                key={idx}
                className={`min-h-[100px] border-b border-r p-1 ${
                  !cell.isCurrentMonth ? "bg-gray-50" : "bg-white"
                }`}
              >
                <div
                  className={`text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full ${
                    isToday
                      ? "bg-[#1B4F8A] text-white"
                      : cell.isCurrentMonth
                      ? "text-gray-900"
                      : "text-gray-400"
                  }`}
                >
                  {cell.date.getDate()}
                </div>
                <div className="space-y-0.5">
                  {dayEvents.slice(0, 3).map((evt) => (
                    <button
                      key={evt.id}
                      onClick={() => onEventClick(evt)}
                      className={`w-full text-left text-xs px-1.5 py-0.5 rounded truncate border font-medium hover:opacity-80 transition-opacity ${getColorBadge(
                        getEventColor(evt)
                      )}`}
                    >
                      {evt.name}
                    </button>
                  ))}
                  {dayEvents.length > 3 && (
                    <p className="text-xs text-muted-foreground pl-1">
                      +{dayEvents.length - 3} more
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ─── Week View ───────────────────────────────────────────────────────────────

  function renderWeekView() {
    // Normalize currentDate to start of week (Sunday)
    const startOfWeek = new Date(currentDate);
    const dayOfWeek = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek);

    const weekDays: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      weekDays.push(d);
    }

    return (
      <div className="flex-1">
        <div className="grid grid-cols-7 border-b">
          {weekDays.map((d, i) => {
            const isToday = d.toDateString() === today.toDateString();
            return (
              <div key={i} className="py-3 text-center border-r last:border-r-0">
                <p className="text-xs font-medium text-muted-foreground uppercase">
                  {DAYS[i]}
                </p>
                <div
                  className={`text-lg font-semibold mx-auto w-9 h-9 flex items-center justify-center rounded-full mt-1 ${
                    isToday ? "bg-[#1B4F8A] text-white" : "text-gray-900"
                  }`}
                >
                  {d.getDate()}
                </div>
              </div>
            );
          })}
        </div>
        <div className="grid grid-cols-7 min-h-[400px]">
          {weekDays.map((d, i) => {
            const dayEvents = getEventsForDay(d);
            return (
              <div
                key={i}
                className="border-r last:border-r-0 p-2 space-y-1"
              >
                {dayEvents.map((evt) => (
                  <button
                    key={evt.id}
                    onClick={() => onEventClick(evt)}
                    className={`w-full text-left p-2 rounded-lg border text-xs hover:opacity-80 transition-opacity ${getColorBadge(
                      getEventColor(evt)
                    )}`}
                  >
                    <p className="font-semibold truncate">{evt.name}</p>
                    <p className="text-xs opacity-75">
                      {new Date(evt.date).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    <div className="flex items-center gap-1 mt-1 opacity-75">
                      <Users className="h-3 w-3" />
                      <span>{getAttendeeCount(evt)}</span>
                    </div>
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ─── Header label ────────────────────────────────────────────────────────────

  function getHeaderLabel() {
    if (viewMode === "month") {
      return `${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    }
    // Week label
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    if (startOfWeek.getMonth() === endOfWeek.getMonth()) {
      return `${MONTHS[startOfWeek.getMonth()]} ${startOfWeek.getDate()}–${endOfWeek.getDate()}, ${startOfWeek.getFullYear()}`;
    }
    return `${MONTHS[startOfWeek.getMonth()]} ${startOfWeek.getDate()} – ${MONTHS[endOfWeek.getMonth()]} ${endOfWeek.getDate()}, ${startOfWeek.getFullYear()}`;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-white">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToday}>
            Today
          </Button>
          <Button variant="ghost" size="icon" onClick={prevPeriod}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={nextPeriod}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <h2 className="text-base font-semibold ml-2">{getHeaderLabel()}</h2>
        </div>
        <div className="flex items-center gap-1 border rounded-md overflow-hidden">
          <button
            className={`px-3 py-1.5 text-xs font-medium transition-colors ${
              viewMode === "month"
                ? "bg-[#1B4F8A] text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
            onClick={() => setViewMode("month")}
          >
            Month
          </button>
          <button
            className={`px-3 py-1.5 text-xs font-medium transition-colors ${
              viewMode === "week"
                ? "bg-[#1B4F8A] text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
            onClick={() => setViewMode("week")}
          >
            Week
          </button>
        </div>
      </div>

      {/* Calendar body */}
      <div className="flex-1 overflow-auto bg-white border rounded-b-lg">
        {viewMode === "month" ? renderMonthView() : renderWeekView()}
      </div>
    </div>
  );
}
