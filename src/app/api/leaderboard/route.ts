import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db, ensureSchema, getSetting } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  await ensureSchema();
  const enabled = (await getSetting("leaderboard_enabled")) === "true";
  if (!enabled) {
    return NextResponse.json({ enabled: false, rows: [] });
  }
  const session = await getServerSession(authOptions);
  const uid = (session?.user as { id?: string } | undefined)?.id ?? null;

  const r = await db().execute(
    `SELECT u.id, u.name, u.xp, u.level,
            (SELECT COUNT(*) FROM progress p WHERE p.user_id = u.id AND p.completed = 1) AS done,
            (SELECT ROUND(AVG(score)) FROM progress p WHERE p.user_id = u.id AND p.score IS NOT NULL) AS avg_score
     FROM users u
     WHERE u.role = 'student'
     ORDER BY u.xp DESC, u.name ASC`,
  );
  return NextResponse.json({
    enabled: true,
    me: uid,
    rows: r.rows,
  });
}
