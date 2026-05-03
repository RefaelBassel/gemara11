import { db, ensureSchema } from "@/lib/db";
import { isTeacher } from "@/lib/teacher";
import { EXAMS } from "@/lib/exams-data";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isTeacher()) {
    return new Response("forbidden", { status: 403 });
  }
  await ensureSchema();
  const c = db();
  const users = await c.execute(
    `SELECT id, name, email, xp, level, last_login FROM users WHERE role = 'student' ORDER BY name ASC`,
  );
  const progress = await c.execute(
    `SELECT user_id, exam_id, sugiya_id, completed, score, attempts FROM progress`,
  );

  type Stat = {
    e1Done: number;
    e2Done: number;
    scores: number[];
    attempts: number;
  };
  const m = new Map<string, Stat>();
  for (const u of users.rows) m.set(u.id as string, { e1Done: 0, e2Done: 0, scores: [], attempts: 0 });
  for (const p of progress.rows) {
    const s = m.get(p.user_id as string);
    if (!s) continue;
    if (p.completed) {
      if (p.exam_id === "exam1") s.e1Done += 1;
      if (p.exam_id === "exam2") s.e2Done += 1;
    }
    if (typeof p.score === "number") s.scores.push(p.score as number);
    s.attempts += Number(p.attempts ?? 0);
  }
  const e1Total = EXAMS.find((e) => e.id === "exam1")?.sugiyot.length ?? 0;
  const e2Total = EXAMS.find((e) => e.id === "exam2")?.sugiyot.length ?? 0;

  const lines: string[] = [
    "שם,אימייל,XP,רמה,מבחן 1,מבחן 2,ממוצע ציון,נסיונות,כניסה אחרונה",
  ];
  for (const u of users.rows) {
    const s = m.get(u.id as string)!;
    const avg = s.scores.length ? Math.round(s.scores.reduce((a, b) => a + b, 0) / s.scores.length) : "";
    const row = [
      String(u.name ?? ""),
      String(u.email ?? ""),
      String(u.xp ?? 0),
      String(u.level ?? 1),
      `${s.e1Done}/${e1Total}`,
      `${s.e2Done}/${e2Total}`,
      avg === "" ? "" : `${avg}%`,
      String(s.attempts),
      String(u.last_login ?? ""),
    ];
    lines.push(row.map((v) => `"${v.replace(/"/g, '""')}"`).join(","));
  }
  const csv = "﻿" + lines.join("\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="students.csv"`,
    },
  });
}
