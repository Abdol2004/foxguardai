"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import toast from "react-hot-toast";
import { LoadingButton } from "@/components/LoadingButton";

export default function GroupKnowledgePage() {
  const params = useParams();
  const chatId = decodeURIComponent(params.chatId as string);

  const [uploading, setUploading] = useState(false);
  const [ingestingUrl, setIngestingUrl] = useState(false);
  const [ingestingText, setIngestingText] = useState(false);
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");

  async function uploadFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const form = new FormData();
    form.append("file", file);
    form.append("project_id", chatId);
    const res = await fetch("/api/knowledge/upload", { method: "POST", body: form });
    setUploading(false);
    res.ok ? toast.success("Document added to knowledge base") : toast.error("Upload failed");
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
    setIngestingUrl(false);
    res.ok ? (toast.success("Page added"), setUrl("")) : toast.error("Failed to fetch page");
  }

  async function addText() {
    if (!text.trim()) return;
    setIngestingText(true);
    const res = await fetch("/api/knowledge/ingest-text", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: text.trim(), project_id: chatId }),
    });
    setIngestingText(false);
    res.ok ? (toast.success("Text saved"), setText("")) : toast.error("Failed");
  }

  return (
    <div className="p-4 md:p-6 animate-in max-w-lg">
      <h1 className="text-base font-semibold text-white mb-1">Knowledge Base</h1>
      <p className="text-xs text-[#64748b] mb-5">
        Add your project docs so the AI can answer community questions accurately
      </p>

      <div className="space-y-3">
        {/* File upload */}
        <div className="bg-[#14141f] border border-white/5 rounded-xl p-4">
          <p className="text-xs font-medium text-[#94a3b8] mb-1">Upload a document</p>
          <p className="text-[11px] text-[#475569] mb-3">PDF, DOCX, or TXT — whitepaper, FAQ, docs</p>
          <label className="block w-full py-2.5 text-center text-sm text-[#f97316] border border-[#f97316]/20 rounded-lg cursor-pointer hover:bg-[#f97316]/5 transition-colors">
            {uploading ? "Uploading..." : "Choose file"}
            <input type="file" accept=".pdf,.docx,.txt,.md" onChange={uploadFile} className="hidden" disabled={uploading} />
          </label>
        </div>

        {/* URL */}
        <div className="bg-[#14141f] border border-white/5 rounded-xl p-4">
          <p className="text-xs font-medium text-[#94a3b8] mb-1">Add a webpage</p>
          <p className="text-[11px] text-[#475569] mb-3">Documentation, blog post, or any project page</p>
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

        {/* Text */}
        <div className="bg-[#14141f] border border-white/5 rounded-xl p-4">
          <p className="text-xs font-medium text-[#94a3b8] mb-1">Paste text</p>
          <p className="text-[11px] text-[#475569] mb-3">Tokenomics, FAQ answers, roadmap details</p>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            placeholder="Paste any text content here..."
            className="w-full bg-[#0d0d14] border border-white/5 rounded-lg px-3 py-2 text-sm text-white outline-none resize-none mb-3"
          />
          <LoadingButton loading={ingestingText} onClick={addText} className="w-full py-2.5">
            Save text
          </LoadingButton>
        </div>
      </div>
    </div>
  );
}
