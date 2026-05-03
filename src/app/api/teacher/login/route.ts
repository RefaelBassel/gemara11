import { NextResponse } from "next/server";
import { setTeacherCookie, teacherPin } from "@/lib/teacher";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const pin = (body as { pin?: string }).pin;
  if (!pin || pin !== teacherPin()) {
    return NextResponse.json({ error: "PIN שגוי" }, { status: 401 });
  }
  setTeacherCookie();
  return NextResponse.json({ ok: true });
}
