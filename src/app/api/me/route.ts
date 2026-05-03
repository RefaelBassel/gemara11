import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db, ensureSchema } from "@/lib/db";
import { isTeacher } from "@/lib/teacher";

export const dynamic = "force-dynamic";

export async function GET() {
  await ensureSchema();
  const session = await getServerSession(authOptions);
  const teacher = isTeacher();
  const uid = (session?.user as { id?: string } | undefined)?.id;
  if (!uid) {
    return NextResponse.json({ user: null, teacher });
  }
  const r = await db().execute({
    sql: "SELECT id, name, email, role, xp, level FROM users WHERE id = ?",
    args: [uid],
  });
  const u = r.rows[0];
  if (!u) return NextResponse.json({ user: null, teacher });
  return NextResponse.json({
    user: {
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      xp: u.xp,
      level: u.level,
    },
    teacher,
  });
}
