"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import toast from "react-hot-toast";
import { LoadingButton } from "@/components/LoadingButton";
import { AlertTriangle, CheckCircle, RefreshCw } from "lucide-react";

function AIStatusBanner() {
  const [status, setStatus] = useState<{ok: boolean; error?: string; hint?: string; url?: string} | null>(null);
  const [checking, setChecking] = useState(false);

  async function check() {
    setChecking(true);
    const res = await fetch("/api/ai/status");
    setStatus(await res.json());
    setChecking(false);
  }

  useEffect(() => { check(); }, []);

  if (!status) return null;

  if (status.ok) {
    return (
      <div className="flex items-center gap-2 bg-emerald-500/8 border border-emerald-500/20 rounded-xl px-4 py-3 mb-4">
        <CheckCircle size={14} className="text-emerald-400 flex-shrink-0" />
        <span className="text-xs text-emerald-300">AI service is online</span>
      </div>
    );
  }

  return (
    <div className="bg-red-500/8 border border-red-500/20 rounded-xl p-4 mb-4">
      <div className="flex items-start gap-2">
        <AlertTriangle size={14} className="text-red-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-red-400 mb-1">AI service unreachable</p>
          <p className="text-[11px] text-[#94a3b8] leading-relaxed">{status.hint ?? status.error}</p>
        </div>
        <button onClick={check} className="text-[#64748b] hover:text-white transition-colors flex-shrink-0">
          <RefreshCw size={13} className={checking ? "animate-spin" : ""} />
        </button>
      </div>
    </div>
  );
}

export default function GroupKnowledgePage() {
  const params = useParams();
  const chatId = decodeURIComponent(params.chatId as string);

  const [uploading, setUploading] = useState(false);
  const [ingestingUrl, setIngestingUrl] = useState(false);
  const [ingestingText, setIngestingText] = useState(false);
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");

  async function handleResponse(res: Response, successMsg: string) {
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      toast.success(successMsg);
      return true;
    }
    const errMsg = data?.error ?? data?.detail ?? `Failed (${res.status})`;
    toast.error(errMsg, { duration: 6000 });
    return false;
  }

  async function uploadFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const form = new FormData();
    form.append("file", file);
    form.append("project_id", chatId);
    const res = await fetch("/api/knowledge/upload", { method: "POST", body: form });
    await handleResponse(res, `${file.name} added to knowledge base`);
    setUploading(false);
    e.target.value = "";
  }

  async function addUrl() {
    if (!url.trim()) return;
    setIngestingUrl(true);
    const res = await fetch("/api/knowledge/ingest-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: url.trim(), project_id: chatId }),
    });
    const ok = await handleResponse(res, "Page added to knowledge base");
    if (ok) setUrl("");
    setIngestingUrl(false);
  }

  async function addText() {
    if (!text.trim()) return;
    setIngestingText(true);
    const res = await fetch("/api/knowledge/ingest-text", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: text.trim(), project_id: chatId }),
    });
    const ok = await handleResponse(res, "Text saved to knowledge base");
    if (ok) setText("");
    setIngestingText(false);
  }

  return (
    <div className="p-4 md:p-6 animate-in max-w-lg">
      <h1 className="text-base font-semibold text-white mb-1">Knowledge Base</h1>
      <p className="text-xs text-[#64748b] mb-4">
        Add your project docs so the bot answers questions accurately
      </p>

      <AIStatusBanner />

      <div className="space-y-3">
        <div className="bg-[#14141f] border border-white/5 rounded-xl p-4">
          <p className="text-xs font-medium text-[#94a3b8] mb-1">Upload a document</p>
          <p className="text-[11px] text-[#475569] mb-3">PDF, DOCX, or TXT — whitepaper, FAQ, tokenomics</p>
          <label className="block w-full py-2.5 text-center text-sm text-[#f97316] border border-[#f97316]/20 rounded-lg cursor-pointer hover:bg-[#f97316]/5 transition-colors">
            {uploading ? "Uploading..." : "Choose file"}
            <input type="file" accept=".pdf,.docx,.txt,.md" onChange={uploadFile} className="hidden" disabled={uploading} />
          </label>
        </div>

        <div className="bg-[#14141f] border border-white/5 rounded-xl p-4">
          <p className="text-xs font-medium text-[#94a3b8] mb-1">Add a webpage</p>
          <p className="text-[11px] text-[#475569] mb-3">Documentation, blog, or any project page URL</p>
          <div className="flex gap-2">
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://docs.yourproject.io"
              className="flex-1 bg-[#0d0d14] border border-white/5 rounded-lg px-3 py-2 text-sm text-white outline-none"
            />
            <LoadingButton loading={ingestingUrl} onClick={addUrl} className="px-4 py-2">
              Add
            </LoadingButton>
          </div>
        </div>

        <div className="bg-[#14141f] border border-white/5 rounded-xl p-4">
          <p className="text-xs font-medium text-[#94a3b8] mb-1">Paste text</p>
          <p className="text-[11px] text-[#475569] mb-3">FAQ, tokenomics, roadmap — any plain text content</p>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={5}
            placeholder="Q: What is [project]?&#10;A: [Your answer]&#10;&#10;Q: What is the token supply?&#10;A: ..."
            className="w-full bg-[#0d0d14] border border-white/5 rounded-lg px-3 py-2 text-sm text-white outline-none resize-none mb-3"
          />
          <LoadingButton loading={ingestingText} onClick={addText} className="w-full py-2.5">
            Save to knowledge base
          </LoadingButton>
        </div>
      </div>
    </div>
  );
}
