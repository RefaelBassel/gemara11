import { NextResponse } from "next/server";
import { getSetting, setSetting } from "@/lib/db";
import { isTeacher } from "@/lib/teacher";

export const dynamic = "force-dynamic";

export async function GET() {
  const leaderboardEnabled = (await getSetting("leaderboard_enabled")) === "true";
  return NextResponse.json({ leaderboard_enabled: leaderboardEnabled });
}

export async function POST(req: Request) {
  if (!isTeacher()) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const body = (await req.json().catch(() => ({}))) as {
    leaderboard_enabled?: boolean;
  };
  if (typeof body.leaderboard_enabled === "boolean") {
    await setSetting("leaderboard_enabled", body.leaderboard_enabled ? "true" : "false");
  }
  return NextResponse.json({ ok: true });
}
