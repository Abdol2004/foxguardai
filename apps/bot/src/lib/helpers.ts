import type { Context } from "grammy";
import { UserProfile, Analytics, ModerationEvent } from "../db/models.js";

export async function getUserProfile(chatId: string, userId: string, username: string) {
  return UserProfile.findOneAndUpdate(
    { chatId, userId },
    { $setOnInsert: { username } },
    { upsert: true, new: true }
  );
}

export async function applyMute(ctx: Context, chatId: string, userId: string, durationSecs: number) {
  const until = new Date(Date.now() + durationSecs * 1000);
  await ctx.api
    .restrictChatMember(Number(chatId), Number(userId), {
      permissions: { can_send_messages: false },
      until_date: Math.floor(until.getTime() / 1000),
    })
    .catch(() => null);

  await UserProfile.findOneAndUpdate(
    { chatId, userId },
    { muted: true, muteUntil: until }
  );

  await ModerationEvent.create({
    chatId,
    userId,
    action: "mute",
    reason: `Muted for ${durationSecs}s`,
  });
}

export async function applyBan(ctx: Context, chatId: string, userId: string) {
  await ctx.api.banChatMember(Number(chatId), Number(userId)).catch(() => null);
  await UserProfile.findOneAndUpdate({ chatId, userId }, { banned: true });
  await ModerationEvent.create({ chatId, userId, action: "ban", reason: "Scam detected" });
}

type AnalyticsField =
  | "totalMessages"
  | "activeUsers"
  | "spamDeleted"
  | "linksDeleted"
  | "scamDeleted"
  | "aiReplies"
  | "newMembers";

export async function incrementAnalytics(chatId: string, field: AnalyticsField, by = 1) {
  const date = new Date().toISOString().split("T")[0]!;
  await Analytics.findOneAndUpdate(
    { chatId, date },
    { $inc: { [field]: by } },
    { upsert: true }
  );
}

export function formatWelcome(template: string, groupName: string, userName: string): string {
  return template
    .replace("{group_name}", groupName)
    .replace("{user_name}", userName);
}
