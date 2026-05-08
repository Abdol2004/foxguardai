"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import toast from "react-hot-toast";
import { LoadingButton } from "@/components/LoadingButton";

export default function AdminBroadcastPage() {
  const params = useParams();
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ sent: number; failed: number } | null>(null);

  async function send() {
    if (!message.trim()) return;
    setSending(true);
    setResult(null);
    const res = await fetch(`/api/admin/${params.secret}/broadcast`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: message.trim() }),
    });
    const data = await res.json();
    setSending(false);
    if (res.ok) {
      setResult(data);
      toast.success(`Sent to ${data.sent} groups`);
    } else {
      toast.error(data.error ?? "Failed");
    }
  }

  return (
    <div className="p-6 max-w-lg">
      <h1 className="text-lg font-bold text-white mb-2">Broadcast Message</h1>
      <p className="text-xs text-[#64748b] mb-6">Send a message to ALL groups using FoxGuard</p>

      <div className="bg-[#14141f] border border-white/5 rounded-xl p-4 space-y-4">
        <div>
          <label className="text-xs text-[#94a3b8] block mb-2">Message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={6}
            placeholder="Type your announcement..."
            className="w-full bg-[#0d0d14] border border-white/5 rounded-lg px-3 py-2 text-sm text-white outline-none resize-none"
          />
        </div>

        <div className="bg-yellow-500/8 border border-yellow-500/20 rounded-lg p-3">
          <p className="text-xs text-yellow-400">This sends to ALL registered groups. Use carefully.</p>
        </div>

        <LoadingButton loading={sending} onClick={send} className="w-full py-2.5">
          Send broadcast
        </LoadingButton>

        {result && (
          <div className="text-xs text-[#94a3b8] text-center">
            Sent: <span className="text-emerald-400">{result.sent}</span> &nbsp;
            Failed: <span className="text-red-400">{result.failed}</span>
          </div>
        )}
      </div>
    </div>
  );
}
