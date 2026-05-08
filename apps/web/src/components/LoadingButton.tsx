"use client";

import { cn } from "@/lib/cn";
import { Spinner } from "./Spinner";

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  variant?: "primary" | "ghost";
}

export function LoadingButton({
  loading,
  variant = "primary",
  children,
  className,
  disabled,
  ...props
}: Props) {
  return (
    <button
      disabled={loading || disabled}
      className={cn(
        "relative flex items-center justify-center gap-2 rounded-xl text-sm font-medium transition-all disabled:opacity-60 disabled:cursor-not-allowed",
        variant === "primary" && "bg-[#f97316] text-white hover:bg-[#ea580c]",
        variant === "ghost" && "bg-white/5 text-[#94a3b8] hover:bg-white/10 border border-white/5",
        className
      )}
      {...props}
    >
      {loading && <Spinner className="w-4 h-4" />}
      {children}
    </button>
  );
}
