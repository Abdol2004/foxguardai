import type { Context } from "grammy";
import { GroupSettings, ModerationEvent, UserProfile, Ticket } from "../db/models.js";
import { applyMute, applyBan } from "../lib/helpers.js";

async function isAdmin(ctx: Context): Promise<boolean> {
  if (!ctx.from || !ctx.chat) return false;
  const member = await ctx.getChatMember(ctx.from.id).catch(() => null);
  return member ? ["creator", "administrator"].includes(member.status) : false;
}

export async function cmdStart(ctx: Context) {
  if (ctx.chat?.type !== "private") return;
  const userId = ctx.from?.id;
  await ctx.reply(
    "<b>FoxGuard — Sentinel Fox</b>\n\n" +
      "I am your AI community moderator. Add me to a group as an admin and I will keep it safe.\n\n" +
      (userId ? `Your Telegram ID: <code>${userId}</code>\n\n` : "") +
      "Commands:\n" +
      "/myid — get your Telegram user ID\n" +
      "/setup — activate in a group\n" +
      "/warn — warn a user (reply)\n" +
      "/mute — mute a user (reply)\n" +
      "/ban — ban a user (reply)\n" +
      "/stats — group stats\n" +
      "/tickets — open support tickets",
    { parse_mode: "HTML" }
  );
}

export async function cmdMyId(ctx: Context) {
  const userId    = ctx.from?.id;
  const username  = ctx.from?.username ? `@${ctx.from.username}` : "";
  const firstName = ctx.from?.first_name ?? "";
  await ctx.reply(
    `<b>Your Telegram info</b>\n\n` +
      `Name: ${firstName}${username ? ` (${username})` : ""}\n` +
      `User ID: <code>${userId}</code>\n\n` +
      `Copy your ID and paste it in the FoxGuard dashboard to connect your account.`,
    { parse_mode: "HTML" }
  );
}

export async function cmdSetup(ctx: Context) {
  if (!ctx.chat || ctx.chat.type === "private") return;
  if (!(await isAdmin(ctx))) return ctx.reply("❌ Admins only.");

  const chatId = String(ctx.chat.id);
  await GroupSettings.findOneAndUpdate(
    { chatId },
    { $setOnInsert: { chatTitle: ctx.chat.title ?? "" } },
    { upsert: true }
  );
  await ctx.reply("🦊 FoxGuard is now active for this group! Configure via the dashboard.");
}

export async function cmdWarn(ctx: Context) {
  if (!ctx.chat || !(await isAdmin(ctx))) return;
  if (!ctx.message?.reply_to_message) return ctx.reply("Reply to a user to warn them.");

  const target = ctx.message.reply_to_message.from!;
  const chatId = String(ctx.chat.id);
  const userId = String(target.id);

  const profile = await UserProfile.findOneAndUpdate(
    { chatId, userId },
    { $inc: { warnings: 1 }, $setOnInsert: { username: target.username ?? "" } },
    { upsert: true, new: true }
  );

  await ModerationEvent.create({ chatId, userId, username: target.username ?? "", action: "warn" });

  await ctx.reply(
    `⚠️ @${target.username ?? target.first_name} has been warned. (${profile.warnings} warnings)`
  );
}

export async function cmdMute(ctx: Context) {
  if (!ctx.chat || !(await isAdmin(ctx))) return;
  if (!ctx.message?.reply_to_message) return ctx.reply("Reply to a user to mute them.");

  const target = ctx.message.reply_to_message.from!;
  const chatId = String(ctx.chat.id);
  await applyMute(ctx, chatId, String(target.id), 3600);
  await ctx.reply(`🔇 @${target.username ?? target.first_name} muted for 1 hour.`);
}

export async function cmdBan(ctx: Context) {
  if (!ctx.chat || !(await isAdmin(ctx))) return;
  if (!ctx.message?.reply_to_message) return ctx.reply("Reply to a user to ban them.");

  const target = ctx.message.reply_to_message.from!;
  const chatId = String(ctx.chat.id);
  await applyBan(ctx, chatId, String(target.id));
  await ctx.reply(`🚫 @${target.username ?? target.first_name} has been banned.`);
}

export async function cmdStats(ctx: Context) {
  if (!ctx.chat || !(await isAdmin(ctx))) return;

  const chatId = String(ctx.chat.id);
  const today = new Date().toISOString().split("T")[0]!;

  const [events, tickets] = await Promise.all([
    ModerationEvent.countDocuments({ chatId }),
    Ticket.countDocuments({ chatId, status: "open" }),
  ]);

  await ctx.reply(
    `🦊 <b>FoxGuard Stats</b>\n\n` +
      `📊 Total mod actions: ${events}\n` +
      `🎫 Open tickets: ${tickets}\n` +
      `📅 Date: ${today}`,
    { parse_mode: "HTML" }
  );
}

export async function cmdTickets(ctx: Context) {
  if (!ctx.chat || !(await isAdmin(ctx))) return;

  const chatId = String(ctx.chat.id);
  const openTickets = await Ticket.find({ chatId, status: "open" }).limit(5).lean();

  if (!openTickets.length) {
    return ctx.reply("✅ No open tickets.");
  }

  const lines = openTickets.map(
    (t, i) => `${i + 1}. @${t.username || "unknown"}: ${t.question.slice(0, 60)}`
  );
  await ctx.reply(`🎫 <b>Open Tickets:</b>\n\n${lines.join("\n")}`, { parse_mode: "HTML" });
}
