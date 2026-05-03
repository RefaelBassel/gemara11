// Normalize Hebrew/English text for fill-in-the-blank comparison.
// Strips nikud (vowels), punctuation, collapses whitespace, lowercases.
const NIKUD = /[֑-ׇ]/g;
const PUNCT = /[.,;:!?'"״׳`()\[\]{}\-–—]/g;
const WS = /\s+/g;

export function normalize(s: string): string {
  return s
    .normalize("NFKD")
    .replace(NIKUD, "")
    .replace(PUNCT, "")
    .replace(WS, " ")
    .trim()
    .toLowerCase();
}

export function fillMatches(accepted: string[], userAnswer: string): boolean {
  const u = normalize(userAnswer);
  if (!u) return false;
  return accepted.some((a) => normalize(a) === u);
}
