"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/cn";
import {
  LayoutDashboard,
  Shield,
  BookOpen,
  BarChart2,
  MessageSquare,
  Ticket,
  BookMarked,
} from "lucide-react";

const nav = [
  { href: "/dashboard",            label: "Overview",    icon: LayoutDashboard },
  { href: "/dashboard/guide",      label: "Guide",       icon: BookMarked },
  { href: "/dashboard/moderation", label: "Moderation",  icon: Shield },
  { href: "/dashboard/knowledge",  label: "Knowledge",   icon: BookOpen },
  { href: "/dashboard/analytics",  label: "Analytics",   icon: BarChart2 },
  { href: "/dashboard/tickets",    label: "Tickets",     icon: Ticket },
  { href: "/dashboard/welcome",    label: "Welcome",     icon: MessageSquare },
];

const mobileNav = nav.slice(0, 5);

export function Sidebar() {
  const path = usePathname();

  const isActive = (href: string) =>
    href === "/dashboard" ? path === href : path.startsWith(href);

  return (
    <>
      {/* ── Desktop sidebar ──────────────────────────────────────────────── */}
      <aside className="hidden md:flex w-52 min-h-screen flex-col bg-[#14141f] border-r border-white/5 shrink-0">
        <div className="px-5 py-4 border-b border-white/5">
          <p className="font-semibold text-white text-sm">FoxGuard</p>
          <p className="text-[11px] text-[#f97316] mt-0.5">Sentinel Fox</p>
        </div>

        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                isActive(href)
                  ? "bg-[rgba(249,115,22,0.1)] text-[#f97316]"
                  : "text-[#64748b] hover:text-white hover:bg-white/5"
              )}
            >
              <Icon size={15} strokeWidth={isActive(href) ? 2.2 : 1.8} />
              <span>{label}</span>
            </Link>
          ))}
        </nav>

        <div className="px-4 py-3 border-t border-white/5">
          <p className="text-[11px] text-[#1e293b]">v0.1.0</p>
        </div>
      </aside>

      {/* ── Mobile bottom nav ─────────────────────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#14141f] border-t border-white/5 flex justify-around px-2 pt-2 pb-3">
        {mobileNav.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-col items-center gap-1 px-2 py-1 rounded-lg transition-colors min-w-0",
              isActive(href) ? "text-[#f97316]" : "text-[#475569]"
            )}
          >
            <Icon size={19} strokeWidth={isActive(href) ? 2.2 : 1.8} />
            <span className="text-[10px] truncate">{label}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}
