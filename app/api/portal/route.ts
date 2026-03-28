import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { customerRequests } from "@/lib/db/schema";
import { customerRequestSchema } from "@/lib/validations";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = customerRequestSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Invalid data", details: validated.error.flatten() },
        { status: 400 }
      );
    }

    const [request] = await db
      .insert(customerRequests)
      .values(validated.data)
      .returning();

    return NextResponse.json({ id: request.id, success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to submit request" },
      { status: 500 }
    );
  }
}
