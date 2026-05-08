"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import toast from "react-hot-toast";
import { LoadingButton } from "@/components/LoadingButton";

const TONES = [
  { value: "casual",    label: "Casual",    desc: "Friendly, relaxed, like a community member" },
  { value: "formal",    label: "Formal",    desc: "Professional and polished" },
  { value: "degen",     label: "Degen",     desc: "Crypto native slang, high energy" },
  { value: "corporate", label: "Corporate", desc: "Official brand voice" },
];

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "ar", label: "Arabic" },
  { value: "zh", label: "Chinese" },
  { value: "tr", label: "Turkish" },
  { value: "pt", label: "Portuguese" },
  { value: "ru", label: "Russian" },
  { value: "id", label: "Indonesian" },
];

export default function GroupAIPage() {
  const params = useParams();
  const chatId = decodeURIComponent(params.chatId as string);

  const [enabled, setEnabled] = useState(true);
  const [tone, setTone] = useState("casual");
  const [language, setLanguage] = useState("en");
  const [replyMode, setReplyMode] = useState<"all" | "mentions">("all");
  const [replyFrequency, setReplyFrequency] = useState(6);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/groups/${encodeURIComponent(chatId)}/settings`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.ai) {
          setEnabled(data.ai.enabled ?? true);
          setTone(data.ai.tone ?? "casual");
          setLanguage(data.ai.language ?? "en");
          setReplyMode(data.ai.replyMode ?? "all");
          setReplyFrequency(data.ai.replyFrequency ?? 6);
        }
        setLoading(false);
      });
  }, [chatId]);

  async function save() {
    setSaving(true);
    const res = await fetch(`/api/groups/${encodeURIComponent(chatId)}/settings`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ai: { enabled, tone, language, replyMode, replyFrequency } }),
    });
    setSaving(false);
    res.ok ? toast.success("AI settings saved") : toast.error("Failed to save");
  }

  return (
    <div className="p-4 md:p-6 animate-in max-w-lg">
      <h1 className="text-base font-semibold text-white mb-1">AI Settings</h1>
      <p className="text-xs text-[#64748b] mb-5">Customize how the AI communicates in this group</p>

      <div className="space-y-3">
        {/* Enable */}
        <div className="bg-[#14141f] border border-white/5 rounded-xl px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-sm text-[#cbd5e1]">Enable AI replies</p>
            <p className="text-[11px] text-[#475569] mt-0.5">Bot will engage with messages in this group</p>
          </div>
          <button
            onClick={() => { setEnabled(!enabled); toast(enabled ? "AI disabled" : "AI enabled", { style: { background: enabled ? "rgba(239,68,68,0.12)" : "rgba(34,197,94,0.12)", color: enabled ? "#fca5a5" : "#86efac", border: `1px solid ${enabled ? "rgba(239,68,68,0.2)" : "rgba(34,197,94,0.2)"}`, fontSize: "13px" } }); }}
            className={`w-10 h-5 rounded-full relative transition-colors flex-shrink-0 ${enabled ? "bg-[#f97316]" : "bg-white/10"}`}
          >
            <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow ${enabled ? "translate-x-5" : "translate-x-0.5"}`} />
          </button>
        </div>

        {/* Tone */}
        <div className="bg-[#14141f] border border-white/5 rounded-xl p-4">
          <p className="text-xs font-medium text-[#94a3b8] mb-3">Personality / Tone</p>
          <div className="grid grid-cols-2 gap-2">
            {TONES.map((t) => (
              <button
                key={t.value}
                onClick={() => setTone(t.value)}
                className={`text-left rounded-xl p-3 border transition-colors ${
                  tone === t.value
                    ? "border-[#f97316]/50 bg-[#f97316]/8"
                    : "border-white/5 hover:border-white/15"
                }`}
              >
                <p className={`text-sm font-medium mb-0.5 ${tone === t.value ? "text-[#f97316]" : "text-white"}`}>
                  {t.label}
                </p>
                <p className="text-[10px] text-[#475569] leading-tight">{t.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Reply mode */}
        <div className="bg-[#14141f] border border-white/5 rounded-xl p-4">
          <p className="text-xs font-medium text-[#94a3b8] mb-3">Reply mode</p>
          <div className="space-y-2">
            {[
              { v: "all",      label: "All messages",    desc: "Bot replies to greetings, questions, and general chat" },
              { v: "mentions", label: "Mentions only",   desc: "Bot only replies when @mentioned or directly replied to" },
            ].map((m) => (
              <button
                key={m.v}
                onClick={() => setReplyMode(m.v as "all" | "mentions")}
                className={`w-full text-left rounded-xl px-4 py-3 border transition-colors flex items-start gap-3 ${
                  replyMode === m.v ? "border-[#f97316]/50 bg-[#f97316]/8" : "border-white/5"
                }`}
              >
                <span className={`w-4 h-4 rounded-full border-2 flex-shrink-0 mt-0.5 ${replyMode === m.v ? "border-[#f97316] bg-[#f97316]" : "border-white/20"}`} />
                <div>
                  <p className={`text-sm font-medium ${replyMode === m.v ? "text-[#f97316]" : "text-white"}`}>{m.label}</p>
                  <p className="text-[11px] text-[#475569] mt-0.5">{m.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Reply frequency (only if all messages) */}
        {replyMode === "all" && (
          <div className="bg-[#14141f] border border-white/5 rounded-xl p-4">
            <label className="text-xs font-medium text-[#94a3b8] block mb-1">
              General chat frequency — reply 1 in every {replyFrequency} messages
            </label>
            <input
              type="range"
              min={2}
              max={20}
              value={replyFrequency}
              onChange={(e) => setReplyFrequency(+e.target.value)}
              className="w-full accent-[#f97316] mt-2"
            />
            <div className="flex justify-between text-[10px] text-[#475569] mt-1">
              <span>Very active (2)</span>
              <span>Quiet (20)</span>
            </div>
          </div>
        )}

        {/* Language */}
        <div className="bg-[#14141f] border border-white/5 rounded-xl p-4">
          <label className="text-xs font-medium text-[#94a3b8] block mb-2">Response language</label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full bg-[#0d0d14] border border-white/5 rounded-lg px-3 py-2 text-sm text-white outline-none"
          >
            {LANGUAGES.map((l) => (
              <option key={l.value} value={l.value}>{l.label}</option>
            ))}
          </select>
        </div>

        <LoadingButton loading={saving} onClick={save} className="w-full py-2.5">
          Save AI settings
        </LoadingButton>
      </div>
    </div>
  );
}
