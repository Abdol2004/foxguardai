"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Settings, Zap, Trash2, ChevronRight } from "lucide-react";
import { useOwner } from "@/hooks/useOwner";
import { LoadingButton } from "@/components/LoadingButton";
import { Spinner } from "@/components/Spinner";
import toast from "react-hot-toast";

function ConnectScreen({ onConnect }: { onConnect: (id: string) => Promise<void> }) {
  const [telegramId, setTelegramId] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!telegramId.trim()) return;
    setLoading(true);
    await onConnect(telegramId.trim());
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <p className="text-2xl font-bold text-white mb-2">Welcome to FoxGuard</p>
          <p className="text-sm text-[#64748b]">Enter your Telegram user ID to get started</p>
        </div>
        <div className="bg-[#14141f] border border-white/5 rounded-xl p-5 space-y-4">
          <div>
            <label className="text-xs text-[#94a3b8] block mb-2">Your Telegram User ID</label>
            <input
              value={telegramId}
              onChange={(e) => setTelegramId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="123456789"
              className="w-full bg-[#0d0d14] border border-white/5 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-[#f97316]/40"
            />
            <p className="text-[11px] text-[#475569] mt-1.5">
              Find your ID by messaging @userinfobot on Telegram
            </p>
          </div>
          <LoadingButton loading={loading} onClick={submit} className="w-full py-2.5">
            Connect account
          </LoadingButton>
        </div>
      </div>
    </div>
  );
}

function AddGroupModal({
  onAdd,
  onClose,
}: {
  onAdd: (chatId: string, title: string, type: string) => Promise<void>;
  onClose: () => void;
}) {
  const [username, setUsername] = useState("");
  const [searching, setSearching] = useState(false);
  const [found, setFound] = useState<{ id: number; title: string; type: string } | null>(null);
  const [adding, setAdding] = useState(false);

  async function search() {
    if (!username.trim()) return;
    setSearching(true);
    setFound(null);
    const res = await fetch(`/api/telegram/chat-id?username=${encodeURIComponent(username.trim())}`);
    const data = await res.json();
    setSearching(false);
    if (!res.ok) toast.error(data.error ?? "Group not found. Make sure the bot is a member.");
    else setFound(data);
  }

  async function add() {
    if (!found) return;
    setAdding(true);
    await onAdd(String(found.id), found.title, found.type);
    setAdding(false);
    onClose();
    toast.success(`${found.title} added`);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60">
      <div className="w-full max-w-sm bg-[#14141f] border border-white/5 rounded-2xl p-5">
        <p className="font-semibold text-white mb-1">Add a group or channel</p>
        <p className="text-xs text-[#64748b] mb-4">The bot must be an admin in the group first</p>

        <div className="flex gap-2 mb-4">
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && search()}
            placeholder="@mycommunity"
            className="flex-1 bg-[#0d0d14] border border-white/5 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[#f97316]/40"
          />
          <LoadingButton loading={searching} onClick={search} className="px-4 py-2">
            Search
          </LoadingButton>
        </div>

        {found && (
          <div className="bg-[#0d0d14] border border-white/5 rounded-xl p-3 mb-4">
            <p className="text-sm font-medium text-white">{found.title}</p>
            <p className="text-xs text-[#64748b] capitalize">{found.type} · {found.id}</p>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2 text-sm text-[#64748b] border border-white/5 rounded-xl"
          >
            Cancel
          </button>
          {found && (
            <LoadingButton loading={adding} onClick={add} className="flex-1 py-2">
              Add group
            </LoadingButton>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { owner, loading, connect, addGroup, removeGroup } = useOwner();
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);
  const [activating, setActivating] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner className="w-6 h-6 text-[#f97316]" />
      </div>
    );
  }

  if (!owner) return <ConnectScreen onConnect={(id) => connect(id)} />;

  async function activate(chatId: string) {
    setActivating(chatId);
    const res = await fetch(`/api/groups/${chatId}/activate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ telegramId: owner!.telegramId }),
    });
    const data = await res.json();
    setActivating(null);
    if (!res.ok) toast.error(data.error);
    else {
      toast.success("Activation message sent to group");
      // refresh owner
      connect(owner!.telegramId, owner!.username, owner!.firstName);
    }
  }

  return (
    <div className="p-4 md:p-6 animate-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-base font-semibold text-white">My Groups</h1>
          <p className="text-xs text-[#64748b] mt-0.5">
            {owner.firstName || owner.username || `ID ${owner.telegramId}`}
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 px-3 py-2 bg-[#f97316] text-white text-sm rounded-xl font-medium"
        >
          <Plus size={15} />
          Add group
        </button>
      </div>

      {/* Groups */}
      {owner.groups.length === 0 ? (
        <div className="bg-[#14141f] border border-white/5 border-dashed rounded-2xl p-10 text-center">
          <p className="text-sm text-white font-medium mb-1">No groups yet</p>
          <p className="text-xs text-[#64748b] mb-4">Add your first group or channel to get started</p>
          <button
            onClick={() => setShowAdd(true)}
            className="px-5 py-2 bg-[#f97316] text-white text-sm rounded-xl font-medium"
          >
            Add group
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {owner.groups.map((g) => (
            <div key={g.chatId} className="bg-[#14141f] border border-white/5 rounded-xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium text-white truncate">{g.title || g.chatId}</p>
                    {g.activated ? (
                      <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] rounded-full flex-shrink-0">
                        Active
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 bg-yellow-500/10 text-yellow-400 text-[10px] rounded-full flex-shrink-0">
                        Inactive
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#475569] capitalize">{g.type} · {g.chatId}</p>
                </div>
              </div>

              <div className="flex gap-2 mt-3">
                {!g.activated && (
                  <LoadingButton
                    loading={activating === g.chatId}
                    onClick={() => activate(g.chatId)}
                    className="flex-1 py-2 text-xs"
                  >
                    <Zap size={13} />
                    Activate group
                  </LoadingButton>
                )}
                <button
                  onClick={() => router.push(`/dashboard/groups/${encodeURIComponent(g.chatId)}`)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs text-[#94a3b8] border border-white/5 rounded-xl hover:text-white transition-colors"
                >
                  <Settings size={13} />
                  Manage
                </button>
                <button
                  onClick={() => removeGroup(g.chatId)}
                  className="p-2 text-[#475569] border border-white/5 rounded-xl hover:text-red-400 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <AddGroupModal onAdd={addGroup} onClose={() => setShowAdd(false)} />
      )}
    </div>
  );
}
