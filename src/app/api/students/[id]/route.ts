import { NextResponse } from "next/server";
import { db, ensureSchema } from "@/lib/db";
import { isTeacher } from "@/lib/teacher";

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  if (!isTeacher()) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  await ensureSchema();
  const c = db();
  await c.batch(
    [
      { sql: "DELETE FROM progress WHERE user_id = ?", args: [params.id] },
      { sql: "DELETE FROM xp_log WHERE user_id = ?", args: [params.id] },
      { sql: "DELETE FROM daily_logins WHERE user_id = ?", args: [params.id] },
      { sql: "DELETE FROM users WHERE id = ?", args: [params.id] },
    ],
    "write",
  );
  return NextResponse.json({ ok: true });
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  if (!isTeacher()) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  await ensureSchema();
  const body = (await req.json().catch(() => ({}))) as { action?: string };
  if (body.action === "reset") {
    const c = db();
    await c.batch(
      [
        { sql: "DELETE FROM progress WHERE user_id = ?", args: [params.id] },
        { sql: "DELETE FROM xp_log WHERE user_id = ?", args: [params.id] },
        { sql: "UPDATE users SET xp = 0, level = 1 WHERE id = ?", args: [params.id] },
      ],
      "write",
    );
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "unknown action" }, { status: 400 });
}
