"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { LoadingButton } from "@/components/LoadingButton";

export default function KnowledgePage() {
  const [projectId, setProjectId] = useState("");
  const [uploading, setUploading] = useState(false);
  const [ingestingUrl, setIngestingUrl] = useState(false);
  const [ingestingText, setIngestingText] = useState(false);
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");

  async function uploadFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !projectId) return toast.error("Enter a project ID first");
    setUploading(true);
    const form = new FormData();
    form.append("file", file);
    form.append("project_id", projectId);
    const res = await fetch("/api/knowledge/upload", { method: "POST", body: form });
    setUploading(false);
    res.ok ? toast.success("Ingested") : toast.error("Upload failed");
    e.target.value = "";
  }

  async function ingestUrl() {
    if (!url || !projectId) return toast.error("Enter project ID and URL");
    setIngestingUrl(true);
    const res = await fetch("/api/knowledge/ingest-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, project_id: projectId }),
    });
    setIngestingUrl(false);
    res.ok ? (toast.success("URL ingested"), setUrl("")) : toast.error("Failed");
  }

  async function ingestText() {
    if (!text || !projectId) return toast.error("Enter project ID and text");
    setIngestingText(true);
    const res = await fetch("/api/knowledge/ingest-text", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, project_id: projectId }),
    });
    setIngestingText(false);
    res.ok ? (toast.success("Text ingested"), setText("")) : toast.error("Failed");
  }

  return (
    <div className="p-4 md:p-6 animate-in max-w-lg">
      <h1 className="text-base font-semibold text-white mb-1">Knowledge Base</h1>
      <p className="text-xs text-[#64748b] mb-5">Train the AI on your project docs</p>

      {/* Project ID */}
      <div className="bg-[#14141f] border border-white/5 rounded-xl p-4 mb-4">
        <label className="text-xs text-[#94a3b8] block mb-2">Project ID</label>
        <input
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          placeholder="your-project-id"
          className="w-full bg-[#0d0d14] border border-white/5 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[#f97316]/50"
        />
      </div>

      {/* File upload */}
      <div className="bg-[#14141f] border border-white/5 rounded-xl p-4 mb-3">
        <p className="text-xs text-[#94a3b8] mb-3">Upload file (PDF, DOCX, TXT)</p>
        <label className="block w-full py-2 text-center text-sm text-[#f97316] border border-[#f97316]/20 rounded-lg cursor-pointer hover:bg-[#f97316]/5 transition-colors">
          {uploading ? "Uploading..." : "Choose file"}
          <input type="file" accept=".pdf,.docx,.txt,.md" onChange={uploadFile} className="hidden" disabled={uploading} />
        </label>
      </div>

      {/* URL */}
      <div className="bg-[#14141f] border border-white/5 rounded-xl p-4 mb-3">
        <p className="text-xs text-[#94a3b8] mb-2">Ingest from URL</p>
        <div className="flex gap-2">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://docs.yourproject.io"
            className="flex-1 bg-[#0d0d14] border border-white/5 rounded-lg px-3 py-2 text-sm text-white outline-none"
          />
          <LoadingButton loading={ingestingUrl} onClick={ingestUrl} className="px-4 py-2">
            Add
          </LoadingButton>
        </div>
      </div>

      {/* Text */}
      <div className="bg-[#14141f] border border-white/5 rounded-xl p-4">
        <p className="text-xs text-[#94a3b8] mb-2">Paste text or FAQ</p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          placeholder="Paste your FAQ, tokenomics, whitepaper excerpt..."
          className="w-full bg-[#0d0d14] border border-white/5 rounded-lg px-3 py-2 text-sm text-white outline-none resize-none mb-3"
        />
        <LoadingButton loading={ingestingText} onClick={ingestText} className="w-full py-2">
          Ingest text
        </LoadingButton>
      </div>
    </div>
  );
}
