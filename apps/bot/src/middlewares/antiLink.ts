import type { Context, NextFunction } from "grammy";
import { GroupSettings, ModerationEvent, UserProfile } from "../db/models.js";
import { incrementAnalytics, applyMute } from "../lib/helpers.js";

// Catches: https://x.com, www.x.com, t.me/x, discord.gg/x, bare x.com, x.io, x.net, etc.
const URL_REGEX = new RegExp(
  "(?:" +
    "https?:\\/\\/\\S+" +                    // https://... or http://...
    "|www\\.\\S+" +                           // www.anything
    "|t\\.me\\/\\S+" +                        // t.me/channel
    "|discord\\.gg\\/\\S+" +                  // discord.gg/invite
    "|\\b[\\w-]+\\.(?:" +                     // bare domains: word.TLD
      "com|io|net|org|xyz|gg|co|app|dev|ai|" +
      "me|tv|info|biz|live|site|online|vip|" +
      "pro|club|store|shop|tech|finance|" +
      "crypto|nft|defi|dao|chain|market|" +
      "trade|exchange|token|coin|click|link|" +
      "money|airdrop|giveaway|earn|win|" +
      "to|cc|gg|so|sh|ly|gl|bit|" +
      "uk|us|eu|de|fr|ru|ca|au|id|ph|ng|" +
      "ke|za|gh|in|br|jp|cn|kr|tr|" +
      "gov|edu|mil|int" +
    ")(?:\\/\\S*)?" +                         // optional /path
  ")",
  "i"
);

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

  const profile = await UserProfile.findOneAndUpdate(
    { chatId, userId },
    { $inc: { warnings: 1 }, $setOnInsert: { username: ctx.from?.username ?? "" } },
    { upsert: true, new: true }
  );

  const warnCount = Math.min(profile.warnings, 3);

  await ModerationEvent.create({
    chatId, userId,
    username: ctx.from?.username ?? "",
    action: "delete_link",
    reason: "Link detected",
    messageText: text.slice(0, 200),
  });

  await incrementAnalytics(chatId, "linksDeleted");

  if (settings.moderation.muteOnSpam && warnCount >= 3) {
    await applyMute(ctx, chatId, userId, settings.moderation.muteDurationSecs ?? 300);
    await UserProfile.findOneAndUpdate({ chatId, userId }, { $set: { warnings: 0 } });
    await ctx
      .reply(`@${ctx.from?.username ?? "User"} has been muted for repeated link posting.`)
      .then((m) => setTimeout(() => ctx.api.deleteMessage(ctx.chat!.id, m.message_id), 8000))
      .catch(() => null);
  } else {
    await ctx
      .reply(`@${ctx.from?.username ?? "User"}, links are not allowed here. Warning ${warnCount}/3.`)
      .then((m) => setTimeout(() => ctx.api.deleteMessage(ctx.chat!.id, m.message_id), 8000))
      .catch(() => null);
  }
}
