"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { EXAMS } from "@/lib/exams-data";

function fmt(d: Date) {
  return d.toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function diff(date: string) {
  const t = new Date(date + "T08:00:00").getTime();
  const ms = t - Date.now();
  const d = Math.floor(ms / 86400000);
  const h = Math.floor((ms % 86400000) / 3600000);
  return { d, h, past: ms < 0 };
}

export default function ExamsPage() {
  const [, force] = useState(0);
  useEffect(() => {
    const t = setInterval(() => force((x) => x + 1), 60000);
    return () => clearInterval(t);
  }, []);

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-primary mb-1">בחירת מבחן</h1>
      <p className="text-text-secondary mb-6">לחץ על מבחן כדי לראות את מפת הסוגיות</p>

      <div className="grid sm:grid-cols-2 gap-4">
        {EXAMS.map((e) => {
          const dd = diff(e.examDate);
          const date = new Date(e.examDate);
          return (
            <Link
              key={e.id}
              href={`/exams/${e.id}`}
              className="bg-bg-card rounded-2xl shadow-md hover:shadow-xl transition border-2 border-transparent hover:border-accent p-6 text-right"
            >
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-accent font-bold">{e.title}</span>
                <span className="text-xs text-text-secondary">
                  {e.sugiyot.length} סוגיות
                </span>
              </div>
              <h2 className="text-2xl font-bold text-primary mb-2">{e.subtitle}</h2>
              <div className="text-sm text-text-secondary mb-4">דפים: {e.pages}</div>
              <div className="border-t border-border pt-3 text-sm">
                <div>
                  <span className="text-text-secondary">תאריך מבחן: </span>
                  <span className="font-semibold">{fmt(date)}</span>
                </div>
                {!dd.past ? (
                  <div className="mt-1">
                    <span className="text-text-secondary">נותר: </span>
                    <span className="font-bold text-primary">
                      {dd.d} ימים, {dd.h} שעות
                    </span>
                  </div>
                ) : (
                  <div className="mt-1 text-text-secondary">המבחן עבר</div>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      <div className="mt-6">
        <Link href="/leaderboard" className="text-primary hover:underline">
          לוח הישגים 🏆
        </Link>
      </div>
    </main>
  );
}
