"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Users, CheckSquare, Inbox, PartyPopper, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchResult {
  type: "customer" | "task" | "request" | "event";
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  href: string;
}

const TYPE_ICONS = {
  customer: Users,
  task: CheckSquare,
  request: Inbox,
  event: PartyPopper,
};

const TYPE_LABELS = {
  customer: "Customer",
  task: "Task",
  request: "Request",
  event: "Event",
};

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
      setSelected(0);
    }
  }, [open]);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.results ?? []);
        setSelected(0);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = useCallback(
    (href: string) => {
      setOpen(false);
      router.push(href);
    },
    [router]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelected((s) => Math.min(s + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelected((s) => Math.max(s - 1, 0));
    } else if (e.key === "Enter" && results[selected]) {
      handleSelect(results[selected].href);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
      >
        <Search className="h-3.5 w-3.5" />
        <span>Search...</span>
        <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-mono bg-white border rounded text-gray-400">
          ⌘K
        </kbd>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="p-0 gap-0 max-w-xl overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3 border-b">
            {loading ? (
              <Loader2 className="h-4 w-4 text-muted-foreground shrink-0 animate-spin" />
            ) : (
              <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            )}
            <Input
              autoFocus
              placeholder="Search customers, tasks, requests, events..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="border-0 shadow-none focus-visible:ring-0 p-0 text-sm"
            />
          </div>

          <div className="max-h-80 overflow-y-auto">
            {query.length < 2 && (
              <div className="py-8 text-center text-sm text-muted-foreground">
                Type at least 2 characters to search
              </div>
            )}

            {query.length >= 2 && !loading && results.length === 0 && (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No results for &ldquo;{query}&rdquo;
              </div>
            )}

            {results.length > 0 && (
              <ul className="py-2">
                {results.map((result, i) => {
                  const Icon = TYPE_ICONS[result.type];
                  return (
                    <li key={`${result.type}-${result.id}`}>
                      <button
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors",
                          i === selected
                            ? "bg-[#1B4F8A] text-white"
                            : "hover:bg-gray-50"
                        )}
                        onClick={() => handleSelect(result.href)}
                        onMouseEnter={() => setSelected(i)}
                      >
                        <Icon
                          className={cn(
                            "h-4 w-4 shrink-0",
                            i === selected ? "text-white" : "text-muted-foreground"
                          )}
                        />
                        <div className="flex-1 min-w-0">
                          <p
                            className={cn(
                              "text-sm font-medium truncate",
                              i === selected ? "text-white" : "text-gray-900"
                            )}
                          >
                            {result.title}
                          </p>
                          {result.subtitle && (
                            <p
                              className={cn(
                                "text-xs truncate",
                                i === selected ? "text-blue-200" : "text-muted-foreground"
                              )}
                            >
                              {result.subtitle}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-xs capitalize",
                              i === selected && "border-blue-300 text-blue-100 bg-transparent"
                            )}
                          >
                            {result.badge.replace(/-/g, " ")}
                          </Badge>
                          <span
                            className={cn(
                              "text-xs",
                              i === selected ? "text-blue-200" : "text-muted-foreground"
                            )}
                          >
                            {TYPE_LABELS[result.type]}
                          </span>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="px-4 py-2 border-t text-xs text-muted-foreground flex gap-4">
            <span>↑↓ navigate</span>
            <span>↵ select</span>
            <span>esc close</span>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
