import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import twilio from "twilio";
import { getAtRiskByVisits } from "@/server/queries/events";

export const dynamic = "force-dynamic";

/**
 * POST /api/alerts/at-risk
 * Sends email + SMS alerts for clients with no completed visit in thresholdDays.
 * Body: { thresholdDays?: number, notifyEmail?: string, notifyPhone?: string }
 *
 * This endpoint can be called from a cron job or manually from the dashboard.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const thresholdDays: number = body.thresholdDays ?? 90;
    const notifyEmail: string | undefined = body.notifyEmail;
    const notifyPhone: string | undefined = body.notifyPhone;

    const atRiskClients = await getAtRiskByVisits(thresholdDays);

    if (atRiskClients.length === 0) {
      return NextResponse.json({
        message: "No at-risk clients found",
        count: 0,
      });
    }

    const clientList = atRiskClients
      .map((c) => {
        const daysSince = c.last_visit_date
          ? Math.floor(
              (Date.now() - new Date(c.last_visit_date).getTime()) / 86400000
            )
          : null;
        return `• ${c.company_name} — ${daysSince !== null ? `${daysSince} days since last visit` : "no visits on record"}`;
      })
      .join("\n");

    const results: { email?: string; sms?: string; errors: string[] } = {
      errors: [],
    };

    // Send email alert if configured
    if (notifyEmail && process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const { error } = await resend.emails.send({
        from:
          process.env.RESEND_FROM_EMAIL ?? "alerts@rbmservices.com",
        to: [notifyEmail],
        subject: `⚠️ At-Risk Client Alert: ${atRiskClients.length} client${atRiskClients.length !== 1 ? "s" : ""} need attention`,
        html: `
          <h2>At-Risk Client Alert</h2>
          <p>The following clients have not had a completed visit in the last <strong>${thresholdDays} days</strong>:</p>
          <ul>
            ${atRiskClients
              .map((c) => {
                const daysSince = c.last_visit_date
                  ? Math.floor(
                      (Date.now() - new Date(c.last_visit_date).getTime()) /
                        86400000
                    )
                  : null;
                return `<li><strong>${c.company_name}</strong> — ${
                  daysSince !== null
                    ? `${daysSince} days since last visit`
                    : "no visits on record"
                }${c.primary_contact_name ? ` (${c.primary_contact_name})` : ""}</li>`;
              })
              .join("")}
          </ul>
          <p>Please schedule follow-up visits soon.</p>
        `,
      });
      if (error) {
        results.errors.push(`Email error: ${error.message}`);
      } else {
        results.email = "sent";
      }
    }

    // Send SMS alert if configured
    if (notifyPhone && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      const client = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );
      const message = `RBM CRM Alert: ${atRiskClients.length} client${atRiskClients.length !== 1 ? "s" : ""} at risk (no visit in ${thresholdDays}+ days):\n${clientList.slice(0, 400)}`;
      await client.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: notifyPhone,
      });
      results.sms = "sent";
    }

    return NextResponse.json({
      message: `Found ${atRiskClients.length} at-risk client(s)`,
      count: atRiskClients.length,
      clients: atRiskClients.map((c) => c.company_name),
      ...results,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Alert failed" }, { status: 500 });
  }
}

/**
 * GET /api/alerts/at-risk?days=90
 * Returns at-risk clients without sending alerts.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const days = parseInt(searchParams.get("days") ?? "90", 10);

  try {
    const clients = await getAtRiskByVisits(days);
    return NextResponse.json({ clients, count: clients.length });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch at-risk clients" }, { status: 500 });
  }
}
