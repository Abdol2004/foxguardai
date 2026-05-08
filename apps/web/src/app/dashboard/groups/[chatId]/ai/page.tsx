"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Trash2, Plus, AlertTriangle, CheckCircle, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import { LoadingButton } from "@/components/LoadingButton";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FAQ { _id: string; question: string; answer: string }

const TONES = [
  { value: "casual",    label: "Casual",    desc: "Friendly, like a community member" },
  { value: "formal",    label: "Formal",    desc: "Professional and polished" },
  { value: "degen",     label: "Degen",     desc: "Crypto-native, high energy" },
  { value: "corporate", label: "Corporate", desc: "Official brand voice" },
];

const LANGUAGES = [
  "en","es","fr","de","ar","zh","tr","pt","ru","id","ja","ko","vi","th","hi",
].map((v) => ({ value: v, label: { en:"English",es:"Spanish",fr:"French",de:"German",ar:"Arabic",zh:"Chinese",tr:"Turkish",pt:"Portuguese",ru:"Russian",id:"Indonesian",ja:"Japanese",ko:"Korean",vi:"Vietnamese",th:"Thai",hi:"Hindi" }[v] ?? v }));

// ─── AI Status ────────────────────────────────────────────────────────────────

function AIStatus() {
  const [status, setStatus] = useState<{ ok: boolean; hint?: string } | null>(null);
  const [checking, setChecking] = useState(false);

  async function check() {
    setChecking(true);
    const res = await fetch("/api/ai/status");
    setStatus(await res.json());
    setChecking(false);
  }

  useEffect(() => { check(); }, []);

  if (!status) return null;

  return (
    <div className={`flex items-center gap-2 rounded-xl px-4 py-3 mb-4 border ${status.ok ? "bg-emerald-500/8 border-emerald-500/20" : "bg-red-500/8 border-red-500/20"}`}>
      {status.ok
        ? <><CheckCircle size={13} className="text-emerald-400" /><span className="text-xs text-emerald-300">AI service online</span></>
        : <><AlertTriangle size={13} className="text-red-400" /><span className="text-xs text-red-300 flex-1">{status.hint ?? "AI service unreachable"}</span><button onClick={check} className="text-[#64748b] hover:text-white"><RefreshCw size={12} className={checking ? "animate-spin" : ""} /></button></>
      }
    </div>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-semibold text-[#475569] uppercase tracking-wider mb-2 px-1">{title}</p>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

// ─── Toggle ───────────────────────────────────────────────────────────────────

function Toggle({ on, label, desc, onChange }: { on: boolean; label: string; desc?: string; onChange: (v: boolean) => void }) {
  return (
    <div className="bg-[#14141f] border border-white/5 rounded-xl px-4 py-3 flex items-center justify-between gap-4">
      <div>
        <p className="text-sm text-[#cbd5e1]">{label}</p>
        {desc && <p className="text-[11px] text-[#475569] mt-0.5">{desc}</p>}
      </div>
      <button onClick={() => onChange(!on)} className={`w-10 h-5 rounded-full relative transition-colors flex-shrink-0 ${on ? "bg-[#f97316]" : "bg-white/10"}`}>
        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow ${on ? "translate-x-5" : "translate-x-0.5"}`} />
      </button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GroupAIPage() {
  const params = useParams();
  const chatId = decodeURIComponent(params.chatId as string);

  // AI settings
  const [enabled, setEnabled]               = useState(true);
  const [tone, setTone]                     = useState("casual");
  const [language, setLanguage]             = useState("en");
  const [replyMode, setReplyMode]           = useState<"all" | "mentions">("all");
  const [replyFrequency, setReplyFrequency] = useState(6);
  const [saving, setSaving]                 = useState(false);

  // Knowledge
  const [uploading, setUploading]     = useState(false);
  const [ingestingText, setIngestingText] = useState(false);
  const [kbText, setKbText]           = useState("");

  // FAQ
  const [faqs, setFaqs]               = useState<FAQ[]>([]);
  const [newQ, setNewQ]               = useState("");
  const [newA, setNewA]               = useState("");
  const [addingFaq, setAddingFaq]     = useState(false);

  useEffect(() => {
    fetch(`/api/groups/${encodeURIComponent(chatId)}/settings`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (d?.ai) {
          setEnabled(d.ai.enabled ?? true);
          setTone(d.ai.tone ?? "casual");
          setLanguage(d.ai.language ?? "en");
          setReplyMode(d.ai.replyMode ?? "all");
          setReplyFrequency(d.ai.replyFrequency ?? 6);
        }
      });

    fetch(`/api/groups/${encodeURIComponent(chatId)}/faq`)
      .then((r) => r.ok ? r.json() : [])
      .then(setFaqs);
  }, [chatId]);

  // ── AI settings save ─────────────────────────────────────────────────────
  async function saveSettings() {
    setSaving(true);
    const res = await fetch(`/api/groups/${encodeURIComponent(chatId)}/settings`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ai: { enabled, tone, language, replyMode, replyFrequency } }),
    });
    setSaving(false);
    res.ok ? toast.success("Saved") : toast.error("Failed to save");
  }

  // ── Knowledge upload ─────────────────────────────────────────────────────
  async function uploadFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const form = new FormData();
    form.append("file", file);
    form.append("project_id", chatId);
    const res = await fetch("/api/knowledge/upload", { method: "POST", body: form });
    const data = await res.json().catch(() => ({}));
    setUploading(false);
    res.ok ? toast.success(`${file.name} added`) : toast.error(data.error ?? "Upload failed", { duration: 6000 });
    e.target.value = "";
  }

  async function saveText() {
    if (!kbText.trim()) return;
    setIngestingText(true);
    const res = await fetch("/api/knowledge/ingest-text", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: kbText.trim(), project_id: chatId }),
    });
    const data = await res.json().catch(() => ({}));
    setIngestingText(false);
    if (res.ok) { toast.success("Text saved to knowledge base"); setKbText(""); }
    else toast.error(data.error ?? "Failed", { duration: 6000 });
  }

  // ── FAQ ──────────────────────────────────────────────────────────────────
  async function addFaq() {
    if (!newQ.trim() || !newA.trim()) return toast.error("Enter both question and answer");
    setAddingFaq(true);
    const res = await fetch(`/api/groups/${encodeURIComponent(chatId)}/faq`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: newQ.trim(), answer: newA.trim() }),
    });
    const data = await res.json().catch(() => ({}));
    setAddingFaq(false);
    if (res.ok) {
      setFaqs((f) => [...f, data]);
      setNewQ("");
      setNewA("");
      toast.success("FAQ added and saved to knowledge base");
    } else {
      toast.error(data.error ?? "Failed");
    }
  }

  async function deleteFaq(id: string) {
    await fetch(`/api/groups/${encodeURIComponent(chatId)}/faq`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setFaqs((f) => f.filter((x) => x._id !== id));
    toast.success("FAQ removed");
  }

  return (
    <div className="p-4 md:p-6 animate-in max-w-lg space-y-6">
      <div>
        <h1 className="text-base font-semibold text-white mb-1">AI Settings</h1>
        <p className="text-xs text-[#64748b]">Configure the bot's intelligence for this group</p>
      </div>

      <AIStatus />

      {/* ── AI Behavior ─────────────────────────────────────────────────── */}
      <Section title="Behavior">
        <Toggle on={enabled} label="Enable AI replies" desc="Bot engages with group messages" onChange={(v) => { setEnabled(v); toast(v ? "AI enabled" : "AI disabled"); }} />

        <div className="bg-[#14141f] border border-white/5 rounded-xl p-4">
          <p className="text-xs font-medium text-[#94a3b8] mb-3">Personality</p>
          <div className="grid grid-cols-2 gap-2">
            {TONES.map((t) => (
              <button key={t.value} onClick={() => setTone(t.value)}
                className={`text-left rounded-xl p-3 border transition-colors ${tone === t.value ? "border-[#f97316]/50 bg-[#f97316]/8" : "border-white/5 hover:border-white/15"}`}>
                <p className={`text-sm font-medium mb-0.5 ${tone === t.value ? "text-[#f97316]" : "text-white"}`}>{t.label}</p>
                <p className="text-[10px] text-[#475569]">{t.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-[#14141f] border border-white/5 rounded-xl p-4 space-y-2">
          {[
            { v: "all",      label: "All messages",  desc: "Replies to greetings, questions, and general chat" },
            { v: "mentions", label: "Mentions only", desc: "Only replies when @mentioned or directly replied to" },
          ].map((m) => (
            <button key={m.v} onClick={() => setReplyMode(m.v as "all" | "mentions")}
              className={`w-full text-left rounded-xl px-4 py-3 border transition-colors flex items-start gap-3 ${replyMode === m.v ? "border-[#f97316]/50 bg-[#f97316]/8" : "border-white/5"}`}>
              <span className={`w-4 h-4 rounded-full border-2 flex-shrink-0 mt-0.5 ${replyMode === m.v ? "border-[#f97316] bg-[#f97316]" : "border-white/20"}`} />
              <div>
                <p className={`text-sm font-medium ${replyMode === m.v ? "text-[#f97316]" : "text-white"}`}>{m.label}</p>
                <p className="text-[11px] text-[#475569] mt-0.5">{m.desc}</p>
              </div>
            </button>
          ))}
        </div>

        {replyMode === "all" && (
          <div className="bg-[#14141f] border border-white/5 rounded-xl p-4">
            <label className="text-xs text-[#94a3b8] block mb-3">
              General chat — reply 1 in every <span className="text-white font-medium">{replyFrequency}</span> messages
            </label>
            <input type="range" min={2} max={20} value={replyFrequency}
              onChange={(e) => setReplyFrequency(+e.target.value)}
              className="w-full accent-[#f97316]" />
            <div className="flex justify-between text-[10px] text-[#475569] mt-1">
              <span>Very active</span><span>Quiet</span>
            </div>
          </div>
        )}

        <div className="bg-[#14141f] border border-white/5 rounded-xl p-4">
          <label className="text-xs text-[#94a3b8] block mb-2">Response language</label>
          <select value={language} onChange={(e) => setLanguage(e.target.value)}
            className="w-full bg-[#0d0d14] border border-white/5 rounded-lg px-3 py-2 text-sm text-white outline-none">
            {LANGUAGES.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
          </select>
        </div>

        <LoadingButton loading={saving} onClick={saveSettings} className="w-full py-2.5">
          Save AI settings
        </LoadingButton>
      </Section>

      {/* ── Knowledge Base ───────────────────────────────────────────────── */}
      <Section title="Knowledge Base">
        <div className="bg-[#14141f] border border-white/5 rounded-xl p-4">
          <p className="text-xs font-medium text-[#94a3b8] mb-1">Upload document</p>
          <p className="text-[11px] text-[#475569] mb-3">PDF, DOCX, or TXT — whitepaper, docs, tokenomics</p>
          <label className="block w-full py-2.5 text-center text-sm text-[#f97316] border border-[#f97316]/20 rounded-lg cursor-pointer hover:bg-[#f97316]/5 transition-colors">
            {uploading ? "Uploading..." : "Choose file"}
            <input type="file" accept=".pdf,.docx,.txt,.md" onChange={uploadFile} className="hidden" disabled={uploading} />
          </label>
        </div>

        <div className="bg-[#14141f] border border-white/5 rounded-xl p-4">
          <p className="text-xs font-medium text-[#94a3b8] mb-1">Paste text</p>
          <p className="text-[11px] text-[#475569] mb-3">Any information about your project</p>
          <textarea value={kbText} onChange={(e) => setKbText(e.target.value)} rows={4}
            placeholder="Paste your whitepaper excerpt, tokenomics, roadmap, announcements..."
            className="w-full bg-[#0d0d14] border border-white/5 rounded-lg px-3 py-2 text-sm text-white outline-none resize-none mb-3" />
          <LoadingButton loading={ingestingText} onClick={saveText} className="w-full py-2">
            Save to knowledge base
          </LoadingButton>
        </div>
      </Section>

      {/* ── FAQ Builder ──────────────────────────────────────────────────── */}
      <Section title="FAQ — Questions & Answers">
        <div className="bg-[#14141f] border border-white/5 rounded-xl p-4 space-y-3">
          <div>
            <label className="text-[11px] text-[#64748b] block mb-1.5">Question</label>
            <input value={newQ} onChange={(e) => setNewQ(e.target.value)}
              placeholder="e.g. What is the total token supply?"
              className="w-full bg-[#0d0d14] border border-white/5 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[#f97316]/40" />
          </div>
          <div>
            <label className="text-[11px] text-[#64748b] block mb-1.5">Answer</label>
            <textarea value={newA} onChange={(e) => setNewA(e.target.value)} rows={3}
              placeholder="e.g. The total supply is 1,000,000,000 tokens distributed across..."
              className="w-full bg-[#0d0d14] border border-white/5 rounded-lg px-3 py-2 text-sm text-white outline-none resize-none" />
          </div>
          <LoadingButton loading={addingFaq} onClick={addFaq} className="w-full py-2 gap-1.5">
            <Plus size={14} /> Add Q&amp;A
          </LoadingButton>
        </div>

        {faqs.length > 0 && (
          <div className="bg-[#14141f] border border-white/5 rounded-xl divide-y divide-white/5">
            {faqs.map((faq) => (
              <div key={faq._id} className="p-4 flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white mb-1 leading-relaxed">{faq.question}</p>
                  <p className="text-[11px] text-[#64748b] leading-relaxed line-clamp-2">{faq.answer}</p>
                </div>
                <button onClick={() => deleteFaq(faq._id)}
                  className="text-[#475569] hover:text-red-400 transition-colors flex-shrink-0 mt-0.5">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        {faqs.length === 0 && (
          <p className="text-xs text-[#475569] text-center py-4">No FAQs yet. Add your first Q&amp;A above.</p>
        )}
      </Section>
    </div>
  );
}
