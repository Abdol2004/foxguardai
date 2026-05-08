import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Owner } from "@/lib/models";

const TOKEN            = process.env["TELEGRAM_BOT_TOKEN"]!;
const OFFICIAL_CHANNEL = process.env["OFFICIAL_CHANNEL"] ?? "@foxguardaigroup";

async function sendMessage(chatId: string | number, text: string) {
  return fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
  }).then((r) => r.json());
}

export async function POST(
  req: NextRequest,
  { params }: { params: { chatId: string } }
) {
  const { telegramId, groupTitle } = await req.json();
  const { chatId } = params;

  // ── Send activation message to the group ─────────────────────────────────
  const groupMessage =
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
    `<b>Admin Commands</b>\n` +
    `/warn — warn a user (reply to their message)\n` +
    `/mute — mute a user\n` +
    `/ban — ban a user\n` +
    `/stats — view group stats\n\n` +
    `Manage all settings at the FoxGuard dashboard.`;

  const groupRes = await sendMessage(chatId, groupMessage);

  if (!groupRes.ok) {
    return NextResponse.json(
      { error: "Could not send message. Make sure the bot is an admin in the group." },
      { status: 400 }
    );
  }

  // ── Send alert to official channel ────────────────────────────────────────
  const title = groupTitle || chatId;
  const channelAlert =
    `🦊 <b>New group activated on FoxGuard!</b>\n\n` +
    `Group: <b>${title}</b>\n` +
    `ID: <code>${chatId}</code>\n\n` +
    `FoxGuard is now protecting this community.`;

  // Fire and forget — don't fail if channel message fails
  sendMessage(OFFICIAL_CHANNEL, channelAlert).catch(() => null);

  // ── Update owner record ───────────────────────────────────────────────────
  if (telegramId) {
    await connectDB();
    await Owner.findOneAndUpdate(
      { telegramId, "groups.chatId": chatId },
      { $set: { "groups.$.activated": true } }
    );
  }

  return NextResponse.json({ ok: true });
}
