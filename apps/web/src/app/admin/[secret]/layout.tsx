import { notFound } from "next/navigation";

export default function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { secret: string };
}) {
  const validSecret = process.env["ADMIN_SECRET"];
  if (!validSecret || params.secret !== validSecret) notFound();

  return (
    <div className="min-h-screen bg-[#0a0a12]">
      <header className="bg-[#14141f] border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-white">FoxGuard Admin</p>
          <p className="text-[11px] text-[#f97316]">Owner Panel</p>
        </div>
        <span className="text-[11px] text-[#334155] font-mono">🔒 private</span>
      </header>
      <main className="max-w-5xl mx-auto">{children}</main>
    </div>
  );
}
