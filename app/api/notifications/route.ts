import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  getNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/server/actions/notifications";

export const dynamic = "force-dynamic";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [items, unreadCount] = await Promise.all([
    getNotifications(),
    getUnreadCount(),
  ]);

  return NextResponse.json({ notifications: items, unreadCount });
}

export async function PATCH(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, markAll } = await req.json();

  if (markAll) {
    await markAllNotificationsRead();
  } else if (id) {
    await markNotificationRead(id);
  }

  return NextResponse.json({ success: true });
}
