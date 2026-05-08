import type { Context, NextFunction } from "grammy";
import { GroupSettings, FloodTracker } from "../db/models.js";
import { incrementAnalytics, applyMute } from "../lib/helpers.js";

export async function floodProtectionMiddleware(ctx: Context, next: NextFunction) {
  if (!ctx.message || !ctx.chat || ctx.chat.type === "private") return next();

  const chatId = String(ctx.chat.id);
  const settings = await GroupSettings.findOne({ chatId }).lean();
  if (!settings?.moderation?.floodProtection) return next();

  const member = await ctx.getChatMember(ctx.from!.id);
  if (["creator", "administrator"].includes(member.status)) return next();

  const userId = String(ctx.from?.id ?? "");
  const threshold = settings.moderation.floodThreshold ?? 5;
  const windowSecs = settings.moderation.floodWindowSecs ?? 10;
  const now = new Date();
  const expireAt = new Date(now.getTime() + windowSecs * 1000);

  const tracker = await FloodTracker.findOneAndUpdate(
    { chatId, userId },
    {
      $inc: { count: 1 },
      $setOnInsert: { windowStart: now, expireAt },
    },
    { upsert: true, new: true }
  );

  if (tracker.count >= threshold) {
    await ctx.deleteMessage().catch(() => null);
    await incrementAnalytics(chatId, "spamDeleted");

    if (tracker.count === threshold) {
      await applyMute(ctx, chatId, userId, settings.moderation.muteDurationSecs ?? 300);
      await ctx
        .reply(`🌊 Slow down, @${ctx.from?.username ?? "User"}! You've been muted for flooding.`)
        .then((m) => setTimeout(() => ctx.api.deleteMessage(ctx.chat!.id, m.message_id), 8000))
        .catch(() => null);
    }
    return;
  }

  return next();
}
