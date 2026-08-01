import React from 'react';

export function SkeletonCard() {
  return (
    <div className="bg-[#1e2121] rounded-2xl border border-white/5 overflow-hidden">
      <div className="h-1 w-full bg-white/5" />
      <div className="h-40 w-full bg-gradient-to-br from-white/5 to-white/[0.02] animate-pulse" />
      <div className="p-4 space-y-3">
        <div className="space-y-1.5">
          <div className="h-3 w-20 bg-white/10 rounded animate-pulse" />
          <div className="h-4 w-32 bg-white/10 rounded animate-pulse" />
        </div>
        <div className="h-10 w-full bg-white/5 rounded-lg animate-pulse" />
        <div className="flex gap-1.5">
          <div className="h-5 w-16 bg-white/5 rounded-full animate-pulse" />
          <div className="h-5 w-20 bg-white/5 rounded-full animate-pulse" />
        </div>
        <div className="space-y-2">
          <div className="flex justify-between">
            <div className="h-6 w-16 bg-white/10 rounded animate-pulse" />
            <div className="h-6 w-12 bg-white/5 rounded animate-pulse" />
          </div>
          <div className="flex gap-2">
            <div className="h-10 w-20 bg-white/5 rounded-lg animate-pulse" />
            <div className="h-10 flex-1 bg-white/5 rounded-lg animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-white/5">
      <div className="w-10 h-10 rounded-lg bg-white/5 animate-pulse shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-32 bg-white/10 rounded animate-pulse" />
        <div className="h-3 w-48 bg-white/5 rounded animate-pulse" />
      </div>
      <div className="h-6 w-16 bg-white/5 rounded animate-pulse shrink-0" />
    </div>
  );
}

export function SkeletonStatCard() {
  return (
    <div className="bg-black rounded-2xl p-5 border border-white/5">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-10 h-10 rounded-lg bg-white/5 animate-pulse" />
        <div className="h-3 w-20 bg-white/10 rounded animate-pulse" />
      </div>
      <div className="h-7 w-24 bg-white/10 rounded animate-pulse" />
    </div>
  );
}

export function SkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
