"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@clerk/nextjs";
import {
  LayoutDashboard,
  TrendingUp,
  Users,
  UserCheck,
  CheckSquare,
  Settings,
  Building2,
  LogOut,
  PartyPopper,
  Mail,
  Tag,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const ALL_NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "sales", "building-ops", "customer"] },
  { href: "/sales", label: "Sales", icon: TrendingUp, roles: ["admin", "sales"] },
  { href: "/customers", label: "Customers", icon: Users, roles: ["admin", "sales", "building-ops"] },
  { href: "/events", label: "Events", icon: PartyPopper, roles: ["admin", "sales", "building-ops", "customer", "events-only"] },
  { href: "/employees", label: "Employees", icon: UserCheck, roles: ["admin", "sales"] },
  { href: "/tasks", label: "Tasks", icon: CheckSquare, roles: ["admin", "sales", "building-ops"] },
  { href: "/email-templates", label: "Email Templates", icon: Mail, roles: ["admin", "sales"] },
  { href: "/admin", label: "Admin", icon: Settings, roles: ["admin"] },
  { href: "/admin/settings", label: "Settings", icon: Tag, roles: ["admin"] },
];

interface SidebarProps {
  userRole?: string;
}

export function Sidebar({ userRole }: SidebarProps) {
  const pathname = usePathname();

  const navItems = ALL_NAV_ITEMS.filter((item) =>
    !userRole || item.roles.includes(userRole)
  );

  return (
    <aside className="flex h-full w-64 flex-col border-r bg-white">
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-6">
        <div className="flex items-center gap-2">
          <Building2 className="h-6 w-6 text-[#1B4F8A]" />
          <div>
            <p className="text-sm font-bold text-[#1B4F8A]">RBM Services</p>
            <p className="text-xs text-muted-foreground">CRM Platform</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-3">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive =
              href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-[#1B4F8A] text-white"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t p-4">
        <SignOutButton redirectUrl="/login">
          <Button
            type="button"
            variant="ghost"
            className="w-full justify-start gap-3 text-gray-600"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </SignOutButton>
      </div>
    </aside>
  );
}
