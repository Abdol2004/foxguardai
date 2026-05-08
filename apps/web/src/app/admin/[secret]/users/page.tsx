import { connectDB } from "@/lib/db";

async function getUsers() {
  await connectDB();
  const { UserProfile } = await import("@/lib/models");
  return UserProfile.find({}).sort({ warnings: -1 }).limit(100).lean() as Promise<any[]>;
}

export default async function AdminUsersPage({ params }: { params: { secret: string } }) {
  const users = await getUsers();
  const banned  = users.filter((u) => u.banned).length;
  const warned  = users.filter((u) => u.warnings > 0).length;

  return (
    <div className="p-6">
      <div className="flex items-center gap-6 mb-6">
        <h1 className="text-lg font-bold text-white">Users ({users.length})</h1>
        <span className="text-xs text-red-400">{banned} banned</span>
        <span className="text-xs text-yellow-400">{warned} warned</span>
      </div>

      <div className="bg-[#14141f] border border-white/5 rounded-xl overflow-hidden">
        <div className="grid grid-cols-5 px-4 py-3 border-b border-white/5">
          {["Username", "User ID", "Group", "Warnings", "Status"].map((h) => (
            <span key={h} className="text-[11px] text-[#475569] uppercase tracking-wide">{h}</span>
          ))}
        </div>
        {users.map((u) => (
          <div key={String(u._id)} className="grid grid-cols-5 px-4 py-3 border-b border-white/5 last:border-0">
            <span className="text-sm text-white">@{u.username || "—"}</span>
            <span className="text-xs text-[#64748b] font-mono">{u.userId}</span>
            <span className="text-xs text-[#64748b] font-mono truncate">{u.chatId}</span>
            <span className={`text-xs font-medium ${u.warnings >= 3 ? "text-red-400" : u.warnings > 0 ? "text-yellow-400" : "text-[#475569]"}`}>
              {u.warnings}
            </span>
            <span className={`text-xs ${u.banned ? "text-red-400" : u.muted ? "text-orange-400" : "text-emerald-400"}`}>
              {u.banned ? "Banned" : u.muted ? "Muted" : "OK"}
            </span>
          </div>
        ))}
        {users.length === 0 && <p className="text-xs text-[#475569] text-center py-8">No users yet</p>}
      </div>
    </div>
  );
}
