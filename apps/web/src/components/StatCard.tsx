import { cn } from "@/lib/cn";

interface Props {
  label: string;
  value: string | number;
  accent?: "orange" | "red" | "green" | "blue";
}

export function StatCard({ label, value, accent = "orange" }: Props) {
  const colors = {
    orange: "text-[#f97316]",
    red:    "text-red-400",
    green:  "text-emerald-400",
    blue:   "text-blue-400",
  };

  return (
    <div className="bg-[#14141f] border border-white/5 rounded-xl p-4">
      <p className="text-[11px] text-[#64748b] uppercase tracking-wide mb-2">{label}</p>
      <p className={cn("text-2xl font-bold", colors[accent])}>{value}</p>
    </div>
  );
}
