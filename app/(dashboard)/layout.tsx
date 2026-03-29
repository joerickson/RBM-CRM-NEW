import { Sidebar } from "@/components/layout/sidebar";
import { syncClerkUserToSupabase } from "@/lib/auth/sync-user";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await syncClerkUserToSupabase();

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar userRole={profile?.role ?? undefined} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
