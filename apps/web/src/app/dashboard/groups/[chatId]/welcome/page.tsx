"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import toast from "react-hot-toast";
import { LoadingButton } from "@/components/LoadingButton";

const SHORTCODES = [
  { code: "{user_name}",  label: "Username",    desc: "@username or first name" },
  { code: "{first_name}", label: "First name",  desc: "Member's first name only" },
  { code: "{group_name}", label: "Group name",  desc: "Name of the group" },
  { code: "{user_id}",    label: "User ID",     desc: "Member's Telegram user ID" },
];

export default function GroupWelcomePage() {
  const params = useParams();
  const chatId = decodeURIComponent(params.chatId as string);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [enabled, setEnabled] = useState(true);
  const [message, setMessage] = useState(
    "Welcome to {group_name}, {user_name}! Please read the rules before posting."
  );
  const [deleteAfterSecs, setDeleteAfterSecs] = useState(60);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/groups/${encodeURIComponent(chatId)}/settings`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.welcome) {
          setEnabled(data.welcome.enabled ?? true);
          setMessage(data.welcome.message ?? message);
          setDeleteAfterSecs(data.welcome.deleteAfterSecs ?? 60);
        }
        setLoading(false);
      });
  }, [chatId]);

  function insertShortcode(code: string) {
    const el = textareaRef.current;
    if (!el) {
      setMessage((m) => m + code);
      return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const updated = message.slice(0, start) + code + message.slice(end);
    setMessage(updated);
    // restore cursor after inserted code
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + code.length, start + code.length);
    });
  }

  async function save() {
    setSaving(true);
    const res = await fetch(`/api/groups/${encodeURIComponent(chatId)}/settings`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ welcome: { enabled, message, deleteAfterSecs } }),
    });
    setSaving(false);
    res.ok ? toast.success("Welcome settings saved") : toast.error("Failed to save");
  }

  const preview = message
    .replace("{user_name}",  "@newmember")
    .replace("{first_name}", "Alex")
    .replace("{group_name}", "Your Community")
    .replace("{user_id}",    "123456789");

  return (
    <div className="p-4 md:p-6 animate-in max-w-lg">
      <h1 className="text-base font-semibold text-white mb-1">Welcome Message</h1>
      <p className="text-xs text-[#64748b] mb-5">Sent to the group when a new member joins</p>

      <div className="space-y-3">

        {/* Enable toggle */}
        <div className="bg-[#14141f] border border-white/5 rounded-xl px-4 py-3 flex items-center justify-between">
          <span className="text-sm text-[#cbd5e1]">Send welcome message</span>
          <button
            onClick={() => setEnabled(!enabled)}
            className={`w-10 h-5 rounded-full relative transition-colors ${enabled ? "bg-[#f97316]" : "bg-white/10"}`}
          >
            <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow ${enabled ? "translate-x-5" : "translate-x-0.5"}`} />
          </button>
        </div>

        {/* Shortcodes */}
        <div className="bg-[#14141f] border border-white/5 rounded-xl p-4">
          <p className="text-xs font-medium text-[#94a3b8] mb-3">Shortcodes — tap to insert</p>
          <div className="grid grid-cols-2 gap-2">
            {SHORTCODES.map((s) => (
              <button
                key={s.code}
                onClick={() => insertShortcode(s.code)}
                className="text-left bg-[#0d0d14] border border-white/5 hover:border-[#f97316]/30 hover:bg-[#f97316]/5 rounded-lg px-3 py-2.5 transition-colors group"
              >
                <p className="text-xs font-mono text-[#f97316] group-hover:text-[#fb923c] mb-0.5">
                  {s.code}
                </p>
                <p className="text-[10px] text-[#475569] leading-tight">{s.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Message editor */}
        <div className="bg-[#14141f] border border-white/5 rounded-xl p-4">
          <label className="text-xs text-[#94a3b8] block mb-2">Message</label>
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
            className="w-full bg-[#0d0d14] border border-white/5 rounded-lg px-3 py-2.5 text-sm text-white outline-none resize-none focus:border-[#f97316]/40 leading-relaxed"
          />
        </div>

        {/* Live preview */}
        <div className="bg-[#0d0d14] border border-[#f97316]/12 rounded-xl p-4">
          <p className="text-[11px] text-[#f97316] uppercase tracking-wide mb-2">Preview</p>
          <p className="text-sm text-[#cbd5e1] leading-relaxed whitespace-pre-wrap">{preview}</p>
        </div>

        {/* Delete after */}
        <div className="bg-[#14141f] border border-white/5 rounded-xl p-4">
          <label className="text-xs text-[#94a3b8] block mb-1.5">
            Auto-delete after (seconds)
          </label>
          <input
            type="number"
            value={deleteAfterSecs}
            onChange={(e) => setDeleteAfterSecs(+e.target.value)}
            className="w-full bg-[#0d0d14] border border-white/5 rounded-lg px-3 py-2 text-sm text-white outline-none"
          />
          <p className="text-[11px] text-[#475569] mt-1.5">
            Set to 0 to keep the welcome message permanently
          </p>
        </div>

        <LoadingButton loading={saving} onClick={save} className="w-full py-2.5">
          Save changes
        </LoadingButton>
      </div>
    </div>
  );
}
