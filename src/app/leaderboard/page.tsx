"use client";

import { useEffect, useState } from "react";
import { LEVELS } from "@/lib/xp";

type Row = {
  id: string;
  name: string;
  xp: number;
  level: number;
  done: number;
  avg_score: number | null;
};

export default function LeaderboardPage() {
  const [data, setData] = useState<{ enabled: boolean; me: string | null; rows: Row[] } | null>(
    null,
  );

  useEffect(() => {
    fetch("/api/leaderboard")
      .then((r) => r.json())
      .then(setData);
  }, []);

  if (!data) return <main className="max-w-3xl mx-auto px-4 py-8 text-text-secondary">טוען...</main>;

  if (!data.enabled) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-12 text-center">
        <div className="text-5xl mb-3">🚫</div>
        <h1 className="text-xl font-bold text-primary">המורה השבית את לוח ההישגים</h1>
        <p className="text-text-secondary mt-2">חזור מאוחר יותר</p>
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-primary mb-1">לוח הישגים 🏆</h1>
      <p className="text-text-secondary mb-6">דירוג לפי XP</p>

      <div className="bg-bg-card rounded-xl shadow-sm border border-border overflow-hidden">
        <table className="w-full text-right">
          <thead className="bg-primary text-white text-sm">
            <tr>
              <th className="px-3 py-2.5">מקום</th>
              <th className="px-3 py-2.5">שם</th>
              <th className="px-3 py-2.5">רמה</th>
              <th className="px-3 py-2.5">XP</th>
              <th className="px-3 py-2.5 hidden sm:table-cell">סוגיות</th>
              <th className="px-3 py-2.5 hidden sm:table-cell">ממוצע</th>
            </tr>
          </thead>
          <tbody>
            {data.rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-text-secondary">
                  אין עדיין נתונים — היה הראשון!
                </td>
              </tr>
            )}
            {data.rows.map((r, i) => {
              const place = i + 1;
              const medal = place === 1 ? "🥇" : place === 2 ? "🥈" : place === 3 ? "🥉" : null;
              const isMe = data.me && r.id === data.me;
              const lvl = LEVELS.find((l) => l.level === r.level) ?? LEVELS[0];
              return (
                <tr
                  key={r.id}
                  className={`border-t border-border ${isMe ? "bg-amber-50" : ""}`}
                >
                  <td className="px-3 py-2.5 font-bold">
                    {medal ?? place}
                  </td>
                  <td className="px-3 py-2.5">
                    {r.name} {isMe && <span className="text-xs text-accent">(אתה)</span>}
                  </td>
                  <td className="px-3 py-2.5">
                    {lvl.icon} {lvl.name}
                  </td>
                  <td className="px-3 py-2.5 font-bold tabular-nums">{r.xp}</td>
                  <td className="px-3 py-2.5 hidden sm:table-cell tabular-nums">{r.done ?? 0}</td>
                  <td className="px-3 py-2.5 hidden sm:table-cell tabular-nums">
                    {r.avg_score ?? "—"}
                    {r.avg_score != null && "%"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </main>
  );
}
