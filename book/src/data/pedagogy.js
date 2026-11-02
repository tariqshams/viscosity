// The teaching rules of PEDAGOGY.md that scripts/check_chapters.mjs enforces.
//
// Parts listed in STRICT_PARTS have been rewritten to the full contract, so
// the rules below are errors there; everywhere else they are warnings, to
// show what is left to do. Add a part's id here when its rewrite lands.
export const STRICT_PARTS = new Set(['I', 'II']);

/** Every chapter: at least this many analogies, each saying where it breaks. */
export const MIN_ANALOGIES = 2;
/** Every chapter: at least this many diagrams (imports from components/diagrams). */
export const MIN_DIAGRAMS = 2;
/** Every <Examples> block: at least this many examples (code blocks or <Run>s). */
export const MIN_EXAMPLES = 3;
/** Parts whose chapters must show the idea in other languages (<OtherLanguages>). */
export const OTHER_LANGUAGE_PARTS = new Set(['I']);

/**
 * Words the book never uses, anywhere (chapters, cards, front matter):
 * slang that would date the book or put a reader off.
 */
export const BANNED = [/\bcracked\b/i, /\b10x engineer/i, /\bninja\b/i, /\brockstar\b/i, /\bjust\s+simply\b/i];
