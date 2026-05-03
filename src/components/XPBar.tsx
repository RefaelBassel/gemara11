"use client";

import { nextLevelInfo } from "@/lib/xp";

export default function XPBar({ xp, compact = false }: { xp: number; compact?: boolean }) {
  const info = nextLevelInfo(xp);
  return (
    <div className={`flex items-center gap-2 ${compact ? "text-xs" : "text-sm"}`}>
      <div className="flex items-center gap-1">
        <span className={compact ? "text-base" : "text-lg"}>{info.current.icon}</span>
        <span className="font-semibold text-primary">{info.current.name}</span>
      </div>
      <div className={`relative ${compact ? "w-24" : "w-40"} h-2.5 rounded-full bg-gray-200 overflow-hidden`}>
        <div
          className="progress-fill h-full bg-gradient-to-l from-accent to-amber-300"
          style={{ width: `${info.pct}%` }}
        />
      </div>
      <div className="text-text-secondary tabular-nums">
        {info.next ? `${xp}/${info.next.threshold}` : `${xp} XP`}
      </div>
    </div>
  );
}
