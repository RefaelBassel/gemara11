import { NextResponse } from "next/server";
import { clearTeacherCookie } from "@/lib/teacher";

export async function POST() {
  clearTeacherCookie();
  return NextResponse.json({ ok: true });
}
