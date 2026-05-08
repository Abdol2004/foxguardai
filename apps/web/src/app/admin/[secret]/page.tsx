import Link from "next/link";
import { connectDB } from "@/lib/db";

async function getStats(secret: string) {
  await connectDB();
  const { GroupSettings, ModerationEvent, Ticket } = await import("@/lib/models");
  const { Owner } = await import("@/lib/models");

  const [groups, owners, modActions, openTickets] = await Promise.all([
    GroupSettings.countDocuments(),
    Owner.countDocuments(),
    ModerationEvent.countDocuments(),
    Ticket.countDocuments({ status: "open" }),
  ]);

  const recentGroups = await GroupSettings.find({})
    .sort({ createdAt: -1 })
    .limit(5)
    .lean() as any[];

  const recentTickets = await Ticket.find({ status: "open" })
    .sort({ createdAt: -1 })
    .limit(5)
    .lean() as any[];

  return { groups, owners, modActions, openTickets, recentGroups, recentTickets };
}

export default async function AdminPage({ params }: { params: { secret: string } }) {
  const s = await getStats(params.secret);
  const base = `/admin/${params.secret}`;

  const statCards = [
    { label: "Groups",       value: s.groups,      color: "text-[#f97316]" },
    { label: "Owners",       value: s.owners,      color: "text-blue-400" },
    { label: "Mod Actions",  value: s.modActions,  color: "text-red-400" },
    { label: "Open Tickets", value: s.openTickets, color: "text-yellow-400" },
  ];

  const navLinks = [
    { href: `${base}/groups`,    label: "Manage Groups" },
    { href: `${base}/users`,     label: "Manage Users" },
    { href: `${base}/tickets`,   label: "Open Tickets" },
    { href: `${base}/broadcast`, label: "Broadcast Message" },
  ];

  return (
    <div className="p-6">
      <h1 className="text-lg font-bold text-white mb-6">Overview</h1>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {statCards.map((c) => (
          <div key={c.label} className="bg-[#14141f] border border-white/5 rounded-xl p-4">
            <p className="text-[11px] text-[#64748b] uppercase tracking-wide mb-1">{c.label}</p>
            <p className={`text-3xl font-bold ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {navLinks.map((l) => (
          <Link key={l.href} href={l.href}
            className="bg-[#14141f] border border-white/5 hover:border-[#f97316]/30 rounded-xl p-4 text-sm text-[#94a3b8] hover:text-white transition-colors text-center">
            {l.label}
          </Link>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-[#14141f] border border-white/5 rounded-xl p-4">
          <p className="text-sm font-medium text-white mb-3">Recent Groups</p>
          <div className="space-y-2">
            {s.recentGroups.map((g: any) => (
              <div key={g._id} className="flex items-center justify-between">
                <span className="text-xs text-[#94a3b8] truncate">{g.chatTitle || g.chatId}</span>
                <span className="text-[10px] text-[#475569] font-mono ml-2">{g.chatId}</span>
              </div>
            ))}
            {s.recentGroups.length === 0 && <p className="text-xs text-[#475569]">No groups yet</p>}
          </div>
        </div>

        <div className="bg-[#14141f] border border-white/5 rounded-xl p-4">
          <p className="text-sm font-medium text-white mb-3">Recent Tickets</p>
          <div className="space-y-2">
            {s.recentTickets.map((t: any) => (
              <div key={t._id}>
                <p className="text-xs text-[#94a3b8] truncate">{t.question}</p>
                <p className="text-[10px] text-[#475569]">@{t.username} in {t.chatId}</p>
              </div>
            ))}
            {s.recentTickets.length === 0 && <p className="text-xs text-[#475569]">No open tickets</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
