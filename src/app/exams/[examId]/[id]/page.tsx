"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { notFound, useParams, useRouter } from "next/navigation";
import { getExam, getSugiya, pdfHref } from "@/lib/exams-data";
import Quiz from "@/components/Quiz";
import LevelUpModal from "@/components/LevelUpModal";

type Tab = "gemara" | "quiz";

export default function SugiyaPage() {
  const { examId, id } = useParams<{ examId: string; id: string }>();
  const router = useRouter();
  const exam = getExam(examId);
  const sugiyaId = Number(id);
  const sugiya = exam ? getSugiya(exam.id, sugiyaId) : undefined;

  const [tab, setTab] = useState<Tab>("gemara");
  const [completedIds, setCompletedIds] = useState<Set<number>>(new Set());
  const [loaded, setLoaded] = useState(false);
  const [floats, setFloats] = useState<{ id: number; amount: number }[]>([]);
  const [levelUp, setLevelUp] = useState<number | null>(null);

  useEffect(() => {
    if (!exam) return;
    fetch(`/api/progress?examId=${examEntry.id}`)
      .then((r) => r.json())
      .then((d) => {
        const s = new Set<number>();
        for (const row of d.rows ?? []) {
          if (row.completed) s.add(Number(row.sugiya_id));
        }
        setCompletedIds(s);
        setLoaded(true);
      });
  }, [exam]);

  if (!exam || !sugiya) return notFound();
  const examEntry = exam;
  const sugiyaEntry = sugiya;

  const idxInExam = examEntry.sugiyot.findIndex((s) => s.id === sugiyaEntry.id);
  const prevSugiya = idxInExam > 0 ? examEntry.sugiyot[idxInExam - 1] : null;
  const isLocked =
    loaded && !!prevSugiya && !completedIds.has(prevSugiya.id) && !completedIds.has(sugiyaEntry.id);
  const alreadyCompleted = completedIds.has(sugiyaEntry.id);
  const next = examEntry.sugiyot.find((s) => s.id === sugiyaEntry.id + 1);

  function pushFloat(amount: number) {
    if (amount <= 0) return;
    const id = Date.now() + Math.random();
    setFloats((f) => [...f, { id, amount }]);
    setTimeout(() => setFloats((f) => f.filter((x) => x.id !== id)), 1500);
  }

  function handleAwarded(r: {
    xpGained: number;
    leveledUp: boolean;
    newLevel: number;
    newCompleted?: boolean;
  }) {
    if (r.xpGained > 0) pushFloat(r.xpGained);
    if (r.leveledUp) setLevelUp(r.newLevel);
    setCompletedIds((s) => new Set([...s, sugiyaEntry.id]));
  }

  function advance() {
    if (next) {
      router.push(`/exams/${examEntry.id}/${next.id}`);
    } else {
      router.push(`/exams/${examEntry.id}`);
    }
  }

  if (isLocked) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-12 text-center">
        <div className="text-5xl mb-3">🔒</div>
        <h1 className="text-2xl font-bold text-primary mb-2">סוגיה זו נעולה</h1>
        <p className="text-text-secondary mb-4">
          השלם תחילה את הסוגיה הקודמת — &quot;{prevSugiya?.title}&quot;
        </p>
        <Link
          href={`/exams/${examEntry.id}/${prevSugiya!.id}`}
          className="bg-primary text-white px-5 py-2 rounded-lg hover:bg-primary-light"
        >
          ← לסוגיה הקודמת
        </Link>
      </main>
    );
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-6 relative">
      <Link href={`/exams/${examEntry.id}`} className="text-sm text-text-secondary hover:text-primary">
        ← חזרה למפת הסוגיות
      </Link>

      <header className="mt-2 mb-4">
        <div className="text-accent text-sm font-bold">
          {examEntry.title}: {examEntry.subtitle} · סוגיה {sugiyaEntry.id}/{examEntry.sugiyot.length}
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-primary">{sugiyaEntry.title}</h1>
      </header>

      <div className="flex border-b border-border mb-5">
        <button
          onClick={() => setTab("gemara")}
          className={`px-5 py-2.5 font-semibold border-b-2 -mb-px ${
            tab === "gemara"
              ? "border-primary text-primary"
              : "border-transparent text-text-secondary hover:text-primary"
          }`}
        >
          דף גמרא
        </button>
        <button
          onClick={() => setTab("quiz")}
          className={`px-5 py-2.5 font-semibold border-b-2 -mb-px ${
            tab === "quiz"
              ? "border-primary text-primary"
              : "border-transparent text-text-secondary hover:text-primary"
          }`}
        >
          בוחן ({sugiyaEntry.questions.length})
        </button>
      </div>

      {tab === "gemara" ? (
        <div className="space-y-4">
          {sugiyaEntry.pdfs.map((p) => (
            <div key={p}>
              <div className="text-sm text-text-secondary mb-1">{p.replace(".pdf", "").replace("_", ",")}</div>
              <iframe src={pdfHref(p)} className="pdf-frame" title={p} />
            </div>
          ))}
          <div className="flex justify-end">
            <button
              onClick={() => setTab("quiz")}
              className="bg-primary text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-primary-light"
            >
              למבחן ←
            </button>
          </div>
        </div>
      ) : (
        <Quiz
          questions={sugiyaEntry.questions}
          examId={examEntry.id}
          sugiyaId={sugiyaEntry.id}
          key={sugiyaEntry.id}
          alreadyCompleted={alreadyCompleted}
          onAdvance={advance}
          onAwarded={handleAwarded}
        />
      )}

      <div className="pointer-events-none fixed top-24 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-2">
        {floats.map((f) => (
          <div
            key={f.id}
            className="text-2xl font-bold text-success animate-float-up bg-white/90 px-4 py-1.5 rounded-full shadow-lg"
          >
            +{f.amount} XP
          </div>
        ))}
      </div>

      {levelUp !== null && <LevelUpModal level={levelUp} onClose={() => setLevelUp(null)} />}
    </main>
  );
}
