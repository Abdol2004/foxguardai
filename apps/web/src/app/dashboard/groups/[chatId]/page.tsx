import { connectDB } from "@/lib/db";

async function getGroupStats(chatId: string) {
  await connectDB();
  const { Analytics, ModerationEvent, Ticket } = await import("@/lib/models");
  const today = new Date().toISOString().split("T")[0]!;
  const [snap, totalEvents, openTickets] = await Promise.all([
    Analytics.findOne({ chatId, date: today }).lean() as Promise<Record<string, any> | null>,
    ModerationEvent.countDocuments({ chatId }),
    Ticket.countDocuments({ chatId, status: "open" }),
  ]);
  return {
    messages:   (snap?.totalMessages as number) ?? 0,
    spam:       ((snap?.spamDeleted as number) ?? 0) + ((snap?.linksDeleted as number) ?? 0) + ((snap?.scamDeleted as number) ?? 0),
    aiReplies:  (snap?.aiReplies as number) ?? 0,
    newMembers: (snap?.newMembers as number) ?? 0,
    totalEvents,
    openTickets,
  };
}

export default async function GroupOverviewPage({
  params,
}: {
  params: { chatId: string };
}) {
  const chatId = decodeURIComponent(params.chatId);
  const s = await getGroupStats(chatId);

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
      <p className="text-xs text-[#64748b] mb-4">Today's activity</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {cards.map((c) => (
          <div key={c.label} className="bg-[#14141f] border border-white/5 rounded-xl p-4">
            <p className="text-[11px] text-[#64748b] uppercase tracking-wide mb-2">{c.label}</p>
            <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
