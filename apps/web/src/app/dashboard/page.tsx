import { connectDB } from "@/lib/db";

async function getStats() {
  await connectDB();
  const { Analytics, ModerationEvent, Ticket } = await import("@/lib/models");

  const today = new Date().toISOString().split("T")[0]!;
  const [todaySnaps, totalEvents, openTickets] = await Promise.all([
    Analytics.find({ date: today }).lean(),
    ModerationEvent.countDocuments(),
    Ticket.countDocuments({ status: "open" }),
  ]);

  return todaySnaps.reduce(
    (acc, s) => ({
      messages:   acc.messages   + (s.totalMessages ?? 0),
      spam:       acc.spam       + (s.spamDeleted ?? 0) + (s.linksDeleted ?? 0) + (s.scamDeleted ?? 0),
      aiReplies:  acc.aiReplies  + (s.aiReplies ?? 0),
      newMembers: acc.newMembers + (s.newMembers ?? 0),
      totalEvents,
      openTickets,
    }),
    { messages: 0, spam: 0, aiReplies: 0, newMembers: 0, totalEvents, openTickets }
  );
}

export default async function DashboardPage() {
  const s = await getStats();

  const cards = [
    { label: "Messages today",  value: s.messages,    color: "text-white" },
    { label: "Spam removed",    value: s.spam,        color: "text-red-400" },
    { label: "AI replies",      value: s.aiReplies,   color: "text-blue-400" },
    { label: "New members",     value: s.newMembers,  color: "text-emerald-400" },
    { label: "Total mod actions", value: s.totalEvents, color: "text-[#f97316]" },
    { label: "Open tickets",    value: s.openTickets, color: "text-yellow-400" },
  ];

  return (
    <div className="p-4 md:p-6 animate-in">
      <div className="mb-5">
        <h1 className="text-base font-semibold text-white">Overview</h1>
        <p className="text-xs text-[#64748b] mt-0.5">Today across all groups</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {cards.map((c) => (
          <div
            key={c.label}
            className="bg-[#14141f] border border-white/5 rounded-xl p-4"
          >
            <p className="text-[11px] text-[#64748b] mb-2 uppercase tracking-wide">{c.label}</p>
            <p className={`text-2xl font-bold ${c.color}`}>{c.value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 bg-[#14141f] border border-white/5 rounded-xl p-4">
        <h2 className="text-sm font-medium text-white mb-3">System status</h2>
        <div className="space-y-2">
          {[
            { label: "Sentinel Fox",  status: "Active" },
            { label: "MongoDB",       status: "Connected" },
            { label: "AI Service",    status: "Running" },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between py-1">
              <span className="text-sm text-[#94a3b8]">{row.label}</span>
              <span className="flex items-center gap-1.5 text-xs text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                {row.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
