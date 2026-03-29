import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { profiles, pendingInvitations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Resend } from "resend";
import { z } from "zod";

const inviteSchema = z.object({
  email: z.string().email("Invalid email address"),
  fullName: z.string().optional(),
  role: z.enum([
    "admin",
    "sales_manager",
    "sales_rep",
    "account_manager",
    "building_ops",
    "events-only",
    "customer",
  ]),
});

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only admins can invite users
  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.clerkId, userId),
  });
  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = inviteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid data", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { email, fullName, role } = parsed.data;

  try {
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await db
      .insert(pendingInvitations)
      .values({
        email,
        role,
        token,
        invitedById: profile.id,
        expiresAt,
      })
      .onConflictDoNothing();

    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) {
      return NextResponse.json(
        { error: "Email service is not configured" },
        { status: 500 }
      );
    }

    const resend = new Resend(resendKey);
    const fromAddress =
      process.env.RESEND_FROM_EMAIL ?? "noreply@rbmservices.com";
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
    const signUpUrl = `${appUrl}/login`;
    const roleName = role.replace(/[_-]/g, " ");

    await resend.emails.send({
      from: fromAddress,
      to: email,
      subject: "You've been invited to RBM CRM",
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2>You've been invited to RBM CRM</h2>
          <p>Hi${fullName ? ` ${fullName}` : ""},</p>
          <p>You've been invited to join RBM CRM as a <strong>${roleName}</strong>.</p>
          <p>
            <a href="${signUpUrl}" style="display:inline-block;padding:10px 20px;background:#1B4F8A;color:#fff;text-decoration:none;border-radius:4px;">
              Sign in to RBM CRM
            </a>
          </p>
          <p>If the button above doesn't work, copy and paste this URL into your browser:</p>
          <p><a href="${signUpUrl}">${signUpUrl}</a></p>
          <p style="color: #666; font-size: 0.875rem;">This invitation expires in 7 days. If you didn't expect this invitation, you can safely ignore this email.</p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[invite]", err);
    const message = err?.message ?? "Failed to send invitation";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
