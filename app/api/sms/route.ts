import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export async function POST(req: NextRequest) {
  try {
    const { to, body } = await req.json();

    if (!to || !body) {
      return NextResponse.json(
        { error: "to and body are required" },
        { status: 400 }
      );
    }

    const message = await client.messages.create({
      body,
      from: process.env.TWILIO_PHONE_NUMBER,
      to,
    });

    return NextResponse.json({ sid: message.sid });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to send SMS" }, { status: 500 });
  }
}
