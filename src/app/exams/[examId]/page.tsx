"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { EXAMS, getExam } from "@/lib/exams-data";
import Timeline from "@/components/Timeline";

export default function ExamMapPage() {
  const { examId } = useParams<{ examId: string }>();
  const exam = getExam(examId);
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!exam) return;
    fetch(`/api/progress?examId=${exam.id}`)
      .then((r) => r.json())
      .then((d) => {
        const s = new Set<number>();
        for (const row of d.rows ?? []) {
          if (row.completed) s.add(Number(row.sugiya_id));
        }
        setCompleted(s);
      })
      .finally(() => setLoading(false));
  }, [exam]);

  if (!EXAMS.some((e) => e.id === examId)) return notFound();
  if (!exam) return null;

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <Link href="/exams" className="text-sm text-text-secondary hover:text-primary">
        ← חזרה לבחירת מבחנים
      </Link>
      <header className="mt-2 mb-6">
        <div className="text-accent font-bold">{exam.title}</div>
        <h1 className="text-3xl font-bold text-primary">{exam.subtitle}</h1>
        <p className="text-text-secondary text-sm mt-1">דפים: {exam.pages}</p>
        <div className="mt-3 text-sm">
          <span className="text-text-secondary">התקדמות: </span>
          <span className="font-bold">
            {completed.size}/{exam.sugiyot.length}
          </span>
          <div className="mt-1 h-2 bg-gray-200 rounded-full overflow-hidden max-w-md">
            <div
              className="h-full bg-success progress-fill"
              style={{
                width: `${Math.round((completed.size / exam.sugiyot.length) * 100)}%`,
              }}
            />
          </div>
        </div>
      </header>

      {loading ? (
        <div className="text-text-secondary">טוען התקדמות...</div>
      ) : (
        <Timeline examId={exam.id} sugiyot={exam.sugiyot} completedIds={completed} />
      )}
    </main>
  );
}
