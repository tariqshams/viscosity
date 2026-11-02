// Chapter 89 cards. Keys are stable ids: never rename them.

export const prompts = {
  'lazy-what': {
    q: 'What is **lazy parsing**?',
    a: 'Skimming a function body with a preparser instead of parsing it fully, and fully parsing and compiling it only when it is first called.',
  },
  'lazy-why': {
    q: 'Why do browsers parse lazily?',
    a: 'Much of a page’s code isn’t needed at startup, and compiling it eagerly would cost CPU time, memory for bytecode, and cache space.',
  },
  'first-call': {
    q: 'What happens the first time a preparsed function is called?',
    a: 'V8 parses it fully, compiles it to bytecode, and then runs it.',
  },
  'no-brace-count': {
    q: 'Why can’t the preparser find the end of a body by counting `{` and `}`?',
    a: 'Braces also appear inside strings, comments, regular expressions and template literals, so finding the real end needs the syntax.',
  },
  'track-vars': {
    q: 'Why must the preparser track the variables a skipped function uses?',
    a: 'Variables captured by inner functions must live in a heap-allocated context instead of on the stack, and the enclosing function needs to know which ones those are.',
  },
  'early-error': {
    q: 'A function that is never called contains `return 1 +;`. What happens when the script loads?',
    a: 'The whole script fails with a SyntaxError: the preparser still checks the syntax of every body.',
  },
  'double-parse': {
    q: 'What does lazy parsing cost when the function *is* called?',
    a: 'It is parsed twice: skimmed by the preparser, then fully parsed when called.',
  },
  'pife': {
    q: 'Why does V8 parse `(function () {…})` eagerly?',
    a: 'A parenthesized function is usually called immediately (an IIFE), so V8 guesses it will be and avoids parsing it twice.',
  },
  'cache-what': {
    q: 'What does a **bytecode cache** store, and what does it save?',
    a: 'A script’s compiled bytecode; a later load of the same script can skip parsing and compiling.',
  },
  'cache-grew': {
    q: 'Why was the `vm.Script` cache bigger after the script ran (528 vs 672 bytes)?',
    a: '`add` had been called, so it was compiled, and its bytecode joined the cache. Before running it was still lazy.',
  },
};

export const examples = {
  'brace-trap': {
    title: 'Counting braces goes wrong',
    code: `const src = '{ return "}"; } more';
let depth = 0, end = -1;
for (let i = 0; i < src.length; i++) {
  if (src[i] === '{') depth++;
  if (src[i] === '}') depth--;
  if (depth === 0) { end = i; break; }
}
console.log(end, src.slice(0, end + 1));
// It stopped at the } in the string.`,
  },
  'early-error': {
    title: 'A never-called function still has to parse',
    code: `const src = \`
function never() {
  return 1 +;
}
return 'ran';\`;
try {
  const f = new Function(src);
  console.log(f());
} catch (e) {
  console.log(e.name);
}
// never() is never called, but the
// whole thing still fails to load.`,
  },
};

const findTests = `const bs = String.fromCharCode(92);
test('a flat body', () => {
  const s = '{ return 1; }';
  expect(findBodyEnd(s, 0)).toBe(12);
});
test('nested blocks', () => {
  const s = '{ if (a) { b(); } } x';
  expect(findBodyEnd(s, 0)).toBe(18);
});
test('starting part-way through', () => {
  const s = 'f() { g(); }';
  expect(findBodyEnd(s, 4)).toBe(11);
});
test('a brace inside a double-quoted string', () => {
  const s = '{ return "}"; }';
  expect(findBodyEnd(s, 0)).toBe(14);
});
test('a brace inside a single-quoted string', () => {
  const s = "{ s = '{'; }";
  expect(findBodyEnd(s, 0)).toBe(11);
});
test('an escaped quote inside a string', () => {
  const s = '{ s = "' + bs + '"}"; }';
  expect(findBodyEnd(s, 0)).toBe(s.length - 1);
});
test('a brace inside a line comment', () => {
  const s = '{ // }\\n return 1; }';
  expect(findBodyEnd(s, 0)).toBe(s.length - 1);
});`;

