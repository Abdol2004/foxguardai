"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import toast from "react-hot-toast";
import { LoadingButton } from "@/components/LoadingButton";

export default function GroupWelcomePage() {
  const params = useParams();
  const chatId = decodeURIComponent(params.chatId as string);

  const [enabled, setEnabled] = useState(true);
  const [message, setMessage] = useState(
    "Welcome to {group_name}, {user_name}! Please read the rules before posting."
  );
  const [deleteAfterSecs, setDeleteAfterSecs] = useState(60);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/groups/${encodeURIComponent(chatId)}/settings`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.welcome) {
          setEnabled(data.welcome.enabled ?? true);
          setMessage(data.welcome.message ?? message);
          setDeleteAfterSecs(data.welcome.deleteAfterSecs ?? 60);
        }
        setLoading(false);
      });
  }, [chatId]);

  async function save() {
    setSaving(true);
    const res = await fetch(`/api/groups/${encodeURIComponent(chatId)}/settings`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ welcome: { enabled, message, deleteAfterSecs } }),
    });
    setSaving(false);
    res.ok ? toast.success("Welcome settings saved") : toast.error("Failed");
  }

  const preview = message
    .replace("{group_name}", "Your Community")
    .replace("{user_name}", "@newmember");

  return (
    <div className="p-4 md:p-6 animate-in max-w-lg">
      <h1 className="text-base font-semibold text-white mb-1">Welcome Message</h1>
      <p className="text-xs text-[#64748b] mb-5">Sent when a new member joins the group</p>

      <div className="space-y-3">
        {/* Toggle */}
        <div className="bg-[#14141f] border border-white/5 rounded-xl px-4 py-3 flex items-center justify-between">
          <span className="text-sm text-[#cbd5e1]">Send welcome message</span>
          <button
            onClick={() => setEnabled(!enabled)}
            className={`w-10 h-5 rounded-full relative transition-colors ${enabled ? "bg-[#f97316]" : "bg-white/10"}`}
          >
            <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow ${enabled ? "translate-x-5" : "translate-x-0.5"}`} />
          </button>
        </div>

        {/* Message editor */}
        <div className="bg-[#14141f] border border-white/5 rounded-xl p-4">
          <label className="text-xs text-[#94a3b8] block mb-2">Message text</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            className="w-full bg-[#0d0d14] border border-white/5 rounded-lg px-3 py-2 text-sm text-white outline-none resize-none mb-2"
          />
          <p className="text-[11px] text-[#475569]">
            Use <code className="text-[#f97316]">{"{group_name}"}</code> and <code className="text-[#f97316]">{"{user_name}"}</code> as placeholders
          </p>
        </div>

        {/* Delete after */}
        <div className="bg-[#14141f] border border-white/5 rounded-xl p-4">
          <label className="text-xs text-[#94a3b8] block mb-2">Delete welcome message after (seconds)</label>
          <input
            type="number"
            value={deleteAfterSecs}
            onChange={(e) => setDeleteAfterSecs(+e.target.value)}
            className="w-full bg-[#0d0d14] border border-white/5 rounded-lg px-3 py-2 text-sm text-white outline-none"
          />
          <p className="text-[11px] text-[#475569] mt-1">Set to 0 to keep it permanently</p>
        </div>

        {/* Preview */}
        <div className="bg-[#0d0d14] border border-[#f97316]/10 rounded-xl p-4">
          <p className="text-[11px] text-[#f97316] uppercase tracking-wide mb-2">Preview</p>
          <p className="text-sm text-[#cbd5e1] leading-relaxed">{preview}</p>
        </div>

        <LoadingButton loading={saving} onClick={save} className="w-full py-2.5">
          Save changes
        </LoadingButton>
      </div>
    </div>
  );
}
