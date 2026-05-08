"use client";

import { useState } from "react";
import Link from "next/link";
import { Copy, Check, ChevronRight } from "lucide-react";
import { LoadingButton } from "@/components/LoadingButton";
import toast from "react-hot-toast";

interface ChatResult {
  id: number;
  title: string;
  type: string;
  username: string | null;
}

function Step({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#14141f] border border-white/5 rounded-xl p-4">
      <div className="flex items-center gap-3 mb-3">
        <span className="w-6 h-6 rounded-full bg-[#f97316]/15 text-[#f97316] flex items-center justify-center text-xs font-bold flex-shrink-0">
          {number}
        </span>
        <span className="text-sm font-medium text-white">{title}</span>
      </div>
      <div className="pl-9">{children}</div>
    </div>
  );
}

function CopyField({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(value).catch(() => null);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <div className="flex items-center gap-2 bg-[#0d0d14] border border-white/5 rounded-lg px-3 py-2">
      <span className="flex-1 text-sm text-[#f97316] font-mono truncate">{value}</span>
      <button onClick={copy} className="text-[#64748b] hover:text-white transition-colors flex-shrink-0">
        {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
      </button>
    </div>
  );
}

export default function GuidePage() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ChatResult | null>(null);
  const [error, setError] = useState("");

  async function lookupChat() {
    if (!username.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    const res = await fetch(`/api/telegram/chat-id?username=${encodeURIComponent(username.trim())}`);
    const data = await res.json();
    setLoading(false);
    if (!res.ok) setError(data.error ?? "Not found. Make sure the bot is a member of the group.");
    else { setResult(data); toast.success("Chat found"); }
  }

  return (
    <div className="p-4 md:p-6 animate-in max-w-lg">
      <h1 className="text-base font-semibold text-white mb-1">Setup Guide</h1>
      <p className="text-xs text-[#64748b] mb-5">Get FoxGuard running in your community</p>

      <div className="space-y-3">
        <Step number={1} title="Add the bot to your group or channel">
          <p className="text-xs text-[#64748b] mb-3 leading-relaxed">
            Open Telegram, find your bot and add it as an administrator with: Delete messages, Ban users, Restrict members.
          </p>
          <a href="https://t.me/foxguardaibot" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-[#f97316] hover:underline">
            Open @foxguardaibot <ChevronRight size={12} />
          </a>
        </Step>

        <Step number={2} title="Find your group or channel ID">
          <p className="text-xs text-[#64748b] mb-3">Enter your group or channel username. The bot must already be a member.</p>
          <div className="flex gap-2 mb-3">
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && lookupChat()}
              placeholder="@mycommunity"
              className="flex-1 bg-[#0d0d14] border border-white/5 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[#f97316]/40"
            />
            <LoadingButton loading={loading} onClick={lookupChat} className="px-4 py-2">
              {loading ? null : "Lookup"}
            </LoadingButton>
          </div>
          {error && <p className="text-xs text-red-400 mb-2">{error}</p>}
          {result && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#64748b] w-14">Title</span>
                <span className="text-xs text-white">{result.title}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-xs text-[#64748b] w-14 pt-2">Chat ID</span>
                <div className="flex-1">
                  <CopyField value={String(result.id)} />
                  <p className="text-[11px] text-[#475569] mt-1">Use this in Moderation settings</p>
                </div>
              </div>
            </div>
          )}
        </Step>

        <Step number={3} title="Add the group to your dashboard">
          <p className="text-xs text-[#64748b] mb-2 leading-relaxed">
            Go to My Groups → Add group → search by username → click Add.
          </p>
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-xs text-[#f97316] hover:underline">
            Go to My Groups <ChevronRight size={12} />
          </Link>
        </Step>

        <Step number={4} title="Activate and configure">
          <p className="text-xs text-[#64748b] mb-2 leading-relaxed">
            Click Activate — the bot sends an intro message to the group. Then manage moderation rules, AI settings, and upload your project knowledge from the group's manage page.
          </p>
        </Step>

        <Step number={5} title="Test it">
          <p className="text-xs text-[#64748b]">
            Send a link or say "hi" in the group — the bot should respond. Ask it a project question by mentioning it.
          </p>
        </Step>
      </div>
    </div>
  );
}
