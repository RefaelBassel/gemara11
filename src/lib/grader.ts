import Anthropic from "@anthropic-ai/sdk";

const SYSTEM = `אתה מורה מומחה לגמרא בכיתה י"א.
המשימה שלך: לבדוק תשובה פתוחה של תלמיד, על סמך תשובה לדוגמה וקריטריונים שתקבל.

דרישת פלט (קריטית!): החזר אך ורק אובייקט JSON, ללא טקסט נוסף, בפורמט המדויק:
{"score": <מספר שלם בין 0 ל-100>, "feedback": "<משוב קצר בעברית, 1-2 משפטים, פניה ישירה לתלמיד בגוף שני>"}

קני מידה לציון:
- 100: תשובה מלאה ומדויקת — כוללת את כל המרכיבים העיקריים מהקריטריונים
- 85-99: תשובה טובה — רוב המרכיבים העיקריים נמצאים, חסר פרט קל
- 70-84: תשובה עוברת — מרכיב עיקרי אחד נכון, חסר משהו מהותי
- 40-69: תשובה חלקית — רעיון כללי נכון אך לא מדויק
- 0-39: תשובה שגויה, חסרה לחלוטין, או ריקה

הנחיות:
- התעלם משגיאות כתיב/ניסוח קלות אם המהות נכונה
- אל תוריד ניקוד עבור ניסוח שונה מהדוגמה אם המשמעות זהה
- היה הוגן אך לא ויתרני: דרוש שהתלמיד יציג הבנה
- המשוב חייב להיות מועיל וברור — מה היה טוב או חסר, בקצרה`;

let client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!client) client = new Anthropic();
  return client;
}

export type GradeResult = {
  score: number;
  feedback: string;
};

export async function gradeOpenAnswer(args: {
  question: string;
  sample: string;
  rubric: string;
  answer: string;
}): Promise<GradeResult> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return {
      score: 0,
      feedback: "שגיאת בדיקה: מפתח API חסר. פנה למורה.",
    };
  }
  if (!args.answer.trim()) {
    return { score: 0, feedback: "תשובה ריקה." };
  }

  const userMsg = `שאלה: ${args.question}

תשובה לדוגמה: ${args.sample}

קריטריונים לבדיקה: ${args.rubric}

תשובת התלמיד: ${args.answer.trim()}`;

  try {
    const r = await getClient().messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 250,
      system: [
        { type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } },
      ],
      messages: [{ role: "user", content: userMsg }],
    });

    const text = r.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { text: string }).text)
      .join("");

    const m = text.match(/\{[\s\S]*\}/);
    if (!m) {
      return {
        score: 50,
        feedback: "לא הצלחתי לפענח את הבדיקה. נסה לשפר ולהגיש שוב.",
      };
    }
    const parsed = JSON.parse(m[0]) as { score?: unknown; feedback?: unknown };
    let score = Number(parsed.score);
    if (!Number.isFinite(score)) score = 0;
    score = Math.max(0, Math.min(100, Math.round(score)));
    const feedback = String(parsed.feedback ?? "").slice(0, 500);
    return { score, feedback };
  } catch (e) {
    console.error("[grader] error:", e);
    return {
      score: 50,
      feedback: "שגיאה זמנית בבדיקה. נסה שוב מאוחר יותר.",
    };
  }
}
