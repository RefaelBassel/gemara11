# גמרא — כיתה יא

אפליקציית לימוד גמרא להכנה למבחנים, בנויה ב-Next.js 14 (App Router) + TypeScript + Tailwind + Turso (LibSQL) + NextAuth (Google OAuth).

## הקמה מקומית

```bash
npm install
cp .env.local.example .env.local
# מלא את הערכים — ראה למטה
npm run db:init        # אופציונלי — נוצר אוטומטית גם בקריאה הראשונה ל-API
npm run dev
```

## משתני סביבה (`.env.local`)

| משתנה                 | תיאור                                                                        |
| --------------------- | ---------------------------------------------------------------------------- |
| `TURSO_DATABASE_URL`  | `libsql://...turso.io` — ה-DB שלך ב-Turso                                    |
| `TURSO_AUTH_TOKEN`    | טוקן הרשאה ל-DB                                                              |
| `NEXTAUTH_URL`        | `http://localhost:3000` בפיתוח, ה-URL ב-Vercel בפרודקשן                      |
| `NEXTAUTH_SECRET`     | `openssl rand -base64 32`                                                    |
| `GOOGLE_CLIENT_ID`    | מ-Google Cloud Console (OAuth 2.0 Client)                                    |
| `GOOGLE_CLIENT_SECRET`| מ-Google Cloud Console                                                       |
| `TEACHER_PIN`         | PIN המורה (ברירת מחדל `1234`)                                                |

## Google OAuth — הגדרה ב-Cloud Console

1. צור פרויקט/בחר פרויקט קיים → "APIs & Services" → "Credentials"
2. צור "OAuth client ID" מסוג Web application
3. Authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://<your-domain>.vercel.app/api/auth/callback/google`

## Deployment ל-Vercel

1. דחוף ל-Git (GitHub/GitLab)
2. ב-Vercel, "Import Project" → בחר את הריפו
3. הוסף את כל משתני הסביבה בלשונית "Environment Variables"
4. Deploy. הסכמה ב-Turso נוצרת אוטומטית בקריאה הראשונה ל-API

## קבצי PDF

קבצי הגמרא נמצאים ב-`public/pdfs/` (לדוגמה `58b.pdf`, `21a.pdf`). המיפוי משמות עבריים שבמפרט (`נח_ב.pdf` וכו') לשמות הקבצים הקיימים נמצא ב-`src/lib/exams-data.ts` (קבוע `PDF_MAP`).

## כניסת מורה

מדף הכניסה → "כניסת מורה" → PIN מתוך `TEACHER_PIN` (ברירת מחדל `1234`). לאחר הכניסה הדשבורד נגיש מהתפריט העליון.

## מבנה

```
src/
├── app/
│   ├── api/                # Routes: auth, progress, leaderboard, students, settings, teacher
│   ├── exams/              # /exams, /exams/[examId], /exams/[examId]/[id]
│   ├── leaderboard/
│   ├── dashboard/
│   ├── layout.tsx
│   └── page.tsx            # דף כניסה
├── components/             # Navbar, XPBar, CountdownBanner, Quiz, Timeline, LevelUpModal
└── lib/
    ├── auth.ts             # NextAuth config
    ├── db.ts               # Turso client + ensureSchema
    ├── exams-data.ts       # כל המבחנים והשאלות
    ├── teacher.ts          # PIN cookie
    └── xp.ts               # רמות + חישוב
public/pdfs/                # קבצי הגמרא
```

## הוספה/עריכה של שאלות

ערוך את `src/lib/exams-data.ts`. כל סוגיה היא אובייקט עם `id`, `title`, `pdfs`, `questions`. כל שאלה: `q`, `options[]`, `correct` (אינדקס מ-0).

## XP

- מעבר בוחן (≥70%): 100 XP
- ציון 100%: בונוס 50
- השלמת כל סוגיות מבחן: בונוס 200
- כניסה יומית: 10

XP מחושב ב-API (`/api/progress` POST) רק בהשלמה ראשונה — חזרה על בוחן שכבר עבר לא מעניקה XP נוסף.

## רישיון

פנימי / פרטי.
