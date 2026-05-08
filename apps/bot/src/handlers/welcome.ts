import type { Context } from "grammy";
import { GroupSettings } from "../db/models.js";
import { incrementAnalytics, formatWelcome } from "../lib/helpers.js";

export async function handleNewMember(ctx: Context) {
  if (!ctx.message?.new_chat_members || !ctx.chat) return;

  const chatId = String(ctx.chat.id);

  // Auto-create settings if the bot was added to the group without /setup
  const settings = await GroupSettings.findOneAndUpdate(
    { chatId },
    { $setOnInsert: { chatTitle: ctx.chat.title ?? "" } },
    { upsert: true, new: true }
  );

  if (!settings.welcome?.enabled) return;

  for (const member of ctx.message.new_chat_members) {
    if (member.is_bot) continue;

    const userName  = member.username ? `@${member.username}` : member.first_name;
    const firstName = member.first_name ?? member.username ?? "";
    const userId    = String(member.id);
    const groupName = ctx.chat.title ?? "the group";

    const text = formatWelcome(
      settings.welcome.message,
      groupName,
      userName,
      firstName,
      userId
    );

    const sent = await ctx.reply(text, { parse_mode: "HTML" }).catch(() => null);
    if (sent && settings.welcome.deleteAfterSecs > 0) {
      setTimeout(
        () => ctx.api.deleteMessage(ctx.chat!.id, sent.message_id).catch(() => null),
        settings.welcome.deleteAfterSecs * 1000
      );
    }

    await incrementAnalytics(chatId, "newMembers");
  }
}
