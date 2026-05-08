"use client";

import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { ArrowLeft, Shield, BookOpen, BarChart2, MessageSquare, Ticket, LayoutDashboard, Bot } from "lucide-react";

const tabs = [
  { href: "",           label: "Overview",   icon: LayoutDashboard },
  { href: "/moderation",label: "Moderation", icon: Shield },
  { href: "/ai",        label: "AI",         icon: Bot },
  { href: "/knowledge", label: "Knowledge",  icon: BookOpen },
  { href: "/analytics", label: "Analytics",  icon: BarChart2 },
  { href: "/welcome",   label: "Welcome",    icon: MessageSquare },
  { href: "/tickets",   label: "Tickets",    icon: Ticket },
];

export default function GroupLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const chatId = decodeURIComponent(params.chatId as string);
  const base = `/dashboard/groups/${encodeURIComponent(chatId)}`;

  const isActive = (suffix: string) =>
    suffix === "" ? pathname === base : pathname.startsWith(base + suffix);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Group header */}
      <div className="bg-[#14141f] border-b border-white/5 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => router.push("/dashboard")}
          className="text-[#64748b] hover:text-white transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">{chatId}</p>
          <p className="text-[11px] text-[#475569]">Group settings</p>
        </div>
      </div>

      {/* Desktop tab bar */}
      <div className="hidden md:flex bg-[#14141f] border-b border-white/5 px-2 overflow-x-auto">
        {tabs.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={`${base}${href}`}
            className={cn(
              "flex items-center gap-2 px-4 py-3 text-sm whitespace-nowrap border-b-2 transition-colors",
              isActive(href)
                ? "border-[#f97316] text-[#f97316]"
                : "border-transparent text-[#64748b] hover:text-white"
            )}
          >
            <Icon size={14} />
            {label}
          </Link>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 pb-20 md:pb-0">{children}</div>

      {/* Mobile bottom tabs */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#14141f] border-t border-white/5 flex justify-around px-1 pt-2 pb-3">
        {tabs.slice(0, 6).filter((_, i) => i !== 3).slice(0, 5).map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={`${base}${href}`}
            className={cn(
              "flex flex-col items-center gap-1 px-2 py-1 rounded-lg transition-colors",
              isActive(href) ? "text-[#f97316]" : "text-[#475569]"
            )}
          >
            <Icon size={19} strokeWidth={isActive(href) ? 2.2 : 1.8} />
            <span className="text-[10px]">{label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
