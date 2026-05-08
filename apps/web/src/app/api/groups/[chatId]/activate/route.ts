import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Owner } from "@/lib/models";

const TOKEN = process.env["TELEGRAM_BOT_TOKEN"]!;

export async function POST(
  req: NextRequest,
  { params }: { params: { chatId: string } }
) {
  const { telegramId } = await req.json();
  const { chatId } = params;

  const message =
    `<b>FoxGuard has been activated for this group.</b>\n\n` +
    `I am your AI community manager. Here is what I will do:\n\n` +
    `<b>Moderation</b>\n` +
    `• Auto-delete links from non-admins\n` +
    `• Remove spam and flood messages\n` +
    `• Detect and ban scam messages\n` +
    `• Mute users who break rules\n\n` +
    `<b>AI Support</b>\n` +
    `• Mention me or reply to my messages with any question\n` +
    `• I will answer based on the project knowledge base\n\n` +
    `<b>Commands for admins</b>\n` +
    `/warn @user — issue a warning\n` +
    `/mute @user — mute a user\n` +
    `/ban @user — ban a user\n` +
    `/stats — view group stats\n\n` +
    `Manage settings at the dashboard.`;

  const res = await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: "HTML" }),
  });

  const data = await res.json();
  if (!data.ok) {
    return NextResponse.json(
      { error: "Could not send message. Make sure the bot is an admin in the group." },
      { status: 400 }
    );
  }

  if (telegramId) {
    await connectDB();
    await Owner.findOneAndUpdate(
      { telegramId, "groups.chatId": chatId },
      { $set: { "groups.$.activated": true } }
    );
  }

  return NextResponse.json({ ok: true });
}
