import { NextResponse } from "next/server";
import { db, ensureSchema } from "@/lib/db";
import { isTeacher } from "@/lib/teacher";
import { EXAMS } from "@/lib/exams-data";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isTeacher()) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  await ensureSchema();
  const c = db();
  const users = await c.execute(
    `SELECT id, name, email, xp, level, last_login, created_at
     FROM users WHERE role = 'student' ORDER BY name ASC`,
  );
  const progress = await c.execute(
    `SELECT user_id, exam_id, sugiya_id, completed, score, attempts FROM progress`,
  );

  type Stat = {
    exam1Done: number;
    exam2Done: number;
    scores: number[];
    attempts: number;
  };
  const map = new Map<string, Stat>();
  for (const u of users.rows) {
    map.set(u.id as string, { exam1Done: 0, exam2Done: 0, scores: [], attempts: 0 });
  }
  for (const p of progress.rows) {
    const s = map.get(p.user_id as string);
    if (!s) continue;
    if (p.completed) {
      if (p.exam_id === "exam1") s.exam1Done += 1;
      if (p.exam_id === "exam2") s.exam2Done += 1;
    }
    if (typeof p.score === "number") s.scores.push(p.score as number);
    s.attempts += Number(p.attempts ?? 0);
  }

  const exam1Total = EXAMS.find((e) => e.id === "exam1")?.sugiyot.length ?? 0;
  const exam2Total = EXAMS.find((e) => e.id === "exam2")?.sugiyot.length ?? 0;

  const list = users.rows.map((u) => {
    const s = map.get(u.id as string)!;
    const avg = s.scores.length
      ? Math.round(s.scores.reduce((a, b) => a + b, 0) / s.scores.length)
      : null;
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      xp: u.xp,
      level: u.level,
      last_login: u.last_login,
      created_at: u.created_at,
      exam1Done: s.exam1Done,
      exam1Total,
      exam2Done: s.exam2Done,
      exam2Total,
      avgScore: avg,
      attempts: s.attempts,
    };
  });

  return NextResponse.json({ students: list });
}

export async function POST(req: Request) {
  if (!isTeacher()) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  await ensureSchema();
  const body = (await req.json().catch(() => ({}))) as { name?: string; email?: string };
  const name = body.name?.trim();
  const email = body.email?.trim() || null;
  if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });
  const id = `m_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  const googleId = `manual_${id}`;
  await db().execute({
    sql: `INSERT INTO users (id, google_id, name, email, role) VALUES (?, ?, ?, ?, 'student')`,
    args: [id, googleId, name, email],
  });
  return NextResponse.json({ ok: true, id });
}
