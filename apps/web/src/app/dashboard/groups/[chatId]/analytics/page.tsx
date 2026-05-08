import { connectDB } from "@/lib/db";

async function getLast7Days(chatId: string) {
  await connectDB();
  const { Analytics } = await import("@/lib/models");
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split("T")[0]!);
  }
  const snaps = await Analytics.find({ chatId, date: { $in: days } }).lean();
  return days.map((date) => {
    const snap = snaps.find((s) => s.date === date);
    return {
      date,
      messages: snap?.totalMessages ?? 0,
      spam: (snap?.spamDeleted ?? 0) + (snap?.linksDeleted ?? 0) + (snap?.scamDeleted ?? 0),
      ai: snap?.aiReplies ?? 0,
    };
  });
}

export default async function GroupAnalyticsPage({ params }: { params: { chatId: string } }) {
  const chatId = decodeURIComponent(params.chatId);
  const data = await getLast7Days(chatId);
  const maxMsg = Math.max(...data.map((d) => d.messages), 1);

  return (
    <div className="p-4 md:p-6 animate-in">
      <h1 className="text-base font-semibold text-white mb-1">Analytics</h1>
      <p className="text-xs text-[#64748b] mb-5">Last 7 days</p>

      <div className="bg-[#14141f] border border-white/5 rounded-xl p-4 mb-4">
        <p className="text-xs text-[#64748b] mb-4">Messages per day</p>
        <div className="flex items-end gap-1.5 h-24">
          {data.map((d) => (
            <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full bg-[#f97316] rounded-sm min-h-[2px]" style={{ height: `${(d.messages / maxMsg) * 100}%` }} />
              <span className="text-[9px] text-[#475569]">{d.date.slice(5)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[#14141f] border border-white/5 rounded-xl overflow-hidden">
        <div className="grid grid-cols-4 px-4 py-2 border-b border-white/5">
          {["Date", "Msgs", "Spam", "AI"].map((h) => (
            <span key={h} className="text-[11px] text-[#475569] uppercase tracking-wide">{h}</span>
          ))}
        </div>
        {data.map((d) => (
          <div key={d.date} className="grid grid-cols-4 px-4 py-3 border-b border-white/5 last:border-0">
            <span className="text-xs text-[#94a3b8]">{d.date.slice(5)}</span>
            <span className="text-xs text-white">{d.messages}</span>
            <span className="text-xs text-red-400">{d.spam}</span>
            <span className="text-xs text-blue-400">{d.ai}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
