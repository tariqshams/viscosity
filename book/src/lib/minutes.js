// The 15-minute budget for a chapter, estimated the same way by the page
// header and by scripts/check_chapters.mjs:
//   prose at 200 words a minute (careful, technical reading, not skimming)
//   + 3 seconds per line of code shown
//   + 15 seconds per recall prompt + 30 seconds per quiz question
//   + 3 minutes per core exercise + 1 minute per runnable example.
// Exercises marked `optional: true` ("Extra practice") are not counted:
// they are there for readers who want more reps.

export function proseWords(mdx) {
  const text = mdx
    .replace(/^---[\s\S]*?---/, '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/<\/?[A-Za-z][^>]*>/g, ' ')
    .replace(/[#*_`>{}\[\]()]/g, ' ');
  return text.split(/\s+/).filter((w) => /[A-Za-z0-9]/.test(w)).length;
}

// An <OtherLanguages> box shows the same snippet in several languages as
// tabs; a reader reads one of them, so only its first block is counted.
function oneTabPerLanguageBox(mdx) {
  return mdx.replace(/(<OtherLanguages\b[^>]*>)([\s\S]*?)(<\/OtherLanguages>)/g, (_, open, inner, close) => {
    const first = inner.match(/```[\s\S]*?```/);
    return open + (first ? first[0] : '') + inner.replace(/```[\s\S]*?```/g, '') + close;
  });
}

export function codeLines(mdx) {
  return (oneTabPerLanguageBox(mdx).match(/```[\s\S]*?```/g) ?? []).reduce((n, b) => n + b.split('\n').length - 2, 0);
}

// Rough syllable count, good enough to spot long, rare words.
const syllables = (w) => (w.toLowerCase().replace(/e$/, '').match(/[aeiouy]+/g) ?? []).length;

/**
 * Share of prose words with four or more syllables: a vocabulary measure,
 * not a sentence-length one, so long, flowing sentences are not penalised
 * while long, rare words are. Reported by scripts/check_chapters.mjs.
 */
export function hardWordShare(mdx) {
  const words = mdx
    .replace(/^---[\s\S]*?---/, '')
    .replace(/^import .*$/gm, '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`\n]*`/g, ' ')
    .replace(/<\/?[A-Za-z][^>]*>/g, ' ')
    .split(/[^A-Za-z]+/)
    .filter((w) => w.length > 1 && !/[A-Z].*[A-Z]/.test(w));
  if (!words.length) return 0;
  return words.filter((w) => syllables(w) >= 4).length / words.length;
}

export function estimateMinutesExact(mdx, cards) {
  const prompts = Object.keys(cards.prompts ?? {}).length;
  const quiz = (cards.quiz ?? []).length;
  const exercises = Object.values(cards.exercises ?? {}).filter((e) => !e.optional).length;
  const examples = Object.keys(cards.examples ?? {}).length;
  return (
    proseWords(mdx) / 200 +
    codeLines(mdx) * 0.05 +
    prompts * (15 / 60) +
    quiz * (30 / 60) +
    exercises * 3 +
    examples * 1
  );
}

export function estimateMinutes(mdx, cards) {
  return Math.round(estimateMinutesExact(mdx, cards));
}
