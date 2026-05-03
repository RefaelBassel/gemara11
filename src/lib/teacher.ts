import { cookies } from "next/headers";

const COOKIE = "teacher_session";

export function teacherPin(): string {
  return process.env.TEACHER_PIN ?? "1234";
}

export function isTeacher(): boolean {
  return cookies().get(COOKIE)?.value === "1";
}

export function setTeacherCookie() {
  cookies().set(COOKIE, "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}

export function clearTeacherCookie() {
  cookies().set(COOKIE, "", { path: "/", maxAge: 0 });
}
