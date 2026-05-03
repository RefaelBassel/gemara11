import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db, ensureSchema } from "@/lib/db";
import { getExam, type Question } from "@/lib/exams-data";
import { levelFromXp, XP } from "@/lib/xp";
import { gradeOpenAnswer } from "@/lib/grader";
import { fillMatches } from "@/lib/normalize";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  await ensureSchema();
  const session = await getServerSession(authOptions);
  const uid = (session?.user as { id?: string } | undefined)?.id;
  if (!uid) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const examId = url.searchParams.get("examId");
  const sql = examId
    ? "SELECT exam_id, sugiya_id, completed, score, attempts, last_attempt FROM progress WHERE user_id = ? AND exam_id = ?"
    : "SELECT exam_id, sugiya_id, completed, score, attempts, last_attempt FROM progress WHERE user_id = ?";
  const args = examId ? [uid, examId] : [uid];
  const r = await db().execute({ sql, args });
  return NextResponse.json({ rows: r.rows });
}

type AnswerResult = {
  type: Question["type"];
  score: number; // 0-100
  correct?: boolean;
  feedback?: string;
  sample?: string;
  expected?: unknown; // shown after submission
};

async function gradeQuestion(q: Question, answer: unknown): Promise<AnswerResult> {
  switch (q.type) {
    case "multi": {
      const a = typeof answer === "number" ? answer : -1;
      const ok = a === q.correct;
      return { type: "multi", score: ok ? 100 : 0, correct: ok, expected: q.correct };
    }
    case "tf": {
      const a = typeof answer === "boolean" ? answer : null;
      const ok = a === q.correct;
      return {
        type: "tf",
        score: ok ? 100 : 0,
        correct: ok,
        expected: q.correct,
        feedback: q.explanation,
      };
    }
    case "fill": {
      const arr = Array.isArray(answer) ? (answer as string[]) : [];
      let correctCount = 0;
      for (let i = 0; i < q.blanks.length; i++) {
        if (fillMatches(q.blanks[i], String(arr[i] ?? ""))) correctCount++;
      }
      const score = Math.round((correctCount / q.blanks.length) * 100);
      return {
        type: "fill",
        score,
        correct: correctCount === q.blanks.length,
        expected: q.blanks.map((b) => b[0]),
      };
    }
    case "match": {
      const arr = Array.isArray(answer) ? (answer as string[]) : [];
      let correctCount = 0;
      for (let i = 0; i < q.right.length; i++) {
        if (String(arr[i] ?? "").trim() === q.right[i]) correctCount++;
      }
      const score = Math.round((correctCount / q.right.length) * 100);
      return {
        type: "match",
        score,
        correct: correctCount === q.right.length,
        expected: q.right,
      };
    }
    case "open": {
      const a = typeof answer === "string" ? answer : "";
      const r = await gradeOpenAnswer({
        question: q.q,
        sample: q.sample,
        rubric: q.rubric,
        answer: a,
      });
      return {
        type: "open",
        score: r.score,
        correct: r.score >= 70,
        feedback: r.feedback,
        sample: q.sample,
      };
    }
  }
}

export async function POST(req: Request) {
  await ensureSchema();
  const session = await getServerSession(authOptions);
  const uid = (session?.user as { id?: string } | undefined)?.id;
  if (!uid) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as {
    examId?: string;
    sugiyaId?: number;
    answers?: unknown[];
  };
  const { examId, sugiyaId, answers } = body;
  if (!examId || typeof sugiyaId !== "number" || !Array.isArray(answers)) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
  const exam = getExam(examId);
  if (!exam) return NextResponse.json({ error: "exam not found" }, { status: 404 });
  const sugiya = exam.sugiyot.find((s) => s.id === sugiyaId);
  if (!sugiya) return NextResponse.json({ error: "sugiya not found" }, { status: 404 });
  if (answers.length !== sugiya.questions.length) {
    return NextResponse.json({ error: "answer count mismatch" }, { status: 400 });
  }

  // Grade in parallel — Claude calls run concurrently for speed
  const perQuestion = await Promise.all(
    sugiya.questions.map((q, i) => gradeQuestion(q, answers[i])),
  );
  const total = perQuestion.reduce((s, r) => s + r.score, 0);
  const score = Math.round(total / perQuestion.length);
  const passed = score >= 70;

  const c = db();
  const existing = await c.execute({
    sql: "SELECT completed, score, attempts FROM progress WHERE user_id = ? AND exam_id = ? AND sugiya_id = ?",
    args: [uid, examId, sugiyaId],
  });
  const prev = existing.rows[0] as unknown as
    | { completed: number; score: number | null; attempts: number }
    | undefined;
  const wasCompleted = !!prev?.completed;
  const prevBest = prev?.score ?? 0;
  const attempts = (prev?.attempts ?? 0) + 1;
  const newCompleted = wasCompleted || passed;
  const newScore = Math.max(prevBest, score);

  await c.execute({
    sql: `INSERT INTO progress (user_id, exam_id, sugiya_id, completed, score, attempts, last_attempt)
          VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
          ON CONFLICT(user_id, exam_id, sugiya_id) DO UPDATE SET
            completed = excluded.completed,
            score = excluded.score,
            attempts = excluded.attempts,
            last_attempt = excluded.last_attempt`,
    args: [uid, examId, sugiyaId, newCompleted ? 1 : 0, newScore, attempts],
  });

  let xpGained = 0;
  const xpEvents: string[] = [];
  let leveledUp = false;
  let newLevel = 0;

  if (passed && !wasCompleted) {
    xpGained += XP.PASS_QUIZ;
    xpEvents.push("pass");
    if (score === 100) {
      xpGained += XP.PERFECT_BONUS;
      xpEvents.push("perfect");
    }
    const totalSugiyot = exam.sugiyot.length;
    const completedCount = await c.execute({
      sql: "SELECT COUNT(*) AS n FROM progress WHERE user_id = ? AND exam_id = ? AND completed = 1",
      args: [uid, examId],
    });
    const n = Number(completedCount.rows[0]?.n ?? 0);
    if (n === totalSugiyot) {
      xpGained += XP.ALL_SUGIYOT_BONUS;
      xpEvents.push("all_sugiyot");
    }
  }

  if (xpGained > 0) {
    const before = await c.execute({
      sql: "SELECT xp, level FROM users WHERE id = ?",
      args: [uid],
    });
    const beforeXp = Number(before.rows[0]?.xp ?? 0);
    const beforeLevel = Number(before.rows[0]?.level ?? 1);
    const afterXp = beforeXp + xpGained;
    const afterLevel = levelFromXp(afterXp).level;
    leveledUp = afterLevel > beforeLevel;
    newLevel = afterLevel;
    await c.execute({
      sql: "UPDATE users SET xp = ?, level = ? WHERE id = ?",
      args: [afterXp, afterLevel, uid],
    });
    await c.execute({
      sql: "INSERT INTO xp_log (user_id, amount, reason) VALUES (?, ?, ?)",
      args: [uid, xpGained, xpEvents.join(",")],
    });
  }

  return NextResponse.json({
    ok: true,
    passed,
    newCompleted,
    score,
    perQuestion,
    xpGained,
    xpEvents,
    leveledUp,
    newLevel,
  });
}
