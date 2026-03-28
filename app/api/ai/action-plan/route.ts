import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { db } from "@/lib/db";
import { customers, tasks } from "@/lib/db/schema";
import { eq, or } from "drizzle-orm";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function GET() {
  try {
    const [atRiskCustomers, openLeads, openTasks] = await Promise.all([
      db.query.customers.findMany({
        where: eq(customers.status, "at-risk"),
        with: { assignedRep: true },
        limit: 10,
      }),
      db.query.customers.findMany({
        where: or(
          eq(customers.status, "lead"),
          eq(customers.status, "prospect")
        ),
        orderBy: (c, { desc }) => [desc(c.aiLeadScore)],
        limit: 10,
      }),
      db.query.tasks.findMany({
        where: eq(tasks.status, "todo"),
        with: { assignedTo: true, customer: true },
        limit: 10,
      }),
    ]);

    const prompt = `You are an AI operations assistant for RBM Services, a commercial janitorial company.
Generate a concise daily action plan for the sales and operations team.

At-Risk Customers (${atRiskCustomers.length}):
${atRiskCustomers.map((c) => `- ${c.companyName} (risk: ${c.aiRiskScore ?? "unscored"}, $${c.monthlyValue ?? 0}/mo)`).join("\n")}

Top Leads (${openLeads.length}):
${openLeads.map((c) => `- ${c.companyName} (stage: ${c.stage}, lead score: ${c.aiLeadScore ?? "unscored"})`).join("\n")}

Open Tasks (${openTasks.length}):
${openTasks.map((t) => `- ${t.title} (priority: ${t.priority})`).join("\n")}

Provide a JSON response:
{
  "date": "${new Date().toISOString().split("T")[0]}",
  "summary": "<1-2 sentence overview of today's priorities>",
  "priorities": [
    {
      "customerId": "<id or 'general'>",
      "customerName": "<name>",
      "action": "<specific action to take>",
      "reason": "<why this is important>",
      "urgency": "high|medium|low"
    }
  ],
  "insights": ["<insight 1>", "<insight 2>", "<insight 3>"]
}

Limit to 5 priorities and 3 insights. Be specific and actionable.`;

    const response = await anthropic.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    });

    const content = response.content[0];
    if (content.type !== "text") throw new Error("Unexpected response type");

    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");

    const plan = JSON.parse(jsonMatch[0]);
    return NextResponse.json(plan);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to generate action plan" },
      { status: 500 }
    );
  }
}
