"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LEVELS } from "@/lib/xp";

type Student = {
  id: string;
  name: string;
  email: string | null;
  xp: number;
  level: number;
  last_login: string | null;
  exam1Done: number;
  exam1Total: number;
  exam2Done: number;
  exam2Total: number;
  avgScore: number | null;
  attempts: number;
};

export default function DashboardPage() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[] | null>(null);
  const [leaderboardEnabled, setLeaderboardEnabled] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState<Student | null>(null);
  const [confirmReset, setConfirmReset] = useState<Student | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  async function load() {
    const me = await fetch("/api/me").then((r) => r.json());
    if (!me.teacher) {
      router.replace("/");
      return;
    }
    const [s, settings] = await Promise.all([
      fetch("/api/students").then((r) => r.json()),
      fetch("/api/settings").then((r) => r.json()),
    ]);
    setStudents(s.students);
    setLeaderboardEnabled(!!settings.leaderboard_enabled);
  }

  useEffect(() => {
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function toggleLeaderboard() {
    const next = !leaderboardEnabled;
    setLeaderboardEnabled(next);
    await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leaderboard_enabled: next }),
    });
  }

  async function deleteStudent(s: Student) {
    await fetch(`/api/students/${s.id}`, { method: "DELETE" });
    setConfirmDelete(null);
    await load();
  }

  async function resetStudent(s: Student) {
    await fetch(`/api/students/${s.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reset" }),
    });
    setConfirmReset(null);
    await load();
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold text-primary flex-1">דשבורד מורה</h1>
        <button
          onClick={() => setShowAdd(true)}
          className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-light"
        >
          + הוסף תלמיד
        </button>
        <a
          href="/api/students/export"
          className="bg-bg-card border border-border px-4 py-2 rounded-lg hover:bg-gray-50"
        >
          ייצוא CSV
        </a>
        <label className="flex items-center gap-2 bg-bg-card border border-border px-4 py-2 rounded-lg cursor-pointer">
          <span>לוח הישגים פעיל</span>
          <input
            type="checkbox"
            checked={leaderboardEnabled}
            onChange={toggleLeaderboard}
            className="w-5 h-5 accent-primary"
          />
        </label>
      </div>

      {!students ? (
        <div className="text-text-secondary">טוען תלמידים...</div>
      ) : students.length === 0 ? (
        <div className="bg-bg-card border border-border rounded-xl p-6 text-center text-text-secondary">
          עדיין אין תלמידים רשומים
        </div>
      ) : (
        <div className="bg-bg-card rounded-xl shadow-sm border border-border overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-primary text-white">
              <tr>
                <th className="px-3 py-2.5">שם</th>
                <th className="px-3 py-2.5 hidden md:table-cell">אימייל</th>
                <th className="px-3 py-2.5">מבחן 1</th>
                <th className="px-3 py-2.5">מבחן 2</th>
                <th className="px-3 py-2.5">ממוצע</th>
                <th className="px-3 py-2.5">XP</th>
                <th className="px-3 py-2.5 hidden md:table-cell">כניסה אחרונה</th>
                <th className="px-3 py-2.5">פעולות</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => {
                const lvl = LEVELS.find((l) => l.level === s.level) ?? LEVELS[0];
                return (
                  <tr key={s.id} className="border-t border-border">
                    <td className="px-3 py-2.5 font-semibold">{s.name}</td>
                    <td className="px-3 py-2.5 hidden md:table-cell text-text-secondary">
                      {s.email ?? "—"}
                    </td>
                    <td className="px-3 py-2.5 tabular-nums">
                      {s.exam1Done}/{s.exam1Total}
                    </td>
                    <td className="px-3 py-2.5 tabular-nums">
                      {s.exam2Done}/{s.exam2Total}
                    </td>
                    <td className="px-3 py-2.5 tabular-nums">
                      {s.avgScore != null ? `${s.avgScore}%` : "—"}
                    </td>
                    <td className="px-3 py-2.5 tabular-nums whitespace-nowrap">
                      {lvl.icon} {s.xp}
                    </td>
                    <td className="px-3 py-2.5 hidden md:table-cell text-text-secondary text-xs">
                      {s.last_login ? new Date(s.last_login).toLocaleString("he-IL") : "—"}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <button
                        onClick={() => setConfirmReset(s)}
                        className="text-warning hover:underline ml-3"
                      >
                        איפוס
                      </button>
                      <button
                        onClick={() => setConfirmDelete(s)}
                        className="text-danger hover:underline"
                      >
                        מחיקה
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {confirmDelete && (
        <ConfirmModal
          title="מחיקת תלמיד"
          message={`האם אתה בטוח שברצונך להסיר את ${confirmDelete.name} מהמצבת? כל הנתונים יימחקו.`}
          confirmText="כן, מחק"
          tone="danger"
          onConfirm={() => deleteStudent(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
      {confirmReset && (
        <ConfirmModal
          title="איפוס התקדמות"
          message={`לאפס את כל ההתקדמות של ${confirmReset.name}?`}
          confirmText="כן, אפס"
          tone="warning"
          onConfirm={() => resetStudent(confirmReset)}
          onCancel={() => setConfirmReset(null)}
        />
      )}
      {showAdd && (
        <AddStudentModal
          onClose={() => setShowAdd(false)}
          onAdded={async () => {
            setShowAdd(false);
            await load();
          }}
        />
      )}
    </main>
  );
}

function ConfirmModal({
  title,
  message,
  confirmText,
  tone,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  confirmText: string;
  tone: "danger" | "warning";
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const btnCls =
    tone === "danger" ? "bg-danger hover:bg-red-700" : "bg-warning hover:bg-orange-600";
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full">
        <h2 className="text-lg font-bold text-primary mb-2">{title}</h2>
        <p className="text-text-secondary mb-5">{message}</p>
        <div className="flex gap-2 justify-end">
          <button onClick={onCancel} className="px-4 py-2 rounded-lg border border-border">
            ביטול
          </button>
          <button onClick={onConfirm} className={`text-white px-4 py-2 rounded-lg ${btnCls}`}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

function AddStudentModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setErr("יש להזין שם");
      return;
    }
    setBusy(true);
    setErr(null);
    const r = await fetch("/api/students", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), email: email.trim() || undefined }),
    });
    if (r.ok) {
      onAdded();
    } else {
      const d = await r.json().catch(() => ({}));
      setErr(d.error ?? "שגיאה");
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <form onSubmit={submit} className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full space-y-3">
        <h2 className="text-lg font-bold text-primary">הוספת תלמיד</h2>
        <div>
          <label className="block text-sm mb-1">שם</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm mb-1">אימייל (אופציונלי)</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-border rounded px-3 py-2"
          />
        </div>
        {err && <div className="text-danger text-sm">{err}</div>}
        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-border"
          >
            ביטול
          </button>
          <button
            type="submit"
            disabled={busy}
            className="px-4 py-2 rounded-lg bg-primary text-white disabled:opacity-50"
          >
            {busy ? "..." : "הוסף"}
          </button>
        </div>
      </form>
    </div>
  );
}
