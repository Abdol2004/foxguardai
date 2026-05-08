import { connectDB } from "@/lib/db";

async function getTickets() {
  await connectDB();
  const { Ticket } = await import("@/lib/models");
  return Ticket.find({ status: "open" }).sort({ createdAt: -1 }).lean() as Promise<any[]>;
}

export default async function AdminTicketsPage({ params }: { params: { secret: string } }) {
  const tickets = await getTickets();

  return (
    <div className="p-6">
      <h1 className="text-lg font-bold text-white mb-6">Open Tickets ({tickets.length})</h1>

      {tickets.length === 0 ? (
        <div className="bg-[#14141f] border border-white/5 rounded-xl p-10 text-center text-sm text-[#64748b]">
          No open tickets
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((t) => (
            <div key={String(t._id)} className="bg-[#14141f] border border-white/5 rounded-xl p-4">
              <p className="text-sm text-white mb-2 leading-relaxed">{t.question}</p>
              <div className="flex items-center gap-4 text-xs text-[#475569]">
                <span>@{t.username || "unknown"}</span>
                <span className="font-mono">{t.chatId}</span>
                <span>{new Date(t.createdAt).toLocaleDateString()}</span>
                <span className="ml-auto px-2 py-0.5 bg-yellow-400/10 text-yellow-400 rounded-full">open</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
