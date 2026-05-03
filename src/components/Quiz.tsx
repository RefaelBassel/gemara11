"use client";

import { useMemo, useState } from "react";
import type { Question } from "@/lib/exams-data";

type Result = {
  passed: boolean;
  score: number;
  xpGained: number;
  xpEvents: string[];
  leveledUp: boolean;
  newLevel: number;
};

export default function Quiz({
  questions,
  examId,
  sugiyaId,
  onAdvance,
  onAwarded,
  alreadyCompleted,
}: {
  questions: Question[];
  examId: string;
  sugiyaId: number;
  onAdvance: () => void;
  onAwarded: (r: Result) => void;
  alreadyCompleted: boolean;
}) {
  const [answers, setAnswers] = useState<(number | null)[]>(() => questions.map(() => null));
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);

  const score = useMemo(() => {
    const correct = answers.filter((a, i) => a === questions[i].correct).length;
    return Math.round((correct / questions.length) * 100);
  }, [answers, questions]);

  const allAnswered = answers.every((a) => a !== null);
  const passed = score >= 70;

  async function submit() {
    if (!allAnswered || busy) return;
    setBusy(true);
    setSubmitted(true);
    try {
      const res = await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ examId, sugiyaId, score }),
      });
      const data = await res.json();
      const r: Result = {
        passed: data.passed,
        score: data.score,
        xpGained: data.xpGained,
        xpEvents: data.xpEvents,
        leveledUp: data.leveledUp,
        newLevel: data.newLevel,
      };
      setResult(r);
      onAwarded(r);
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setAnswers(questions.map(() => null));
    setSubmitted(false);
    setResult(null);
  }

  return (
    <div className="space-y-5">
      {questions.map((q, i) => {
        const userAns = answers[i];
        return (
          <div key={i} className="bg-bg-card rounded-xl border border-border p-4 shadow-sm">
            <div className="font-semibold mb-3">
              <span className="text-primary-light">שאלה {i + 1}.</span> {q.q}
            </div>
            <div className="space-y-2">
              {q.options.map((opt, j) => {
                const isSel = userAns === j;
                const isCorrect = j === q.correct;
                let cls = "border-border bg-white hover:border-primary-light cursor-pointer";
                if (submitted) {
                  if (isCorrect) cls = "border-success bg-green-50";
                  else if (isSel) cls = "border-danger bg-red-50";
                  else cls = "border-border bg-white opacity-70";
                } else if (isSel) {
                  cls = "border-primary bg-blue-50";
                }
                return (
                  <label
                    key={j}
                    className={`block border-2 rounded-lg p-3 transition ${cls}`}
                  >
                    <input
                      type="radio"
                      name={`q${i}`}
                      checked={isSel}
                      disabled={submitted}
                      onChange={() => {
                        const c = [...answers];
                        c[i] = j;
                        setAnswers(c);
                      }}
                      className="ml-2"
                    />
                    {opt}
                    {submitted && isCorrect && <span className="mr-2 text-success font-bold">✓</span>}
                    {submitted && isSel && !isCorrect && (
                      <span className="mr-2 text-danger font-bold">✗</span>
                    )}
                  </label>
                );
              })}
            </div>
          </div>
        );
      })}

      {!submitted ? (
        <div className="flex justify-end">
          <button
            disabled={!allAnswered || busy}
            onClick={submit}
            className="bg-primary text-white px-6 py-2.5 rounded-lg font-semibold disabled:opacity-50 hover:bg-primary-light transition"
          >
            {busy ? "שולח..." : "שלח תשובות"}
          </button>
        </div>
      ) : (
        <div
          className={`rounded-xl p-4 border-2 ${
            passed ? "border-success bg-green-50" : "border-danger bg-red-50"
          }`}
        >
          <div className="text-lg font-bold">
            {passed ? "כל הכבוד! עברת את הבוחן" : "לא עברת — נסה שוב"}
          </div>
          <div className="mt-1">
            ציון: <span className="font-bold">{score}%</span>
            {alreadyCompleted && (
              <span className="text-text-secondary text-sm mr-2">(כבר הושלם — לא הוענק XP נוסף)</span>
            )}
          </div>
          {result && result.xpGained > 0 && (
            <div className="mt-2 text-success font-semibold">+{result.xpGained} XP</div>
          )}
          <div className="mt-3 flex gap-2 flex-wrap">
            <button onClick={reset} className="bg-white border border-border px-4 py-2 rounded-lg hover:bg-gray-50">
              נסה שוב
            </button>
            {(passed || alreadyCompleted) && (
              <button
                onClick={onAdvance}
                className="bg-success text-white px-4 py-2 rounded-lg hover:bg-green-600"
              >
                המשך לסוגיה הבאה ←
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
