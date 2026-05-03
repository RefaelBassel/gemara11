"use client";

import { useEffect, useState } from "react";
import { EXAMS } from "@/lib/exams-data";

type Tone = {
  bg: string;
  text: string;
  icon: string;
  pulse: boolean;
  hidden?: boolean;
  done?: boolean;
};

function tone(daysLeft: number): Tone {
  if (daysLeft < 0) return { bg: "", text: "", icon: "", pulse: false, hidden: true };
  if (daysLeft === 0) return { bg: "bg-green-100 text-green-900", text: "", icon: "🍀", pulse: false, done: true };
  if (daysLeft < 3) return { bg: "bg-red-600 text-white animate-pulse-soft", text: "font-bold", icon: "🔥", pulse: true };
  if (daysLeft <= 7) return { bg: "bg-orange-500 text-white", text: "font-bold", icon: "⚠️", pulse: false };
  if (daysLeft <= 14) return { bg: "bg-orange-100 text-orange-900", text: "font-semibold", icon: "📚", pulse: false };
  return { bg: "bg-blue-100 text-blue-900", text: "", icon: "📚", pulse: false };
}

function diff(target: string): { d: number; h: number; m: number } {
  const now = new Date();
  const t = new Date(target + "T08:00:00");
  const ms = t.getTime() - now.getTime();
  const d = Math.floor(ms / 86400000);
  const h = Math.floor((ms % 86400000) / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return { d, h, m };
}

export default function CountdownBanner() {
  const [, force] = useState(0);
  useEffect(() => {
    const t = setInterval(() => force((x) => x + 1), 60000);
    return () => clearInterval(t);
  }, []);

  const cards = EXAMS.map((e) => {
    const dd = diff(e.examDate);
    return { exam: e, dd, t: tone(dd.d) };
  }).filter((c) => !c.t.hidden);

  if (cards.length === 0) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 pt-3">
      <div className="grid sm:grid-cols-2 gap-2">
        {cards.map(({ exam, dd, t }) => (
          <div
            key={exam.id}
            className={`rounded-lg px-3 py-2 text-sm flex items-center gap-2 ${t.bg} ${t.text}`}
          >
            <span className="text-base">{t.icon}</span>
            {t.done ? (
              <span>הבחינה היום! בהצלחה ב{exam.subtitle} 🍀</span>
            ) : (
              <span>
                {exam.title} ({exam.subtitle}): עוד {dd.d} ימים {dd.h} שעות
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
