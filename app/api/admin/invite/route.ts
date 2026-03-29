import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
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
    "events_only",
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
    const client = await clerkClient();
    await client.invitations.createInvitation({
      emailAddress: email,
      publicMetadata: {
        role,
        ...(fullName ? { fullName } : {}),
      },
      redirectUrl: process.env.NEXT_PUBLIC_APP_URL
        ? `${process.env.NEXT_PUBLIC_APP_URL}/sign-up`
        : undefined,
      ignoreExisting: false,
    });

    // Send notification email via Resend
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      const resend = new Resend(resendKey);
      const fromAddress =
        process.env.RESEND_FROM_EMAIL ?? "noreply@rbmservices.com";

      await resend.emails.send({
        from: fromAddress,
        to: email,
        subject: "You've been invited to RBM CRM",
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
            <h2>You've been invited to RBM CRM</h2>
            <p>Hi${fullName ? ` ${fullName}` : ""},</p>
            <p>You've been invited to join RBM CRM as a <strong>${role.replace(/_/g, " ")}</strong>.</p>
            <p>Check your inbox for the Clerk invitation email to set up your account and get started.</p>
            <p style="color: #666; font-size: 0.875rem;">If you didn't expect this invitation, you can safely ignore this email.</p>
          </div>
        `,
      });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[invite]", err);
    const message = err?.errors?.[0]?.message ?? err?.message ?? "Failed to send invitation";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
