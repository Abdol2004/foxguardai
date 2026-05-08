import type { Context } from "grammy";
import { GroupSettings, Ticket, UserProfile } from "../db/models.js";
import { sendToConversation, askAI } from "../lib/aiClient.js";
import { incrementAnalytics, applyMute } from "../lib/helpers.js";

// Per-group message counter for rate limiting (in-memory, resets on restart)
const msgCounters = new Map<string, number>();

// Greetings that should always get a reply
const GREETING_PATTERNS = /\b(hi|hello|hey|heyy|heyyyy|yo|sup|gm|good morning|good evening|gn|good night|howdy|what'?s up|wassup|salaam|salam|greetings|morning|evening)\b/i;

// Direct question patterns
const QUESTION_PATTERNS = /\?|what is|what are|how do|how can|how to|when (is|will|does)|where (is|can)|who (is|are)|why (is|does)|tell me|explain|help me|i need|can you/i;

export async function handleConversation(ctx: Context) {
  if (!ctx.message?.text || !ctx.chat || ctx.chat.type === "private") return;

  const text     = ctx.message.text.trim();
  const chatId   = String(ctx.chat.id);
  const userId   = String(ctx.from?.id ?? "");
  const username = ctx.from?.username ?? ctx.from?.first_name ?? "User";

  if (!text || text.startsWith("/")) return;

  const settings = await GroupSettings.findOne({ chatId }).lean();
  if (!settings?.ai?.enabled) return;

  const projectName = (settings as any).chatTitle || ctx.chat.title || chatId;

  // Skip admins to avoid annoying them
  const member = await ctx.getChatMember(ctx.from!.id).catch(() => null);
  const isAdmin = member ? ["creator", "administrator"].includes(member.status) : false;

  const botInfo = await ctx.api.getMe();
  const isMentioned = text.includes(`@${botInfo.username}`);
  const isReply = ctx.message.reply_to_message?.from?.id === botInfo.id;

  const isGreeting  = GREETING_PATTERNS.test(text);
  const isQuestion  = QUESTION_PATTERNS.test(text) || text.endsWith("?");

  const replyMode      = (settings.ai as any)?.replyMode ?? "all";
  const replyFrequency = (settings.ai as any)?.replyFrequency ?? 6;

  // Rate limiting for general messages
  const count = (msgCounters.get(chatId) ?? 0) + 1;
  msgCounters.set(chatId, count);
  const respondToGeneral = replyMode === "all" && count % replyFrequency === 0;

  const shouldProcess =
    isMentioned ||
    isReply ||
    (replyMode === "all" && isGreeting) ||
    (replyMode === "all" && isQuestion) ||
    (!isAdmin && respondToGeneral);

  if (!shouldProcess) return;

  await ctx.api.sendChatAction(ctx.chat.id, "typing").catch(() => null);

  const cleanText = text.replace(`@${botInfo.username}`, "").trim();
  const result = await sendToConversation(chatId, projectName, cleanText, username);

  if (!result) return;

  // Toxic content — warn and potentially mute
  if (result.action === "warn") {
    if (!isAdmin) {
      await ctx.deleteMessage().catch(() => null);

      const profile = await UserProfile.findOneAndUpdate(
        { chatId, userId },
        { $inc: { warnings: 1 }, $setOnInsert: { username } },
        { upsert: true, new: true }
      );

      const warnCount = Math.min(profile.warnings, 3);

      if (warnCount >= 3 && settings.moderation?.muteOnSpam) {
        await applyMute(ctx, chatId, userId, settings.moderation.muteDurationSecs ?? 300);
        // Reset warnings after mute so counter starts fresh
        await UserProfile.findOneAndUpdate({ chatId, userId }, { $set: { warnings: 0 } });
        await ctx.reply(`@${username} has been muted for repeated violations.`)
          .then(m => setTimeout(() => ctx.api.deleteMessage(ctx.chat!.id, m.message_id).catch(() => null), 8000))
          .catch(() => null);
      } else {
        await ctx.reply(
          `@${username}, please keep this chat respectful. Warning ${warnCount}/3.`
        )
          .then(m => setTimeout(() => ctx.api.deleteMessage(ctx.chat!.id, m.message_id).catch(() => null), 8000))
          .catch(() => null);
      }

      await incrementAnalytics(chatId, "scamDeleted");
    }
    return;
  }

  if (!result.reply) return;

  // For direct questions with low confidence → escalate to ticket
  if (isQuestion && result.message_type === "question") {
    const rag = await askAI(chatId, cleanText);
    if (rag) {
      if (rag.escalate || rag.confidence < 0.4) {
        await Ticket.create({ chatId, userId, username, question: cleanText, status: "open" });
        await ctx.reply(
          `Good question! I've flagged this for an admin to answer properly.`,
          { reply_parameters: { message_id: ctx.message.message_id } }
        ).catch(() => null);
        return;
      }
      await ctx.reply(rag.answer, {
        reply_parameters: { message_id: ctx.message.message_id },
        parse_mode: "HTML",
      }).catch(() => null);
      await incrementAnalytics(chatId, "aiReplies");
      return;
    }
  }

  await ctx.reply(result.reply, {
    reply_parameters: { message_id: ctx.message.message_id },
  }).catch(() => null);

  await incrementAnalytics(chatId, "aiReplies");
}
