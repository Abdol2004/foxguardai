import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";

const TOKEN = process.env["TELEGRAM_BOT_TOKEN"]!;

export async function POST(
  req: NextRequest,
  { params }: { params: { secret: string } }
) {
  const validSecret = process.env["ADMIN_SECRET"];
  if (!validSecret || params.secret !== validSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { message } = await req.json();
  if (!message?.trim()) return NextResponse.json({ error: "message required" }, { status: 400 });

  await connectDB();
  const { GroupSettings } = await import("@/lib/models");
  const groups = await GroupSettings.find({}).select("chatId").lean() as any[];

  let sent = 0;
  let failed = 0;

  for (const g of groups) {
    const res = await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: g.chatId, text: message, parse_mode: "HTML" }),
    });
    const data = await res.json();
    data.ok ? sent++ : failed++;
  }

  return NextResponse.json({ sent, failed });
}
