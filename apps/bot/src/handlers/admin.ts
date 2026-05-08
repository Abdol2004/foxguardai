import type { Context } from "grammy";
import { config } from "../config.js";
import { GroupSettings, ModerationEvent, UserProfile, Ticket } from "../db/models.js";

function isOwner(ctx: Context): boolean {
  return String(ctx.from?.id) === config.ownerId;
}

export async function cmdAdmin(ctx: Context) {
  if (!isOwner(ctx)) return; // silently ignore non-owners

  const args = ctx.message?.text?.split(" ").slice(1) ?? [];
  const sub  = args[0]?.toLowerCase();

  // ── /admin broadcast <message> ───────────────────────────────────────────
  if (sub === "broadcast") {
    const message = args.slice(1).join(" ");
    if (!message) return ctx.reply("Usage: /admin broadcast Your message here");

    const groups = await GroupSettings.find({}).select("chatId").lean();
    let sent = 0;
    for (const g of groups) {
      await ctx.api.sendMessage(Number(g.chatId), message).catch(() => null);
      sent++;
    }
    return ctx.reply(`Broadcast sent to ${sent} groups.`);
  }

  // ── /admin groups ─────────────────────────────────────────────────────────
  if (sub === "groups") {
    const groups = await GroupSettings.find({}).lean();
    if (!groups.length) return ctx.reply("No groups registered.");
    const lines = groups.map((g, i) => `${i + 1}. ${(g as any).chatTitle || g.chatId} (${g.chatId})`);
    return ctx.reply(
      `<b>Registered Groups (${groups.length})</b>\n\n${lines.slice(0, 20).join("\n")}`,
      { parse_mode: "HTML" }
    );
  }

  // ── /admin users [search] ─────────────────────────────────────────────────
  if (sub === "users") {
    const search = args[1];
    const query  = search ? { username: { $regex: search, $options: "i" } } : {};
    const users  = await UserProfile.find(query).sort({ createdAt: -1 }).limit(15).lean();
    if (!users.length) return ctx.reply("No users found.");
    const lines = users.map((u) =>
      `@${u.username || "unknown"} | ID: ${u.userId} | Warns: ${u.warnings} | Muted: ${u.muted} | Banned: ${u.banned}`
    );
    return ctx.reply(
      `<b>Users</b>\n\n<code>${lines.join("\n")}</code>`,
      { parse_mode: "HTML" }
    );
  }

  // ── /admin ban <userId> ───────────────────────────────────────────────────
  if (sub === "ban") {
    const userId = args[1];
    if (!userId) return ctx.reply("Usage: /admin ban <userId>");
    await UserProfile.updateMany({ userId }, { $set: { banned: true } });
    return ctx.reply(`User ${userId} marked as banned across all groups.`);
  }

  // ── /admin unban <userId> ─────────────────────────────────────────────────
  if (sub === "unban") {
    const userId = args[1];
    if (!userId) return ctx.reply("Usage: /admin unban <userId>");
    await UserProfile.updateMany({ userId }, { $set: { banned: false, warnings: 0 } });
    return ctx.reply(`User ${userId} unbanned.`);
  }

  // ── /admin tickets ────────────────────────────────────────────────────────
  if (sub === "tickets") {
    const tickets = await Ticket.find({ status: "open" }).sort({ createdAt: -1 }).limit(10).lean();
    if (!tickets.length) return ctx.reply("No open tickets.");
    const lines = tickets.map(
      (t, i) => `${i + 1}. @${t.username || "?"} in ${t.chatId}:\n   ${t.question.slice(0, 80)}`
    );
    return ctx.reply(
      `<b>Open Tickets (${tickets.length})</b>\n\n${lines.join("\n\n")}`,
      { parse_mode: "HTML" }
    );
  }

  // ── /admin stats (default) ────────────────────────────────────────────────
  const [groups, users, modActions, openTickets] = await Promise.all([
    GroupSettings.countDocuments(),
    UserProfile.countDocuments(),
    ModerationEvent.countDocuments(),
    Ticket.countDocuments({ status: "open" }),
  ]);

  await ctx.reply(
    `<b>FoxGuard Admin Panel</b>\n\n` +
      `Groups:      <code>${groups}</code>\n` +
      `Users:       <code>${users}</code>\n` +
      `Mod actions: <code>${modActions}</code>\n` +
      `Open tickets:<code>${openTickets}</code>\n\n` +
      `<b>Commands:</b>\n` +
      `/admin groups — list all groups\n` +
      `/admin users [search] — list users\n` +
      `/admin ban &lt;userId&gt; — ban user globally\n` +
      `/admin unban &lt;userId&gt; — unban user\n` +
      `/admin tickets — open tickets\n` +
      `/admin broadcast &lt;msg&gt; — message all groups`,
    { parse_mode: "HTML" }
  );
}
