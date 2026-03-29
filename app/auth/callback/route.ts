import { NextResponse } from "next/server";

// Auth is now handled by Clerk. This route is no longer used.
export async function GET() {
  return NextResponse.redirect(new URL("/", process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"));
}
