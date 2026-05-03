"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import XPBar from "./XPBar";

type Me = {
  user: { id: string; name: string; xp: number; level: number; role: string } | null;
  teacher: boolean;
};

export default function Navbar() {
  const { status } = useSession();
  const [me, setMe] = useState<Me | null>(null);
  const [leaderboardEnabled, setLeaderboardEnabled] = useState(true);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((d) => setMe(d))
      .catch(() => {});
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => setLeaderboardEnabled(!!d.leaderboard_enabled))
      .catch(() => {});
  }, [status]);

  const isTeacher = me?.teacher;
  const user = me?.user;

  async function teacherLogout() {
    await fetch("/api/teacher/logout", { method: "POST" });
    window.location.href = "/";
  }

  return (
    <header className="bg-primary text-white shadow-md">
      <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center gap-4">
        <Link href={isTeacher ? "/dashboard" : "/exams"} className="font-bold text-lg whitespace-nowrap">
          📖 גמרא — כיתה יא
        </Link>

        {isTeacher ? (
          <>
            <span className="opacity-90">מורה</span>
            <Link
              href="/dashboard"
              className="bg-accent text-primary px-3 py-1.5 rounded font-semibold hover:bg-amber-300 transition"
            >
              דשבורד ←
            </Link>
            <div className="flex-1" />
            <button
              onClick={teacherLogout}
              className="bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded text-sm"
            >
              יציאה
            </button>
          </>
        ) : user ? (
          <>
            <span className="opacity-90">{user.name}</span>
            <div className="bg-white/10 rounded-lg px-3 py-1.5">
              <XPBar xp={user.xp} compact />
            </div>
            {leaderboardEnabled && (
              <Link href="/leaderboard" className="text-sm hover:text-accent transition">
                לוח הישגים 🏆
              </Link>
            )}
            <div className="flex-1" />
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded text-sm"
            >
              יציאה
            </button>
          </>
        ) : (
          <div className="flex-1" />
        )}
      </div>
    </header>
  );
}
