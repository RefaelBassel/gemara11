"use client";

import { useMemo, useState } from "react";
import type { Question } from "@/lib/exams-data";

type AnswerResult = {
  type: Question["type"];
  score: number;
  correct?: boolean;
  feedback?: string;
  sample?: string;
  expected?: unknown;
};

type SubmitResult = {
  passed: boolean;
  score: number;
  xpGained: number;
  xpEvents: string[];
  leveledUp: boolean;
  newLevel: number;
  perQuestion: AnswerResult[];
};

// Per-question answer types
type Answer = number | boolean | string | string[] | null;

function emptyAnswer(q: Question): Answer {
  switch (q.type) {
    case "multi":
      return null;
    case "tf":
      return null;
    case "open":
      return "";
    case "fill":
      return q.blanks.map(() => "");
    case "match":
      return q.left.map(() => "");
  }
}

function isAnswered(q: Question, a: Answer): boolean {
  switch (q.type) {
    case "multi":
      return typeof a === "number";
    case "tf":
      return typeof a === "boolean";
    case "open":
      return typeof a === "string" && a.trim().length > 0;
    case "fill":
      return Array.isArray(a) && a.every((x) => x.trim().length > 0);
    case "match":
      return Array.isArray(a) && a.every((x) => x.trim().length > 0);
  }
}

// Stable shuffle (deterministic per question by string hash) so the right column
// stays consistent within a single quiz attempt.
function shuffle<T>(items: T[], seed: string): T[] {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    h = (h * 1103515245 + 12345) & 0x7fffffff;
    const j = h % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

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
  onAwarded: (r: SubmitResult) => void;
  alreadyCompleted: boolean;
}) {
  const [answers, setAnswers] = useState<Answer[]>(() => questions.map(emptyAnswer));
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<SubmitResult | null>(null);

  const allAnswered = useMemo(
    () => questions.every((q, i) => isAnswered(q, answers[i])),
    [questions, answers],
  );

  function setAnswer(i: number, v: Answer) {
    const c = [...answers];
    c[i] = v;
    setAnswers(c);
  }

  async function submit() {
    if (!allAnswered || busy) return;
    setBusy(true);
    setSubmitted(true);
    try {
      const res = await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ examId, sugiyaId, answers }),
      });
      const data = (await res.json()) as SubmitResult & { error?: string };
      if (data.error) {
        alert(data.error);
        setSubmitted(false);
        return;
      }
      setResult(data);
      onAwarded(data);
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setAnswers(questions.map(emptyAnswer));
    setSubmitted(false);
    setResult(null);
  }

  const passed = result ? result.passed : false;

  return (
    <div className="space-y-5">
      {questions.map((q, i) => (
        <QuestionCard
          key={i}
          index={i}
          q={q}
          answer={answers[i]}
          onChange={(v) => setAnswer(i, v)}
          submitted={submitted}
          result={result?.perQuestion[i]}
        />
      ))}

      {!submitted ? (
        <div className="flex justify-end gap-3 items-center">
          {!allAnswered && (
            <span className="text-sm text-text-secondary">
              ענה על כל השאלות לפני השליחה
            </span>
          )}
          <button
            disabled={!allAnswered || busy}
            onClick={submit}
            className="bg-primary text-white px-6 py-2.5 rounded-lg font-semibold disabled:opacity-50 hover:bg-primary-light transition"
          >
            {busy ? "בודק..." : "שלח תשובות"}
          </button>
        </div>
      ) : busy ? (
        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 text-center">
          <div className="text-lg font-bold text-primary">בודק תשובות...</div>
          <div className="text-text-secondary text-sm mt-1">
            הבדיקה של השאלות הפתוחות לוקחת כמה שניות
          </div>
        </div>
      ) : result ? (
        <div
          className={`rounded-xl p-4 border-2 ${
            passed ? "border-success bg-green-50" : "border-danger bg-red-50"
          }`}
        >
          <div className="text-lg font-bold">
            {passed ? "כל הכבוד! עברת את הבוחן" : "לא עברת — נסה שוב"}
          </div>
          <div className="mt-1">
            ציון: <span className="font-bold">{result.score}%</span>
            {alreadyCompleted && (
              <span className="text-text-secondary text-sm mr-2">
                (כבר הושלם — לא הוענק XP נוסף)
              </span>
            )}
          </div>
          {result.xpGained > 0 && (
            <div className="mt-2 text-success font-semibold">+{result.xpGained} XP</div>
          )}
          <div className="mt-3 flex gap-2 flex-wrap">
            <button
              onClick={reset}
              className="bg-white border border-border px-4 py-2 rounded-lg hover:bg-gray-50"
            >
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
      ) : null}
    </div>
  );
}

// ===== Per-question rendering =====

