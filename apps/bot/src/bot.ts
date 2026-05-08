import { Bot, session } from "grammy";
import { config } from "./config.js";
import { antiLinkMiddleware } from "./middlewares/antiLink.js";
import { antiScamMiddleware } from "./middlewares/antiScam.js";
import { floodProtectionMiddleware } from "./middlewares/floodProtection.js";
import { handleNewMember } from "./handlers/welcome.js";
import { handleAiReply } from "./handlers/aiReply.js";
import {
  cmdStart,
  cmdMyId,
  cmdSetup,
  cmdWarn,
  cmdMute,
  cmdBan,
  cmdStats,
  cmdTickets,
} from "./handlers/commands.js";
import { incrementAnalytics } from "./lib/helpers.js";

export function createBot() {
  const bot = new Bot(config.telegram.token);

  // ─── Global message counter ───────────────────────────────────────────────
  bot.on("message", async (ctx, next) => {
    if (ctx.chat?.type !== "private") {
      await incrementAnalytics(String(ctx.chat?.id), "totalMessages");
    }
    return next();
  });

  // ─── Moderation middleware chain ──────────────────────────────────────────
  bot.on("message:text", floodProtectionMiddleware);
  bot.on("message:text", antiScamMiddleware);
  bot.on(["message:text", "message:caption"], antiLinkMiddleware);

  // ─── Member events ────────────────────────────────────────────────────────
  bot.on("message:new_chat_members", handleNewMember);

  // ─── Commands ─────────────────────────────────────────────────────────────
  bot.command("start", cmdStart);
  bot.command("myid", cmdMyId);
  bot.command("setup", cmdSetup);
  bot.command("warn", cmdWarn);
  bot.command("mute", cmdMute);
  bot.command("ban", cmdBan);
  bot.command("stats", cmdStats);
  bot.command("tickets", cmdTickets);

  // ─── AI replies ───────────────────────────────────────────────────────────
  bot.on("message:text", handleAiReply);

  // ─── Error handling ───────────────────────────────────────────────────────
  bot.catch((err) => {
    console.error("[Bot Error]", err.message, err.ctx?.update);
  });

  return bot;
}
