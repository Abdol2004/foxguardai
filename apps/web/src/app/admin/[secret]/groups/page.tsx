import { connectDB } from "@/lib/db";

async function getGroups() {
  await connectDB();
  const { GroupSettings } = await import("@/lib/models");
  return GroupSettings.find({}).sort({ createdAt: -1 }).lean() as Promise<any[]>;
}

export default async function AdminGroupsPage({ params }: { params: { secret: string } }) {
  const groups = await getGroups();

  return (
    <div className="p-6">
      <h1 className="text-lg font-bold text-white mb-6">All Groups ({groups.length})</h1>

      <div className="bg-[#14141f] border border-white/5 rounded-xl overflow-hidden">
        <div className="grid grid-cols-4 px-4 py-3 border-b border-white/5">
          {["Group", "Chat ID", "AI", "Moderation"].map((h) => (
            <span key={h} className="text-[11px] text-[#475569] uppercase tracking-wide">{h}</span>
          ))}
        </div>
        {groups.length === 0 && (
          <p className="text-xs text-[#475569] text-center py-8">No groups registered</p>
        )}
        {groups.map((g) => (
          <div key={String(g._id)} className="grid grid-cols-4 px-4 py-3 border-b border-white/5 last:border-0 hover:bg-white/2">
            <span className="text-sm text-white truncate">{g.chatTitle || "—"}</span>
            <span className="text-xs text-[#64748b] font-mono">{g.chatId}</span>
            <span className={`text-xs ${g.ai?.enabled ? "text-emerald-400" : "text-[#475569]"}`}>
              {g.ai?.enabled ? "On" : "Off"}
            </span>
            <span className={`text-xs ${g.moderation?.deleteLinks ? "text-emerald-400" : "text-[#475569]"}`}>
              {g.moderation?.deleteLinks ? "Active" : "Passive"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
