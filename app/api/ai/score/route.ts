import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { db } from "@/lib/db";
import { customers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { customerId } = await req.json();

    if (!customerId) {
      return NextResponse.json({ error: "customerId required" }, { status: 400 });
    }

    const customer = await db.query.customers.findFirst({
      where: eq(customers.id, customerId),
      with: {
        visits: { limit: 10, orderBy: (v, { desc }) => [desc(v.visitDate)] },
        interactions: { limit: 10, orderBy: (i, { desc }) => [desc(i.interactionDate)] },
        requests: { limit: 5, orderBy: (r, { desc }) => [desc(r.createdAt)] },
      },
    });

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const prompt = `You are an AI scoring engine for RBM Services, a commercial janitorial company.
Analyze this customer and provide scores from 0-100.

Customer Data:
- Company: ${customer.companyName}
- Status: ${customer.status}
- Stage: ${customer.stage ?? "N/A"}
- Brand: ${customer.brand}
- Monthly Value: $${customer.monthlyValue ?? 0}
- Contract Start: ${customer.contractStartDate ?? "N/A"}
- Contract End: ${customer.contractEndDate ?? "N/A"}
- Recent Visits: ${customer.visits.length} (statuses: ${customer.visits.map((v) => v.status).join(", ") || "none"})
- Recent Interactions: ${customer.interactions.length}
- Open Requests: ${customer.requests.filter((r) => r.status === "open").length}
- Customer Ratings: ${customer.visits.filter((v) => v.customerRating).map((v) => v.customerRating).join(", ") || "none"}

Provide a JSON response with:
{
  "healthScore": <0-100, higher = healthier relationship>,
  "riskScore": <0-100, higher = more risk of churn>,
  "leadScore": <0-100, higher = better lead quality, only for leads/prospects>,
  "notes": "<2-3 sentence summary of key findings and recommended actions>"
}`;

    const response = await anthropic.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 500,
      messages: [{ role: "user", content: prompt }],
    });

    const content = response.content[0];
    if (content.type !== "text") throw new Error("Unexpected response type");

    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");

    const scores = JSON.parse(jsonMatch[0]);

    // Save scores to DB
    await db
      .update(customers)
      .set({
        aiHealthScore: scores.healthScore,
        aiRiskScore: scores.riskScore,
        aiLeadScore: scores.leadScore,
        aiNotes: scores.notes,
        lastScoreAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(customers.id, customerId));

    return NextResponse.json(scores);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to score customer" }, { status: 500 });
  }
}
