"use client";

import { signIn, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [teacher, setTeacher] = useState(false);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.teacher) {
          router.replace("/dashboard");
        } else if (d.user) {
          router.replace("/exams");
        }
      })
      .catch(() => {});
  }, [router, status]);

  useEffect(() => {
    if (session) router.replace("/exams");
  }, [session, router]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-primary to-primary-light flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 text-center">
        <div className="text-5xl mb-3">📖</div>
        <h1 className="text-2xl font-bold text-primary mb-1">גמרא — כיתה יא</h1>
        <p className="text-text-secondary mb-6">הכנה למבחנים</p>

        {!teacher ? (
          <>
            <button
              onClick={() => signIn("google", { callbackUrl: "/exams" })}
              className="w-full bg-white border-2 border-border hover:border-primary px-4 py-3 rounded-lg flex items-center justify-center gap-2 font-semibold transition"
            >
              <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden>
                <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.5-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.5 6.5 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z"/>
                <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16.1 19 13 24 13c3 0 5.8 1.1 7.9 3l5.7-5.7C34.5 6.5 29.5 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
                <path fill="#4CAF50" d="M24 44c5.4 0 10.3-2.1 14-5.5l-6.5-5.3c-2 1.5-4.6 2.4-7.5 2.4-5.3 0-9.7-3.5-11.3-8L6.1 33C9.4 39.6 16.1 44 24 44z"/>
                <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4 5.6l6.5 5.3C40.8 36 44 30.4 44 24c0-1.3-.1-2.3-.4-3.5z"/>
              </svg>
              כניסה עם Google
            </button>
            <button
              onClick={() => setTeacher(true)}
              className="mt-4 text-sm text-text-secondary hover:text-primary"
            >
              כניסת מורה →
            </button>
          </>
        ) : (
          <TeacherLogin onCancel={() => setTeacher(false)} />
        )}
      </div>
    </main>
  );
}

function TeacherLogin({ onCancel }: { onCancel: () => void }) {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function go(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const r = await fetch("/api/teacher/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin }),
    });
    if (r.ok) {
      router.replace("/dashboard");
    } else {
      const d = await r.json().catch(() => ({}));
      setErr(d.error ?? "PIN שגוי");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={go} className="space-y-3 text-right">
      <h2 className="text-lg font-semibold text-primary">כניסת מורה</h2>
      <input
        type="password"
        inputMode="numeric"
        autoFocus
        value={pin}
        onChange={(e) => setPin(e.target.value)}
        placeholder="PIN"
        className="w-full border-2 border-border rounded-lg px-3 py-2 text-center tracking-widest text-lg"
      />
      {err && <div className="text-danger text-sm">{err}</div>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={busy}
          className="flex-1 bg-primary text-white px-4 py-2 rounded-lg font-semibold disabled:opacity-50"
        >
          {busy ? "..." : "כניסה"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-lg border border-border hover:bg-gray-50"
        >
          חזרה
        </button>
      </div>
      <Link href="/" className="block text-xs text-text-secondary text-center">
        ← דף ראשי
      </Link>
    </form>
  );
}
