import type { Context, NextFunction } from "grammy";
import { GroupSettings, ModerationEvent } from "../db/models.js";
import { incrementAnalytics, applyBan } from "../lib/helpers.js";

export async function antiScamMiddleware(ctx: Context, next: NextFunction) {
  if (!ctx.message || !ctx.chat || ctx.chat.type === "private") return next();

  const text = (ctx.message.text ?? ctx.message.caption ?? "").toLowerCase();
  if (!text) return next();

  const chatId = String(ctx.chat.id);
  const settings = await GroupSettings.findOne({ chatId }).lean();
  if (!settings?.moderation?.antiScam) return next();

  const member = await ctx.getChatMember(ctx.from!.id);
  if (["creator", "administrator"].includes(member.status)) return next();

  const keywords: string[] = settings.moderation.scamKeywords ?? [];
  const matched = keywords.find((kw) => text.includes(kw.toLowerCase()));
  if (!matched) return next();

  const userId = String(ctx.from?.id ?? "");
  await ctx.deleteMessage().catch(() => null);

  await ModerationEvent.create({
    chatId,
    userId,
    username: ctx.from?.username ?? "",
    action: "delete_scam",
    reason: `Scam keyword: "${matched}"`,
    messageText: text.slice(0, 200),
  });

  await incrementAnalytics(chatId, "scamDeleted");

  if (settings.moderation.banOnScam) {
    await applyBan(ctx, chatId, userId);
    await ctx
      .reply(`🚫 Scam message detected. User banned.`)
      .then((m) => setTimeout(() => ctx.api.deleteMessage(ctx.chat!.id, m.message_id), 10000))
      .catch(() => null);
  }
}
