import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { db } from "@/lib/db";
import { customers } from "@/lib/db/schema";
import { isNotNull } from "drizzle-orm";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function GET() {
  try {
    const pipeline = await db.query.customers.findMany({
      where: isNotNull(customers.stage),
      with: { assignedRep: true },
    });

    const stageCounts = pipeline.reduce(
      (acc, c) => {
        if (c.stage) acc[c.stage] = (acc[c.stage] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const totalValue = pipeline
      .filter((c) => c.monthlyValue)
      .reduce((sum, c) => sum + parseFloat(c.monthlyValue!), 0);

    const prompt = `You are an AI sales analyst for RBM Services, a commercial janitorial company.
Analyze this sales pipeline and provide insights.

Pipeline Summary:
${Object.entries(stageCounts)
  .map(([stage, count]) => `- ${stage}: ${count} customers`)
  .join("\n")}
- Total Pipeline Value: $${totalValue.toFixed(0)}/month
- Total Opportunities: ${pipeline.length}

Top Opportunities:
${pipeline
  .filter((c) => c.monthlyValue)
  .sort((a, b) => parseFloat(b.monthlyValue!) - parseFloat(a.monthlyValue!))
  .slice(0, 5)
  .map((c) => `- ${c.companyName}: $${c.monthlyValue}/mo (${c.stage})`)
  .join("\n")}

Provide a JSON response:
{
  "summary": "<2-3 sentence pipeline health assessment>",
  "conversionInsights": "<analysis of stage progression>",
  "topRecommendations": ["<rec 1>", "<rec 2>", "<rec 3>"],
  "riskFlags": ["<risk 1>", "<risk 2>"],
  "forecastedMonthlyRevenue": <number estimate of closeable revenue this month>
}`;

    const response = await anthropic.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 800,
      messages: [{ role: "user", content: prompt }],
    });

    const content = response.content[0];
    if (content.type !== "text") throw new Error("Unexpected response");

    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON");

    return NextResponse.json(JSON.parse(jsonMatch[0]));
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to analyze pipeline" },
      { status: 500 }
    );
  }
}
