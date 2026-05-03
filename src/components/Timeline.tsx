"use client";

import Link from "next/link";
import { Sugiya } from "@/lib/exams-data";

type Status = "completed" | "current" | "locked";

export default function Timeline({
  examId,
  sugiyot,
  completedIds,
}: {
  examId: string;
  sugiyot: Sugiya[];
  completedIds: Set<number>;
}) {
  function statusFor(idx: number): Status {
    const s = sugiyot[idx];
    if (completedIds.has(s.id)) return "completed";
    const prev = idx === 0 ? null : sugiyot[idx - 1];
    if (!prev || completedIds.has(prev.id)) return "current";
    return "locked";
  }

  return (
    <ol className="relative">
      <span className="absolute right-6 top-2 bottom-2 w-0.5 bg-gray-300" aria-hidden />
      {sugiyot.map((s, idx) => {
        const st = statusFor(idx);
        const dotCls =
          st === "completed"
            ? "bg-success border-success text-white"
            : st === "current"
              ? "bg-accent border-accent text-primary animate-pulse-soft"
              : "bg-gray-200 border-gray-300 text-gray-500";
        const cardCls =
          st === "completed"
            ? "border-success bg-green-50"
            : st === "current"
              ? "border-accent bg-amber-50"
              : "border-border bg-gray-50 opacity-70";
        const inner = (
          <div className={`flex items-center gap-3 border-2 rounded-xl p-4 ${cardCls}`}>
            <div className="flex-1">
              <div className="text-xs text-text-secondary">סוגיה {s.id}</div>
              <div className="font-semibold text-lg">{s.title}</div>
              <div className="text-xs text-text-secondary mt-0.5">{s.questions.length} שאלות</div>
            </div>
            <div className="text-2xl">
              {st === "completed" ? "✓" : st === "current" ? "→" : "🔒"}
            </div>
          </div>
        );
        return (
          <li key={s.id} className="relative pr-14 pb-4">
            <span
              className={`absolute right-3 top-3 w-6 h-6 rounded-full border-4 flex items-center justify-center font-bold text-xs ${dotCls}`}
            >
              {st === "completed" ? "✓" : s.id}
            </span>
            {st === "locked" ? (
              <div className="cursor-not-allowed">{inner}</div>
            ) : (
              <Link href={`/exams/${examId}/${s.id}`} className="block hover:scale-[1.01] transition-transform">
                {inner}
              </Link>
            )}
          </li>
        );
      })}
    </ol>
  );
}
