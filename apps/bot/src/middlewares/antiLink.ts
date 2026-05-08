import type { Context, NextFunction } from "grammy";
import { GroupSettings, ModerationEvent } from "../db/models.js";
import { incrementAnalytics, getUserProfile, applyMute } from "../lib/helpers.js";

const URL_REGEX = /(?:https?:\/\/|t\.me\/|@\w+\.(?:com|io|net|org|xyz|gg))/i;

export async function antiLinkMiddleware(ctx: Context, next: NextFunction) {
  if (!ctx.message || !ctx.chat || ctx.chat.type === "private") return next();

  const text = ctx.message.text ?? ctx.message.caption ?? "";
  if (!URL_REGEX.test(text)) return next();

  const chatId = String(ctx.chat.id);
  const settings = await GroupSettings.findOne({ chatId }).lean();
  if (!settings?.moderation?.deleteLinks) return next();

  const userId = String(ctx.from?.id ?? "");
  const member = await ctx.getChatMember(ctx.from!.id);
  if (["creator", "administrator"].includes(member.status)) return next();

  const allowedDomains: string[] = settings.moderation.allowedDomains ?? [];
  if (allowedDomains.some((d) => text.includes(d))) return next();

  await ctx.deleteMessage().catch(() => null);

  const profile = await getUserProfile(chatId, userId, ctx.from?.username ?? "");
  profile.warnings += 1;
  await profile.save();

  await ModerationEvent.create({
    chatId,
    userId,
    username: ctx.from?.username ?? "",
    action: "delete_link",
    reason: "Link detected",
    messageText: text.slice(0, 200),
  });

  await incrementAnalytics(chatId, "linksDeleted");

  if (settings.moderation.muteOnSpam && profile.warnings >= 3) {
    await applyMute(ctx, chatId, userId, settings.moderation.muteDurationSecs ?? 300);
  } else {
    await ctx
      .reply(`⚠️ @${ctx.from?.username ?? "User"}, links are not allowed here.`, {
        reply_parameters: undefined,
      })
      .then((m) => setTimeout(() => ctx.api.deleteMessage(ctx.chat!.id, m.message_id), 8000))
      .catch(() => null);
  }
}
