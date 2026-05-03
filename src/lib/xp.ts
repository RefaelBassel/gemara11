export type LevelInfo = {
  level: number;
  name: string;
  threshold: number;
  icon: string;
};

export const LEVELS: LevelInfo[] = [
  { level: 1, name: "תלמיד", threshold: 0, icon: "📖" },
  { level: 2, name: "חברותא", threshold: 200, icon: "📚" },
  { level: 3, name: "תלמיד חכם", threshold: 500, icon: "🎓" },
  { level: 4, name: "מתמיד", threshold: 900, icon: "⭐" },
  { level: 5, name: "חכם", threshold: 1400, icon: "🏆" },
  { level: 6, name: "גאון", threshold: 2000, icon: "👑" },
];

export function levelFromXp(xp: number): LevelInfo {
  let current = LEVELS[0];
  for (const l of LEVELS) {
    if (xp >= l.threshold) current = l;
  }
  return current;
}

export function nextLevelInfo(xp: number): {
  current: LevelInfo;
  next: LevelInfo | null;
  intoLevel: number;
  span: number;
  pct: number;
} {
  const current = levelFromXp(xp);
  const next = LEVELS.find((l) => l.level === current.level + 1) ?? null;
  if (!next) {
    return { current, next: null, intoLevel: 0, span: 1, pct: 100 };
  }
  const span = next.threshold - current.threshold;
  const intoLevel = xp - current.threshold;
  const pct = Math.min(100, Math.max(0, Math.round((intoLevel / span) * 100)));
  return { current, next, intoLevel, span, pct };
}

export const XP = {
  PASS_QUIZ: 100,
  PERFECT_BONUS: 50,
  ALL_SUGIYOT_BONUS: 200,
  DAILY_LOGIN: 10,
};
