import type { Context } from "grammy";
import { GroupSettings, Ticket } from "../db/models.js";
import { askAI } from "../lib/aiClient.js";
import { incrementAnalytics } from "../lib/helpers.js";

const MENTION_OR_REPLY_THRESHOLD = 0.4;

export async function handleAiReply(ctx: Context) {
  if (!ctx.message || !ctx.chat || ctx.chat.type === "private") return;

  const text = ctx.message.text ?? "";
  if (!text.trim()) return;

  const chatId = String(ctx.chat.id);
  const settings = await GroupSettings.findOne({ chatId }).lean();

  if (!settings?.ai?.enabled || !settings.projectId) return;

  const botInfo = await ctx.api.getMe();
  const isMentioned = text.includes(`@${botInfo.username}`);
  const isReply = ctx.message.reply_to_message?.from?.id === botInfo.id;

  if (!isMentioned && !isReply) return;

  const question = text.replace(`@${botInfo.username}`, "").trim();
  if (!question) return;

  await ctx.api.sendChatAction(ctx.chat.id, "typing").catch(() => null);

  const result = await askAI(
    String(settings.projectId),
    question,
    settings.ai.language ?? "en"
  ).catch(() => null);

  if (!result) {
    await ctx.reply("🦊 I'm having trouble fetching an answer right now. Please try again.", {
      reply_parameters: { message_id: ctx.message.message_id },
    });
    return;
  }

  if (result.escalate || result.confidence < MENTION_OR_REPLY_THRESHOLD) {
    await Ticket.create({
      chatId,
      userId: String(ctx.from?.id ?? ""),
      username: ctx.from?.username ?? "",
      question,
      status: "open",
    });
    await ctx.reply(
      "🦊 I'm not fully sure about this one. I've flagged it for a human admin to follow up.",
      { reply_parameters: { message_id: ctx.message.message_id } }
    );
    return;
  }

  await ctx.reply(`🦊 ${result.answer}`, {
    reply_parameters: { message_id: ctx.message.message_id },
    parse_mode: "HTML",
  });

  await incrementAnalytics(chatId, "aiReplies");
}
