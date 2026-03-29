import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { GlobalSearch } from "./global-search";
import { NotificationBell } from "./notification-bell";

interface HeaderProps {
  title: string;
}

export async function Header({ title }: HeaderProps) {
  const { userId } = await auth();

  let profile = null;
  if (userId) {
    profile = await db.query.profiles.findFirst({
      where: eq(profiles.clerkId, userId),
    });
  }

  const initials = profile?.fullName
    ? profile.fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  return (
    <header className="flex h-16 items-center justify-between border-b bg-white px-6">
      <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
      <div className="flex items-center gap-3">
        <GlobalSearch />
        {profile?.id && <NotificationBell profileId={profile.id} />}
        <Badge variant="outline" className="capitalize">
          {profile?.role ?? "loading"}
        </Badge>
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-[#1B4F8A] text-white text-xs">
            {initials}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
