"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { LoadingButton } from "@/components/LoadingButton";

interface Settings {
  deleteLinks: boolean;
  antiSpam: boolean;
  antiScam: boolean;
  floodProtection: boolean;
  floodThreshold: number;
  muteDurationSecs: number;
  muteOnSpam: boolean;
  banOnScam: boolean;
  allowedDomains: string;
  scamKeywords: string;
}

const DEFAULTS: Settings = {
  deleteLinks: true,
  antiSpam: true,
  antiScam: true,
  floodProtection: true,
  floodThreshold: 5,
  muteDurationSecs: 300,
  muteOnSpam: true,
  banOnScam: true,
  allowedDomains: "",
  scamKeywords: "airdrop, giveaway, dm me, send eth, free tokens",
};

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`w-10 h-5 rounded-full relative transition-colors ${on ? "bg-[#f97316]" : "bg-white/10"}`}
    >
      <span
        className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow ${
          on ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

export default function ModerationPage() {
  const [chatId, setChatId] = useState("");
  const [s, setS] = useState<Settings>(DEFAULTS);
  const [loadingGroup, setLoadingGroup] = useState(false);
  const [saving, setSaving] = useState(false);

  async function load() {
    if (!chatId) return;
    setLoadingGroup(true);
    const res = await fetch(`/api/groups/${chatId}/settings`);
    setLoadingGroup(false);
    if (!res.ok) return toast.error("Group not found");
    const data = await res.json();
    const m = data.moderation ?? {};
    setS({
      deleteLinks:      m.deleteLinks      ?? true,
      antiSpam:         m.antiSpam         ?? true,
      antiScam:         m.antiScam         ?? true,
      floodProtection:  m.floodProtection  ?? true,
      floodThreshold:   m.floodThreshold   ?? 5,
      muteDurationSecs: m.muteDurationSecs ?? 300,
      muteOnSpam:       m.muteOnSpam       ?? true,
      banOnScam:        m.banOnScam        ?? true,
      allowedDomains:   (m.allowedDomains ?? []).join(", "),
      scamKeywords:     (m.scamKeywords   ?? []).join(", "),
    });
  }

  async function save() {
    setSaving(true);
    const res = await fetch(`/api/groups/${chatId}/settings`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        moderation: {
          ...s,
          allowedDomains: s.allowedDomains.split(",").map((x) => x.trim()).filter(Boolean),
          scamKeywords:   s.scamKeywords.split(",").map((x) => x.trim()).filter(Boolean),
        },
      }),
    });
    setSaving(false);
    res.ok ? toast.success("Saved") : toast.error("Failed to save");
  }

  const toggles: [keyof Settings, string][] = [
    ["deleteLinks",     "Delete links"],
    ["antiSpam",        "Anti-spam"],
    ["antiScam",        "Anti-scam"],
    ["floodProtection", "Flood protection"],
    ["muteOnSpam",      "Mute on spam"],
    ["banOnScam",       "Ban on scam"],
  ];

  return (
    <div className="p-4 md:p-6 animate-in max-w-lg">
      <h1 className="text-base font-semibold text-white mb-1">Moderation</h1>
      <p className="text-xs text-[#64748b] mb-5">Configure rules per group</p>

      {/* Group selector */}
      <div className="bg-[#14141f] border border-white/5 rounded-xl p-4 mb-4">
        <label className="text-xs text-[#94a3b8] block mb-2">Group Chat ID</label>
        <div className="flex gap-2">
          <input
            value={chatId}
            onChange={(e) => setChatId(e.target.value)}
            placeholder="-100123456789"
            className="flex-1 bg-[#0d0d14] border border-white/5 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[#f97316]/50"
          />
          <LoadingButton loading={loadingGroup} onClick={load} className="px-4 py-2">
            Load
          </LoadingButton>
        </div>
      </div>

      {/* Toggles */}
      <div className="bg-[#14141f] border border-white/5 rounded-xl divide-y divide-white/5 mb-4">
        {toggles.map(([key, label]) => (
          <div key={key} className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-[#cbd5e1]">{label}</span>
            <Toggle
              on={s[key] as boolean}
              onToggle={() => setS((prev) => ({ ...prev, [key]: !prev[key] }))}
            />
          </div>
        ))}
      </div>

      {/* Number inputs */}
      <div className="bg-[#14141f] border border-white/5 rounded-xl p-4 mb-4 space-y-4">
        <div>
          <label className="text-xs text-[#94a3b8] block mb-1.5">Flood threshold (messages)</label>
          <input
            type="number"
            value={s.floodThreshold}
            onChange={(e) => setS((p) => ({ ...p, floodThreshold: +e.target.value }))}
            className="w-full bg-[#0d0d14] border border-white/5 rounded-lg px-3 py-2 text-sm text-white outline-none"
          />
        </div>
        <div>
          <label className="text-xs text-[#94a3b8] block mb-1.5">Mute duration (seconds)</label>
          <input
            type="number"
            value={s.muteDurationSecs}
            onChange={(e) => setS((p) => ({ ...p, muteDurationSecs: +e.target.value }))}
            className="w-full bg-[#0d0d14] border border-white/5 rounded-lg px-3 py-2 text-sm text-white outline-none"
          />
        </div>
        <div>
          <label className="text-xs text-[#94a3b8] block mb-1.5">Allowed domains (comma separated)</label>
          <input
            value={s.allowedDomains}
            onChange={(e) => setS((p) => ({ ...p, allowedDomains: e.target.value }))}
            placeholder="yourproject.io, docs.yourproject.io"
            className="w-full bg-[#0d0d14] border border-white/5 rounded-lg px-3 py-2 text-sm text-white outline-none"
          />
        </div>
        <div>
          <label className="text-xs text-[#94a3b8] block mb-1.5">Scam keywords (comma separated)</label>
          <textarea
            value={s.scamKeywords}
            onChange={(e) => setS((p) => ({ ...p, scamKeywords: e.target.value }))}
            rows={3}
            className="w-full bg-[#0d0d14] border border-white/5 rounded-lg px-3 py-2 text-sm text-white outline-none resize-none"
          />
        </div>
      </div>

      <LoadingButton loading={saving} onClick={save} className="w-full py-2.5">
        Save changes
      </LoadingButton>
    </div>
  );
}
