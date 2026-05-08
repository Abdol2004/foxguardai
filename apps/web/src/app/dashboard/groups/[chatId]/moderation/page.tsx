"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import toast from "react-hot-toast";
import { LoadingButton } from "@/components/LoadingButton";

function Toggle({ on, label, onToggle }: { on: boolean; label: string; onToggle: () => void }) {
  function handle() {
    onToggle();
    toast(on ? `${label} turned off` : `${label} turned on`, {
      style: {
        background: on ? "rgba(239,68,68,0.12)" : "rgba(34,197,94,0.12)",
        color: on ? "#fca5a5" : "#86efac",
        border: `1px solid ${on ? "rgba(239,68,68,0.2)" : "rgba(34,197,94,0.2)"}`,
        fontSize: "13px",
      },
    });
  }
  return (
    <button onClick={handle} className={`w-10 h-5 rounded-full relative transition-colors ${on ? "bg-[#f97316]" : "bg-white/10"}`}>
      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow ${on ? "translate-x-5" : "translate-x-0.5"}`} />
    </button>
  );
}

const TOGGLES: [string, string][] = [
  ["deleteLinks",     "Delete links"],
  ["antiSpam",        "Anti-spam"],
  ["antiScam",        "Anti-scam"],
  ["floodProtection", "Flood protection"],
  ["muteOnSpam",      "Mute on spam"],
  ["banOnScam",       "Ban on scam"],
];

export default function GroupModerationPage() {
  const params = useParams();
  const chatId = decodeURIComponent(params.chatId as string);

  const [s, setS] = useState<Record<string, any>>({
    deleteLinks: true, antiSpam: true, antiScam: true,
    floodProtection: true, muteOnSpam: true, banOnScam: true,
    floodThreshold: 5, muteDurationSecs: 300,
    allowedDomains: "", scamKeywords: "airdrop, giveaway, dm me, send eth, free tokens",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/groups/${encodeURIComponent(chatId)}/settings`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.moderation) {
          const m = data.moderation;
          setS({
            deleteLinks:      m.deleteLinks      ?? true,
            antiSpam:         m.antiSpam         ?? true,
            antiScam:         m.antiScam         ?? true,
            floodProtection:  m.floodProtection  ?? true,
            muteOnSpam:       m.muteOnSpam       ?? true,
            banOnScam:        m.banOnScam        ?? true,
            floodThreshold:   m.floodThreshold   ?? 5,
            muteDurationSecs: m.muteDurationSecs ?? 300,
            allowedDomains:   (m.allowedDomains ?? []).join(", "),
            scamKeywords:     (m.scamKeywords   ?? []).join(", "),
          });
        }
        setLoading(false);
      });
  }, [chatId]);

  async function save() {
    setSaving(true);
    const res = await fetch(`/api/groups/${encodeURIComponent(chatId)}/settings`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        moderation: {
          ...s,
          allowedDomains: s.allowedDomains.split(",").map((x: string) => x.trim()).filter(Boolean),
          scamKeywords:   s.scamKeywords.split(",").map((x: string) => x.trim()).filter(Boolean),
        },
      }),
    });
    setSaving(false);
    res.ok ? toast.success("Saved") : toast.error("Failed");
  }

  return (
    <div className="p-4 md:p-6 animate-in max-w-lg">
      <h1 className="text-base font-semibold text-white mb-1">Moderation</h1>
      <p className="text-xs text-[#64748b] mb-5">Rules applied to this group</p>

      <div className="bg-[#14141f] border border-white/5 rounded-xl divide-y divide-white/5 mb-3">
        {TOGGLES.map(([key, label]) => (
          <div key={key} className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-[#cbd5e1]">{label}</span>
            <Toggle label={label} on={!!s[key]} onToggle={() => setS((p) => ({ ...p, [key]: !p[key] }))} />
          </div>
        ))}
      </div>

      <div className="bg-[#14141f] border border-white/5 rounded-xl p-4 mb-3 space-y-4">
        <div>
          <label className="text-xs text-[#94a3b8] block mb-1.5">Flood threshold (messages)</label>
          <input type="number" value={s.floodThreshold}
            onChange={(e) => setS((p) => ({ ...p, floodThreshold: +e.target.value }))}
            className="w-full bg-[#0d0d14] border border-white/5 rounded-lg px-3 py-2 text-sm text-white outline-none" />
        </div>
        <div>
          <label className="text-xs text-[#94a3b8] block mb-1.5">Mute duration (seconds)</label>
          <input type="number" value={s.muteDurationSecs}
            onChange={(e) => setS((p) => ({ ...p, muteDurationSecs: +e.target.value }))}
            className="w-full bg-[#0d0d14] border border-white/5 rounded-lg px-3 py-2 text-sm text-white outline-none" />
        </div>
        <div>
          <label className="text-xs text-[#94a3b8] block mb-1.5">Allowed domains (comma separated)</label>
          <input value={s.allowedDomains}
            onChange={(e) => setS((p) => ({ ...p, allowedDomains: e.target.value }))}
            placeholder="yourproject.io, docs.yourproject.io"
            className="w-full bg-[#0d0d14] border border-white/5 rounded-lg px-3 py-2 text-sm text-white outline-none" />
        </div>
        <div>
          <label className="text-xs text-[#94a3b8] block mb-1.5">Scam keywords</label>
          <textarea value={s.scamKeywords}
            onChange={(e) => setS((p) => ({ ...p, scamKeywords: e.target.value }))}
            rows={3}
            className="w-full bg-[#0d0d14] border border-white/5 rounded-lg px-3 py-2 text-sm text-white outline-none resize-none" />
        </div>
      </div>

      <LoadingButton loading={saving} onClick={save} className="w-full py-2.5">
        Save changes
      </LoadingButton>
    </div>
  );
}