function QuestionCard({
  index,
  q,
  answer,
  onChange,
  submitted,
  result,
}: {
  index: number;
  q: Question;
  answer: Answer;
  onChange: (v: Answer) => void;
  submitted: boolean;
  result?: AnswerResult;
}) {
  const typeLabel: Record<Question["type"], string> = {
    multi: "רב ברירה",
    open: "פתוחה",
    fill: "השלמה",
    tf: "אמת/שקר",
    match: "התאמה",
  };
  const correctBadge = submitted && result ? (
    <span
      className={`text-xs px-2 py-0.5 rounded ${
        result.correct ? "bg-success text-white" : result.score >= 70 ? "bg-success/80 text-white" : "bg-danger text-white"
      }`}
    >
      {result.score}%
    </span>
  ) : null;

  return (
    <div className="bg-bg-card rounded-xl border border-border p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="font-semibold flex-1">
          <span className="text-primary-light">שאלה {index + 1}.</span>{" "}
          <span className="text-xs text-text-secondary mr-2">[{typeLabel[q.type]}]</span>
        </div>
        {correctBadge}
      </div>

      {q.type === "multi" && (
        <MultiRender q={q} answer={answer as number | null} onChange={onChange} submitted={submitted} />
      )}
      {q.type === "tf" && (
        <TFRender
          q={q}
          answer={answer as boolean | null}
          onChange={onChange}
          submitted={submitted}
        />
      )}
      {q.type === "open" && (
        <OpenRender
          q={q}
          answer={(answer as string) ?? ""}
          onChange={onChange}
          submitted={submitted}
          result={result}
        />
      )}
      {q.type === "fill" && (
        <FillRender
          q={q}
          answer={(answer as string[]) ?? []}
          onChange={onChange}
          submitted={submitted}
          result={result}
        />
      )}
      {q.type === "match" && (
        <MatchRender
          q={q}
          answer={(answer as string[]) ?? []}
          onChange={onChange}
          submitted={submitted}
        />
      )}

      {submitted && result?.feedback && q.type !== "open" && (
        <div className="mt-3 text-sm bg-blue-50 border-r-4 border-blue-400 p-2 rounded">
          {result.feedback}
        </div>
      )}
    </div>
  );
}

