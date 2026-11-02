// The teaching rules of PEDAGOGY.md that scripts/check_chapters.mjs enforces.
//
// Parts listed in STRICT_PARTS have been rewritten to the full contract, so
// the rules below are errors there; everywhere else they are warnings, to
// show what is left to do. Add a part's id here when its rewrite lands.
export const STRICT_PARTS = new Set(['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII']);

/**
 * Every chapter: exactly one open analogy (the essential picture), saying
 * where it breaks. Further analogies are welcome but marked `extra`, so they
 * sit in a closed dropdown: not every idea needs several pictures.
 */
export const MIN_ANALOGIES = 1;
export const OPEN_ANALOGIES = 1;
/** Every chapter: at least this many diagrams (imports from components/diagrams). */
export const MIN_DIAGRAMS = 2;
/**
 * Every <Examples> block: at least this many examples (code blocks or <Run>s)
 * on the main path; one strong example is enough, and more go in a <More>.
 */
export const MIN_EXAMPLES = 1;
/**
 * Parts of the 30-day core path. Their chapters have a tighter open reading
 * time and at most two required exercises, so four of them fit in an hour.
 */
export const CORE_PARTS = new Set(['II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX']);
/** Open reading time, in minutes, for core chapters and for all others. */
export const CORE_MINUTES = [9, 14];
export const OTHER_MINUTES = [9, 18];
/** Core chapters: at most this many required (non-optional) exercises. */
export const CORE_MAX_EXERCISES = 2;

/**
 * Review cards must make sense to an expert who has never read the book, so
 * a question may not lean on the book's own context. (Answers may still
 * point to a chapter.)
 */
export const CONTEXT_WORDS = [/\b(this|the (last|next|previous|following)) chapter\b/i, /\bthe book\b/i, /\bour (scanner|parser|compiler|vm|interpreter|engine|resolver|tree-walker|emitter|plugin)\b/i, /\babove\b/i, /\bbelow\b/i];

/** Parts whose chapters must show the idea in other languages (<OtherLanguages>). */
export const OTHER_LANGUAGE_PARTS = new Set(['I']);

/**
 * Words the book never uses, anywhere (chapters, cards, front matter):
 * slang that would date the book or put a reader off.
 */
export const BANNED = [/\bcracked\b/i, /\b10x engineer/i, /\bninja\b/i, /\brockstar\b/i, /\bjust\s+simply\b/i];

/**
 * This book is its own: Crafting Interpreters is honoured once, in the
 * preface (and credited in the bibliography and acknowledgements), and
 * never otherwise named, cited or compared against in a chapter.
 */
export const NOT_IN_CHAPTERS = [/Crafting Interpreters/, /\bNystrom\b/, /\b[cj]?lox\b/i, /nystrom2021/];
