export default function Loading() {
  return (
    <div className="p-4 md:p-6 animate-pulse space-y-4">
      {/* Title skeleton */}
      <div className="h-4 w-32 bg-white/5 rounded-lg" />
      <div className="h-3 w-48 bg-white/5 rounded-lg" />

      {/* Card skeletons */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-[#14141f] border border-white/5 rounded-xl p-4 space-y-3">
            <div className="h-2.5 w-20 bg-white/5 rounded" />
            <div className="h-7 w-16 bg-white/5 rounded" />
          </div>
        ))}
      </div>

      {/* Block skeleton */}
      <div className="bg-[#14141f] border border-white/5 rounded-xl p-4 space-y-3 mt-2">
        <div className="h-3.5 w-28 bg-white/5 rounded" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between py-1">
            <div className="h-3 w-32 bg-white/5 rounded" />
            <div className="h-3 w-16 bg-white/5 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
