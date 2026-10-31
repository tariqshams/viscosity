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

export function codeLines(mdx) {
  return (mdx.match(/```[\s\S]*?```/g) ?? []).reduce((n, b) => n + b.split('\n').length - 2, 0);
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