function MultiRender({
  q,
  answer,
  onChange,
  submitted,
}: {
  q: Extract<Question, { type: "multi" }>;
  answer: number | null;
  onChange: (v: number) => void;
  submitted: boolean;
}) {
  return (
    <div className="space-y-2">
      <div className="font-medium mb-2">{q.q}</div>
      {q.options.map((opt, j) => {
        const isSel = answer === j;
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
          <label key={j} className={`block border-2 rounded-lg p-3 transition ${cls}`}>
            <input
              type="radio"
              name={q.q}
              checked={isSel}
              disabled={submitted}
              onChange={() => onChange(j)}
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
  );
}

function TFRender({
  q,
  answer,
  onChange,
  submitted,
}: {
  q: Extract<Question, { type: "tf" }>;
  answer: boolean | null;
  onChange: (v: boolean) => void;
  submitted: boolean;
}) {
  function btn(val: boolean, label: string) {
    const isSel = answer === val;
    const isCorrect = val === q.correct;
    let cls = "border-border bg-white hover:border-primary-light";
    if (submitted) {
      if (isCorrect) cls = "border-success bg-green-50 text-success";
      else if (isSel) cls = "border-danger bg-red-50 text-danger";
      else cls = "border-border bg-white opacity-60";
    } else if (isSel) {
      cls = "border-primary bg-blue-50 text-primary";
    }
    return (
      <button
        type="button"
        disabled={submitted}
        onClick={() => onChange(val)}
        className={`flex-1 border-2 rounded-lg py-3 px-4 font-bold text-lg transition ${cls}`}
      >
        {label}
        {submitted && isCorrect && " ✓"}
      </button>
    );
  }
  return (
    <div className="space-y-3">
      <div className="font-medium">{q.q}</div>
      <div className="flex gap-3">
        {btn(true, "אמת")}
        {btn(false, "שקר")}
      </div>
    </div>
  );
}

function OpenRender({
  q,
  answer,
  onChange,
  submitted,
  result,
}: {
  q: Extract<Question, { type: "open" }>;
  answer: string;
  onChange: (v: string) => void;
  submitted: boolean;
  result?: AnswerResult;
}) {
  return (
    <div className="space-y-2">
      <div className="font-medium mb-2">{q.q}</div>
      <textarea
        dir="rtl"
        value={answer}
        onChange={(e) => onChange(e.target.value)}
        disabled={submitted}
        placeholder="כתוב את תשובתך כאן..."
        rows={4}
        className="w-full border-2 border-border rounded-lg p-3 focus:border-primary focus:outline-none disabled:bg-gray-50"
      />
      {submitted && result && (
        <div className="space-y-2 mt-2">
          {result.feedback && (
            <div
              className={`text-sm border-r-4 p-2 rounded ${
                result.score >= 70
                  ? "bg-green-50 border-success"
                  : "bg-amber-50 border-warning"
              }`}
            >
              <div className="font-semibold mb-0.5">משוב Claude:</div>
              {result.feedback}
            </div>
          )}
          {result.sample && (
            <details className="text-sm bg-blue-50 border-r-4 border-blue-400 rounded">
              <summary className="cursor-pointer p-2 font-semibold">תשובה לדוגמה</summary>
              <div className="p-2 pt-0 text-text-primary">{result.sample}</div>
            </details>
          )}
        </div>
      )}
    </div>
  );
}

function FillRender({
  q,
  answer,
  onChange,
  submitted,
  result,
}: {
  q: Extract<Question, { type: "fill" }>;
  answer: string[];
  onChange: (v: string[]) => void;
  submitted: boolean;
  result?: AnswerResult;
}) {
  // Split q.q on placeholders {{0}}, {{1}}, ...
  const parts = q.q.split(/(\{\{\d+\}\})/g);
  const expected = (result?.expected as string[] | undefined) ?? [];

  return (
    <div className="space-y-2">
      <div className="font-medium leading-loose">
        {parts.map((p, i) => {
          const m = p.match(/\{\{(\d+)\}\}/);
          if (!m) return <span key={i}>{p}</span>;
          const idx = Number(m[1]);
          const val = answer[idx] ?? "";
          const exp = expected[idx];
          let cls = "border-primary";
          if (submitted) {
            const u = val.trim().toLowerCase();
            const e = (exp ?? "").trim().toLowerCase();
            cls = u && (u === e || (q.blanks[idx] ?? []).some((a) => a.trim().toLowerCase() === u))
              ? "border-success bg-green-50"
              : "border-danger bg-red-50";
          }
          return (
            <input
              key={i}
              type="text"
              value={val}
              onChange={(e) => {
                const c = [...answer];
                c[idx] = e.target.value;
                onChange(c);
              }}
              disabled={submitted}
              className={`inline-block border-b-2 mx-1 px-2 py-0.5 bg-white text-center min-w-[100px] focus:outline-none ${cls}`}
            />
          );
        })}
      </div>
      {submitted && expected.length > 0 && (
        <div className="text-xs text-text-secondary mt-2">
          תשובה נכונה: {expected.map((e, i) => (
            <span key={i} className="font-semibold mx-1">
              ({i + 1}) {e}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function MatchRender({
  q,
  answer,
  onChange,
  submitted,
}: {
  q: Extract<Question, { type: "match" }>;
  answer: string[];
  onChange: (v: string[]) => void;
  submitted: boolean;
}) {
  // Shuffle the right column for display, deterministic per question text
  const shuffledRight = useMemo(() => shuffle(q.right, q.q), [q]);
  // Compute used: each right item can be used at most once
  const used = new Set(answer.filter(Boolean));

  function setPair(leftIdx: number, val: string) {
    const c = [...answer];
    // If this value was used elsewhere, clear it there
    for (let i = 0; i < c.length; i++) if (c[i] === val) c[i] = "";
    c[leftIdx] = val;
    onChange(c);
  }
  function clear(leftIdx: number) {
    const c = [...answer];
    c[leftIdx] = "";
    onChange(c);
  }

  return (
    <div className="space-y-2">
      <div className="font-medium mb-2">{q.q}</div>
      <div className="space-y-2">
        {q.left.map((leftItem, i) => {
          const sel = answer[i] ?? "";
          const isCorrect = submitted && sel === q.right[i];
          const cls = submitted
            ? isCorrect
              ? "border-success bg-green-50"
              : "border-danger bg-red-50"
            : "border-border bg-gray-50";
          return (
            <div key={i} className={`border-2 rounded-lg p-3 ${cls}`}>
              <div className="font-semibold mb-2 text-sm">{leftItem}</div>
              <div className="flex flex-wrap gap-1.5">
                {shuffledRight.map((opt, j) => {
                  const isSel = sel === opt;
                  const taken = used.has(opt) && !isSel;
                  let bcls = "border-border bg-white hover:border-primary-light";
                  if (submitted) {
                    if (isSel && isCorrect) bcls = "border-success bg-success text-white";
                    else if (isSel && !isCorrect) bcls = "border-danger bg-red-100 text-danger";
                    else bcls = "border-border bg-white opacity-50";
                  } else if (isSel) {
                    bcls = "border-primary bg-blue-50 text-primary font-semibold";
                  } else if (taken) {
                    bcls = "border-border bg-gray-100 opacity-40 cursor-not-allowed";
                  }
                  return (
                    <button
                      key={j}
                      type="button"
                      disabled={submitted || (taken && !isSel)}
                      onClick={() => (isSel ? clear(i) : setPair(i, opt))}
                      className={`text-xs sm:text-sm border-2 rounded-md px-2 py-1 transition ${bcls}`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
              {submitted && !isCorrect && (
                <div className="mt-2 text-xs text-success font-semibold">
                  ✓ נכון: {q.right[i]}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
