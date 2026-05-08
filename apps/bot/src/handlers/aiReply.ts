import type { Context } from "grammy";
import { GroupSettings, Ticket, UserProfile } from "../db/models.js";
import { sendToConversation, sendSocial, askAI } from "../lib/aiClient.js";
import { incrementAnalytics, applyMute } from "../lib/helpers.js";

// Per-group message counter for rate limiting (in-memory, resets on restart)
const msgCounters = new Map<string, number>();

const GREETING_PATTERNS = /\b(hi|hello|hey|heyy|yo|sup|gm|good morning|good evening|gn|good night|howdy|what'?s up|wassup|salaam|salam|greetings|morning|evening)\b/i;
const QUESTION_PATTERNS = /\?|what is|what are|how do|how can|how to|when (is|will|does)|where (is|can)|who (is|are)|why (is|does)|tell me|explain|help me|i need|can you/i;

// Topics that are clearly NOT about the project — route directly to social AI
const PURE_SOCIAL_PATTERNS = /\b(movie|movies|film|films|anime|series|netflix|hulu|prime|watch|cinema|tv show|episode|season|weekend|holiday|vacation|food|eat|restaurant|recipe|cook|weather|sport|football|soccer|basketball|baseball|game|gaming|console|music|song|artist|album|playlist|book|reading|novel|travel|trip|tour|fashion|style|clothes|celebrity|relationship|dating|love|marriage|joke|funny|meme|laugh|lol|entertainment|recommend|suggestion|suggest)\b/i;

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

  // Short-circuit: if clearly a general life topic, skip project pipeline entirely
  const isClearlyGeneral = PURE_SOCIAL_PATTERNS.test(cleanText) &&
    !cleanText.toLowerCase().includes(projectName.toLowerCase());

  if (isClearlyGeneral && !isMentioned && !isReply) {
    const social = await sendSocial(cleanText, username);
    if (social?.reply) {
      await ctx.reply(social.reply, {
        reply_parameters: { message_id: ctx.message!.message_id },
      }).catch(() => null);
      await incrementAnalytics(chatId, "aiReplies");
    }
    return;
  }

  // When @mentioned with a general topic, still answer naturally (no project redirect)
  if (isClearlyGeneral && (isMentioned || isReply)) {
    const social = await sendSocial(cleanText, username);
    if (social?.reply) {
      await ctx.reply(social.reply, {
        reply_parameters: { message_id: ctx.message!.message_id },
      }).catch(() => null);
      await incrementAnalytics(chatId, "aiReplies");
    }
    return;
  }

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

  // For questions: try knowledge base first, fallback to conversation result
  if (isQuestion || isMentioned || isReply) {
    const rag = await askAI(chatId, cleanText);

    if (rag && !rag.escalate && rag.confidence >= 0.55) {
      // High-confidence RAG answer → use it
      await ctx.reply(rag.answer, {
        reply_parameters: { message_id: ctx.message.message_id },
        parse_mode: "HTML",
      }).catch(() => null);
      await incrementAnalytics(chatId, "aiReplies");
      return;
    }

    // Low confidence → use the conversation AI result (general knowledge)
    // Only escalate if the conversation result explicitly says it can't answer
    const cantAnswer = result.reply.toLowerCase().includes("don't have that info") ||
                       result.reply.toLowerCase().includes("check our official docs") ||
                       result.reply.toLowerCase().includes("ask an admin");

    if (cantAnswer && rag?.escalate) {
      await Ticket.create({ chatId, userId, username, question: cleanText, status: "open" });
      await ctx.reply(
        `I don't have that specific information yet. I've flagged it for an admin to answer.`,
        { reply_parameters: { message_id: ctx.message.message_id } }
      ).catch(() => null);
      return;
    }
  }

  await ctx.reply(result.reply, {
    reply_parameters: { message_id: ctx.message.message_id },
  }).catch(() => null);

  await incrementAnalytics(chatId, "aiReplies");
}
