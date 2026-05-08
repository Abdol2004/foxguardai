import { connectDB } from "@/lib/db";

async function getTickets(chatId: string) {
  await connectDB();
  const { Ticket } = await import("@/lib/models");
  return Ticket.find({ chatId, status: "open" }).sort({ createdAt: -1 }).limit(50).lean();
}

export default async function GroupTicketsPage({ params }: { params: { chatId: string } }) {
  const chatId = decodeURIComponent(params.chatId);
  const tickets = await getTickets(chatId);

  return (
    <div className="p-4 md:p-6 animate-in">
      <h1 className="text-base font-semibold text-white mb-1">Tickets</h1>
      <p className="text-xs text-[#64748b] mb-5">Questions the AI could not answer — need your reply</p>

      {tickets.length === 0 ? (
        <div className="bg-[#14141f] border border-white/5 rounded-xl p-8 text-center text-sm text-[#64748b]">
          No open tickets
        </div>
      ) : (
        <div className="space-y-2">
          {tickets.map((t) => (
            <div key={String(t._id)} className="bg-[#14141f] border border-white/5 rounded-xl p-4">
              <p className="text-sm text-white mb-2 leading-relaxed">{t.question}</p>
              <div className="flex items-center gap-3 text-xs text-[#475569]">
                <span>@{t.username || "unknown"}</span>
                <span>{new Date(t.createdAt as Date).toLocaleDateString()}</span>
                <span className="ml-auto px-2 py-0.5 bg-yellow-400/10 text-yellow-400 rounded-full">open</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