export const exercises = {
  findBodyEnd: {
    title: 'Find the end of a function body',
    prompt:
      'Write `findBodyEnd(src, i)`. `src[i]` is a `{`. Return the index of the `}` that closes it. Braces inside string literals (`"…"` or `\'…\'`, where a backslash escapes the next character) and inside `//` line comments don’t count. Return `-1` if there is no match. (A real preparser also handles regular expressions, template literals and more; you’ll see why it isn’t simple.)',
    starter: `function findBodyEnd(src, i) {
  let depth = 0;
  for (; i < src.length; i++) {
    if (src[i] === '{') depth++;
    if (src[i] === '}') depth--;
    if (depth === 0) return i;
  }
  return -1;
}`,
    solution: `function findBodyEnd(src, i) {
  const n = src.length;
  let depth = 0;
  while (i < n) {
    const c = src[i];
    if (c === '"' || c === "'") {
      i++;
      while (i < n && src[i] !== c) {
        if (src[i] === '\\\\') i++;
        i++;
      }
    } else if (c === '/' &&
        src[i + 1] === '/') {
      while (i < n && src[i] !== '\\n') {
        i++;
      }
    } else if (c === '{') {
      depth++;
    } else if (c === '}') {
      depth--;
      if (depth === 0) return i;
    }
    i++;
  }
  return -1;
}`,
    tests: findTests,
    hints: [
      'Walk the string one character at a time, keeping a `depth` counter that goes up at `{` and down at `}`. That part is the starter.',
      'When you meet a quote, skip ahead to the matching quote of the same kind. Inside, a backslash means “skip the next character too”.',
      'When you meet `//`, skip ahead to the next newline. Only braces seen outside strings and comments change `depth`.',
    ],
    walkthrough: `The starter is a brace counter. It is right until a brace turns up somewhere it doesn’t mean anything. The fix is a tiny scanner with three modes:

\`\`\`js
if (c === '"' || c === "'") {
  i++;
  while (i < n && src[i] !== c) {
    if (src[i] === '\\\\') i++;
    i++;
  }
} else if (c === '/' &&
    src[i + 1] === '/') {
  while (i < n && src[i] !== '\\n') {
    i++;
  }
}
\`\`\`

- **Strings.** Inside quotes, nothing is code. Jump to the closing quote of the *same* kind: a \`'\` doesn’t end a \`"…"\` string.
- **Escapes.** \`"\\"}"\` contains an escaped quote. Without the backslash rule you’d think the string ended early and then count its \`}\`.
- **Comments.** A \`//\` comment runs to the end of the line, braces and all.

Now imagine adding \`/* … */\` comments, template literals with \`\${…}\` (which contain *real* code, braces and all), and regular expressions, where \`/\` might start a regex or be a division depending on what came before. That last one can only be decided from the grammar. This is why V8’s team says finding a function’s end needs a real parse, and why the preparser is a full copy of the parser, not a brace counter.`,
    wrong: [
      {
        code: `function findBodyEnd(src, i) {
  let depth = 0;
  let inStr = false;
  for (; i < src.length; i++) {
    const c = src[i];
    if (c === '"' || c === "'") {
      inStr = !inStr;
    }
    if (inStr) continue;
    if (c === '{') depth++;
    if (c === '}') depth--;
    if (depth === 0) return i;
  }
  return -1;
}`,
        why: 'Toggling one flag on any quote breaks on escaped quotes, on a `\'` inside a `"…"` string, and it ignores comments. Strings must end at the same kind of quote, and a backslash skips the next character.',
      },
    ],
  },
  looksInvoked: {
    optional: true,
    title: 'Spot a possibly-invoked function',
    prompt:
      'V8 parses a function eagerly if it looks immediately invoked. Write `looksInvoked(src, i)`, where `src` starts the keyword `function` at index `i`. Return `true` if the nearest character before `i` that isn’t a space or newline is `(` or `!`, and `false` otherwise (including when there is none).',
    starter: `function looksInvoked(src, i) {
  const c = src[i - 1];
  return c === '(' || c === '!';
}`,
    solution: `function looksInvoked(src, i) {
  const ws = (c) =>
    c === ' ' || c === '\\n';
  let j = i - 1;
  while (j >= 0 && ws(src[j])) j--;
  return src[j] === '(' ||
    src[j] === '!';
}`,
    tests: `test('a parenthesized function', () => {
  const s = '(function () {})()';
  expect(looksInvoked(s, 1)).toBe(true);
});
test('the !function pattern', () => {
  const s = '!function () {}()';
  expect(looksInvoked(s, 1)).toBe(true);
});
test('spaces and newlines in between', () => {
  const s = '( \\n  function () {}';
  expect(looksInvoked(s, s.indexOf('f'))).toBe(true);
});
test('a plain function expression', () => {
  const s = 'const f = function () {};';
  expect(looksInvoked(s, 10)).toBe(false);
});
test('a declaration at the very start', () => {
  expect(looksInvoked('function f() {}', 0)).toBe(false);
});`,
    hints: [
      'Walk backwards from `i - 1`, skipping spaces and newlines.',
      'Stop when you reach a different character or fall off the start of the string (`j < 0`).',
      'Then check whether that character is `(` or `!`. `src[-1]` is `undefined`, which is neither.',
    ],
    walkthrough: `Look backwards past whitespace, then check one character:

\`\`\`js
const ws = (c) =>
  c === ' ' || c === '\\n';
let j = i - 1;
while (j >= 0 && ws(src[j])) j--;
return src[j] === '(' || src[j] === '!';
\`\`\`

The parser sees tokens, not characters, so whitespace between \`(\` and \`function\` doesn’t matter to it, and mustn’t matter here either. Notice how crude the guess is: \`(function () {})\` is treated as “about to be called” even if it is only stored in a variable. The V8 team’s 2019 post points out exactly this: the heuristic is applied before the parser knows what follows, so wrapping a function in parentheses forces eager compilation whether or not it’s invoked.`,
    wrong: [
      {
        code: `function looksInvoked(src, i) {
  return src.slice(0, i)
    .trim()
    .startsWith('(');
}`,
        why: 'This looks at the *first* character of everything before `i`, not the *last* one, and it forgets `!`. You want the nearest non-space character before the keyword.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'What does V8’s preparser produce for a function body it skims?',
    options: [
      { t: 'A full syntax tree, saved for later', why: 'Avoiding the tree is the point. The full parse happens later, if the function is called.' },
      { t: 'Bytecode, but not machine code', why: 'Nothing is compiled for a preparsed function until it is called.' },
      { t: 'A syntax check and the variable information the enclosing code needs, but no tree or bytecode', correct: true, why: 'It verifies the body is valid and records which variables it declares and refers to.' },
      { t: 'Nothing: it skips straight to the matching brace', why: 'It can’t: finding the end needs the full syntax, and it must check for errors.' },
    ],
  },
  {
    q: 'A preparsed function is called once. How many times has V8 parsed it?',
    options: [
      { t: 'Once', why: 'The skim and the full parse are two separate passes over the body.' },
      { t: 'Twice: a preparse, then a full parse on the first call', correct: true, why: 'That double cost is why V8 tries to guess which functions will be called.' },
      { t: 'Never: Ignition runs source text', why: 'Ignition runs bytecode, which needs a full parse first.' },
      { t: 'Once per call', why: 'After the first call it has bytecode, and later calls reuse it.' },
    ],
  },
  {
    q: 'Why does V8 compile `(function () { … })` eagerly?',
    options: [
      { t: 'Parentheses make the code run faster', why: 'They change nothing at run time. They change V8’s guess at parse time.' },
      { t: 'The language requires it', why: 'The language says nothing about when to compile.' },
      { t: 'Anonymous functions can’t be lazy', why: 'Plenty of anonymous functions are parsed lazily.' },
      { t: 'It is probably an immediately-invoked function, and parsing it lazily would mean parsing it twice', correct: true, why: 'V8 calls this pattern a PIFE and decides as soon as it sees `(function`.' },
    ],
  },
  {
    q: 'Why must the preparser keep track of variables in a body it skips?',
    options: [
      { t: 'To decide which variables are captured by inner functions and need a heap-allocated context', correct: true, why: 'Captured variables can’t live on the stack, because the inner function may outlive the call.' },
      { t: 'To print them in error messages', why: 'Error messages aren’t the reason. Allocation is.' },
      { t: 'To compile them to bytecode early', why: 'Nothing is compiled during preparsing.' },
      { t: 'Because variables are global in JavaScript', why: 'Most variables are local. That is exactly why each one’s home must be decided.' },
    ],
  },
  {
    q: 'In the `vm.Script` experiment, why was the second cache bigger than the first?',
    options: [
      { t: 'The second cache was compressed less', why: 'Nothing about compression was involved.' },
      { t: 'Running the script changed its source', why: 'The source never changed: that’s why the cache was accepted.' },
      { t: 'Running the script compiled `add`, so its bytecode was included', correct: true, why: 'Before running, `add` was still lazy. `sub` was never called, so it stayed lazy throughout.' },
      { t: 'It also contains TurboFan machine code', why: 'Nothing in the script was hot enough for TurboFan. The cache holds what the bytecode compiler produced.' },
    ],
  },
  {
    q: 'Which change makes a stored bytecode cache useless?',
    options: [
      { t: 'Running the script a second time', why: 'Reusing the cache on later runs is the whole point.' },
      { t: 'Calling a different function in the script', why: 'The cache may contain less, but it is still valid.' },
      { t: 'Adding one space to the source', correct: true, why: 'The experiment showed it: `cachedDataRejected` was `true` for the edited source.' },
      { t: 'Moving to a faster computer with the same Node version', why: 'Same source and same engine version: the cache still matches.' },
    ],
  },
];
