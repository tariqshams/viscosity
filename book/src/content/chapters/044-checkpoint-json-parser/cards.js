// Chapter 44 cards (the JSON checkpoint, first half).
// Generated layout: edit freely; keys are stable ids, never rename them.

export const prompts = {
  'json-what': {
    q: 'What is JSON?',
    a: 'A strict text format for data (RFC 8259), which almost every language can read and write.',
  },
  'json-kinds': {
    q: 'Name the six kinds of JSON value.',
    a: '`null`, booleans, numbers, strings (in double quotes), arrays, and objects with string keys.',
  },
  'json-strict': {
    q: 'Which of these is valid JSON: `[1, 2,]`, `{\'a\': 1}`, `01`, `{"a": 1}`?',
    a: 'Only `{"a": 1}`. Trailing commas, single quotes and leading zeros are all refused.',
  },
  'json-unknown': {
    q: 'Why does Viscosity type the result of `JSON.parse` as `unknown` rather than trusting it?',
    a: 'The text came from outside, so it could hold anything; `unknown` forces the code to check its shape before using it.',
  },
  'two-stages': {
    q: 'What are the two stages of turning JSON text into a value?',
    a: 'A scanner cuts the text into tokens; a parser builds the tree of values from the tokens.',
  },
  'token-at': {
    q: 'Why does every token remember `at`, the index where it started?',
    a: 'So that an error found later, by the parser, can say exactly where in the text the problem is.',
  },
  'end-token': {
    q: 'What is the `\'end\'` token for?',
    a: 'It marks where the text ran out, so the parser can always look at the next token without reading past the end of the list.',
  },
  'index-signature': {
    q: 'What does the type `{ [key: string]: Json }` describe?',
    a: 'An object with any string keys, each holding a `Json` value: an index signature.',
  },
};

export const examples = {
  'json-round-trip': {
    title: 'There and back again',
    code: `const v = {
  n: 1, s: 'hi', list: [true, null],
  nan: NaN, gone: undefined,
  m: new Map([['k', 1]]),
};
const text = JSON.stringify(v);
console.log(text);

const back = JSON.parse(text);
console.log(back.nan, back.gone);
console.log(back.m);
console.log(JSON.parse('"caf\\\\u00e9"'));`,
  },
};

export const exercises = {
  skipSpace: {
    optional: true,
    lang: 'ts',
    title: 'Warm-up: skipping spaces',
    prompt: 'Write `skipSpace(src, i)`, which returns the index of the first character at or after `i` that is not one of JSON\'s four space characters: space `\' \'`, tab `\'\\t\'`, line feed `\'\\n\'` and carriage return `\'\\r\'`. If the text runs out, return `src.length`. No other character counts as a space.',
    starter: `function skipSpace(
  src: string, i: number,
): number {
  // your code here
  return i;
}

console.log(skipSpace('  [1]', 0));`,
    solution: `function skipSpace(
  src: string, i: number,
): number {
  while (i < src.length) {
    const c = src[i];
    if (c !== ' ' && c !== '\\t' &&
        c !== '\\n' && c !== '\\r') {
      break;
    }
    i++;
  }
  return i;
}`,
    tests: `test('skips leading spaces', () => {
  expect(skipSpace('  [1]', 0)).toBe(2);
});
test('nothing to skip', () => {
  expect(skipSpace('[1]', 0)).toBe(0);
});
test('all four JSON spaces: space, tab, line feed, carriage return', () => {
  expect(skipSpace(' \\t\\n\\r]', 0)).toBe(4);
});
test('starts from i, not from 0', () => {
  expect(skipSpace('a  b', 1)).toBe(3);
});
test('stops at the end of the text', () => {
  expect(skipSpace('ab  ', 2)).toBe(4);
});
test('other characters are not JSON spaces', () => {
  expect(skipSpace('\\f1', 0)).toBe(0);
  expect(skipSpace(' 1', 0)).toBe(0);
});`,
    hints: [
      'A finger moving right: a `while` loop that keeps going as long as there is text left.',
      'Inside the loop, read `src[i]`. If it is none of the four spaces, `break`; otherwise `i++`.',
      'Compare with each of the four exactly: `c !== \' \' && c !== \'\\t\' && c !== \'\\n\' && c !== \'\\r\'`.',
    ],
    walkthrough: `**How to think about it.** JSON allows exactly four "insignificant whitespace" characters between tokens: space, tab (\`'\\t'\`), line feed (\`'\\n'\`) and carriage return (\`'\\r'\`). Nothing else counts, not even a form feed or a no-break space, which JavaScript's own \`trim\` would remove. The function is a finger moving right: start at \`i\`, and keep stepping while the character under the finger is one of the four. Two things stop it: a character that is not a space, or the end of the text.

**The solution, line by line.**

- \`function skipSpace(\`, \`  src: string, i: number,\`, \`): number {\` is one signature over three lines: the text, the index to start from, and the index it returns.
- \`  while (i < src.length) {\` keeps going only while there is a character left, so the finger can never run off the end.
- \`    const c = src[i];\` reads the character under the finger.
- \`    if (c !== ' ' && c !== '\\t' &&\` and \`        c !== '\\n' && c !== '\\r') {\` (one condition, split over two lines) are true when \`c\` is none of the four spaces...
- \`      break;\` ...and then the loop stops, leaving \`i\` on that character.
- \`    i++;\` otherwise steps past the space.
- \`  return i;\` hands back the index of the first character that is not a space, or \`src.length\` if the text ran out.

For \`'  [1]'\` from 0, the finger passes indexes 0 and 1 and stops at the \`[\` at 2.

**Common wrong attempts.**

- Checking only \`' '\` leaves tabs and line breaks behind, and real JSON files are full of line breaks.
- Using \`trimStart\` (or a regular expression for "whitespace") also removes characters JSON does not allow there, so your scanner would accept text that \`JSON.parse\` refuses.`,
    wrong: [
      {
        code: `function skipSpace(
  src: string, i: number,
): number {
  while (src[i] === ' ') i++;
  return i;
}`,
        why: 'Only plain spaces are skipped, so a tab or a line break stops the finger.',
      },
      {
        code: `function skipSpace(
  src: string, i: number,
): number {
  const rest = src.slice(i);
  const t = rest.trimStart();
  return i + rest.length - t.length;
}`,
        why: '`trimStart` also removes characters JSON does not allow between tokens, such as a form feed or a no-break space.',
      },
    ],
  },
  scanNumber: {
    lang: 'ts',
    title: 'Scanning a number',
    prompt: 'Write `scanNumber(src, start)`. A number starts at index `start`; walk along it following the railway in the figure, and return `{ value, end }`: the number\'s value and the index just after its last character. Stop at the first character that cannot continue the number (`\'12,3\'` gives `{ value: 12, end: 2 }`). **Throw** (with the given `fail`) for a leading zero followed by a digit (`01`, `-00`), a minus sign with no digits, a point with no digit after it, and an exponent with no digits. Once the text is known to be valid, `Number(text)` may work out the value.',
    starter: `type Scanned<T> = {
  value: T; end: number;
};

function fail(msg: string): never {
  throw new Error(msg);
}

function isDigit(c: string): boolean {
  return c >= '0' && c <= '9';
}

function scanNumber(
  src: string, start: number,
): Scanned<number> {
  // your code here
  return { value: 0, end: start };
}

console.log(scanNumber('-1.5]', 0));`,
    solution: `type Scanned<T> = {
  value: T; end: number;
};

function fail(msg: string): never {
  throw new Error(msg);
}

function isDigit(c: string): boolean {
  return c >= '0' && c <= '9';
}

function digits(
  src: string, i: number,
): number {
  if (!isDigit(src[i])) {
    fail(\`expected a digit at \${i}\`);
  }
  while (isDigit(src[i])) i++;
  return i;
}

function scanNumber(
  src: string, start: number,
): Scanned<number> {
  let i = start;
  if (src[i] === '-') i++;
  if (src[i] === '0') {
    i++;
    if (isDigit(src[i])) {
      fail(\`leading zero at \${start}\`);
    }
  } else {
    i = digits(src, i);
  }
  if (src[i] === '.') {
    i = digits(src, i + 1);
  }
  const e = src[i];
  if (e === 'e' || e === 'E') {
    i++;
    const sign = src[i];
    if (sign === '+' || sign === '-') {
      i++;
    }
    i = digits(src, i);
  }
  const text = src.slice(start, i);
  return {
    value: Number(text), end: i,
  };
}`,
    tests: `test('a whole number', () => {
  expect(scanNumber('42', 0)).toEqual({ value: 42, end: 2 });
});
test('starts at start and stops at the first non-number character', () => {
  expect(scanNumber('[-1.5,', 1)).toEqual({ value: -1.5, end: 5 });
  expect(scanNumber('12,3', 0)).toEqual({ value: 12, end: 2 });
});
test('zero and minus zero', () => {
  expect(scanNumber('0', 0)).toEqual({ value: 0, end: 1 });
  expect(Object.is(scanNumber('-0', 0).value, -0)).toBe(true);
});
test('exponents', () => {
  expect(scanNumber('2.5e-3', 0)).toEqual({ value: 0.0025, end: 6 });
  expect(scanNumber('1E+2]', 0)).toEqual({ value: 100, end: 4 });
  expect(scanNumber('7e2', 0)).toEqual({ value: 700, end: 3 });
});
test('a leading zero is refused', () => {
  expect(() => scanNumber('01', 0)).toThrow();
  expect(() => scanNumber('-00', 0)).toThrow();
});
test('a minus sign needs digits', () => {
  expect(() => scanNumber('-', 0)).toThrow();
  expect(() => scanNumber('-a', 0)).toThrow();
});
test('a point needs digits after it', () => {
  expect(() => scanNumber('1.', 0)).toThrow();
  expect(() => scanNumber('1.e5', 0)).toThrow();
});
test('an exponent needs digits', () => {
  expect(() => scanNumber('1e', 0)).toThrow();
  expect(() => scanNumber('1e+', 0)).toThrow();
});`,
    hints: [
      'Follow the railway one station at a time, moving a finger `i`: optional `-`, then the whole part, then an optional fraction, then an optional exponent.',
      '“One or more digits” appears three times. Write a helper `digits(src, i)` that throws if `src[i]` is not a digit, then skips all the digits and returns the new index.',
      'For the whole part: if `src[i]` is `\'0\'`, step past it and throw if a digit follows; otherwise call `digits`. At the end, `Number(src.slice(start, i))` is the value.',
    ],
    walkthrough: `**How to think about it.** Do not try to recognise a whole number at once; walk along the railway in the figure, one station at a time, moving the finger \`i\` as you go and refusing the moment the text leaves the track. There are four stations, each optional or required: an optional \`-\`; the whole part (a single \`0\`, or a digit from 1 to 9 followed by any digits); an optional fraction (a \`.\` and *at least one* digit); and an optional exponent (\`e\` or \`E\`, an optional sign, and at least one digit). "At least one digit" comes up three times, so it is worth a small helper. Once the finger has walked the whole number, the text between \`start\` and \`i\` is a valid JSON number, and \`Number\` can work out its value (it is safe now; on unchecked text it is far too forgiving, as the branded types chapter showed).

**The solution, line by line.**

- \`type Scanned<T> = {\`, \`  value: T; end: number;\`, \`};\` is the result type, generic so that strings can use it too: the value read, and the index just after it.
- \`function fail(msg: string): never {\` and \`  throw new Error(msg);\` are given: a helper that always throws, typed \`never\` so the checker knows nothing runs after a call to it.
- \`function isDigit(c: string): boolean {\` with \`  return c >= '0' && c <= '9';\` is also given. Past the end of the text, \`src[i]\` is \`undefined\`, and both comparisons are false, so \`isDigit\` is safely \`false\` there.
- \`function digits(\`, \`  src: string, i: number,\`, \`): number {\` is the helper for "one or more digits starting at \`i\`".
- \`  if (!isDigit(src[i])) {\` and \`fail(...)\` (with the message \`expected a digit at \${i}\`, a template literal) refuse when there is not even one digit.
- \`  while (isDigit(src[i])) i++;\` walks past every digit, and \`  return i;\` returns the index after the last one.
- \`function scanNumber(\`, \`  src: string, start: number,\`, \`): Scanned<number> {\` is the signature.
- \`  let i = start;\` puts the finger at the start; \`start\` itself is kept for the end, to cut out the text.
- \`  if (src[i] === '-') i++;\` steps over an optional minus sign. (A \`+\` is not allowed at the front in JSON, so there is no test for it.)
- \`  if (src[i] === '0') {\` handles the first branch of the whole part: a single zero. \`    i++;\` steps past it, and \`    if (isDigit(src[i])) {\` with \`fail(...)\` (with the message \`leading zero at \${start}\`, a template literal) refuses \`01\` and \`-00\`: after a leading \`0\`, the only things that may follow are a point, an exponent, or the end of the number.
- \`  } else {\` and \`    i = digits(src, i);\` handle the other branch: one or more digits, starting with 1 to 9 (we know it is not 0, because of the \`if\`). This call is also what refuses \`-\` and \`-a\`: there must be a digit after the minus sign.
- \`  if (src[i] === '.') {\` starts the optional fraction, and \`    i = digits(src, i + 1);\` demands at least one digit after the point, which refuses \`1.\` and \`1.e5\`.
- \`  const e = src[i];\` and \`  if (e === 'e' || e === 'E') {\` start the optional exponent, then \`    i++;\` steps past the letter.
- \`    const sign = src[i];\`, \`    if (sign === '+' || sign === '-') {\`, \`      i++;\` and \`    }\` step over an optional sign.
- \`    i = digits(src, i);\` demands the exponent's digits, refusing \`1e\` and \`1e+\`.
- \`  const text = src.slice(start, i);\` cuts out exactly the characters walked, for example \`'-1.5'\` from \`'[-1.5,'\`.
- \`  return {\`, \`    value: Number(text), end: i,\`, \`  };\` turns the text into its value and reports where the number ended, so the caller knows where to continue. For \`'-0'\`, \`Number\` gives \`-0\`, just as \`JSON.parse('-0')\` does.

**Common wrong attempts.**

- Grabbing the longest run of "number-like" characters and calling \`Number\` on it: \`Number('01')\` is 1, so a leading zero slips through, and \`Number('1.')\` is 1, so does a bare point.
- Walking the digits but not *demanding* them (\`while (isDigit(...))\` alone, with no check that at least one was there) accepts \`-\`, \`1.\` and \`1e\`, because a loop that runs zero times is not an error.
- Treating \`0\` like any other first digit lets \`0123\` through.`,
    wrong: [
      {
        code: `function scanNumber(
  src: string, start: number,
) {
  let i = start;
  while (i < src.length &&
    '-+.eE0123456789'.includes(src[i])
  ) {
    i++;
  }
  const text = src.slice(start, i);
  const value = Number(text);
  if (Number.isNaN(value)) {
    throw new Error('bad number');
  }
  return { value: value, end: i };
}`,
        why: 'Grabbing every number-like character and calling `Number` accepts `01` (as 1) and `1.` (as 1): `Number` is far more forgiving than JSON.',
      },
      {
        code: `function isDigit(c: string): boolean {
  return c >= '0' && c <= '9';
}
function scanNumber(
  src: string, start: number,
) {
  let i = start;
  if (src[i] === '-') i++;
  while (isDigit(src[i])) i++;
  if (src[i] === '.') i++;
  while (isDigit(src[i])) i++;
  const e = src[i];
  if (e === 'e' || e === 'E') {
    i++;
    const sign = src[i];
    if (sign === '+' || sign === '-') {
      i++;
    }
    while (isDigit(src[i])) i++;
  }
  const text = src.slice(start, i);
  return {
    value: Number(text), end: i,
  };
}`,
        why: 'The loops skip digits but never demand one, so `-`, `1.` and `1e` are accepted, and nothing stops a leading zero.',
      },
    ],
  },
  scanString: {
    lang: 'ts',
    title: 'Scanning a string',
    prompt: 'Write `scanString(src, start)`. `src[start]` is the opening `"`; return `{ value, end }`, where `value` is the string\'s contents with every escape turned into the character it stands for, and `end` is the index just after the closing quote. The escapes are `\\"`, `\\\\`, `\\/`, `\\b`, `\\f`, `\\n`, `\\r`, `\\t`, and `\\u` followed by exactly four hex digits (use `String.fromCharCode(parseInt(hex, 16))`). **Throw** for a string with no closing quote, a raw character with a code below 32 (such as a real line break), and any other escape.',
    starter: `type Scanned<T> = {
  value: T; end: number;
};

function fail(msg: string): never {
  throw new Error(msg);
}

function isDigit(c: string): boolean {
  return c >= '0' && c <= '9';
}

function isHex(c: string): boolean {
  return isDigit(c)
    || (c >= 'a' && c <= 'f')
    || (c >= 'A' && c <= 'F');
}

function scanString(
  src: string, start: number,
): Scanned<string> {
  // your code here
  return { value: '', end: start };
}

console.log(scanString('"a\\\\tb"', 0));`,
    solution: `type Scanned<T> = {
  value: T; end: number;
};

function fail(msg: string): never {
  throw new Error(msg);
}

function isDigit(c: string): boolean {
  return c >= '0' && c <= '9';
}

function isHex(c: string): boolean {
  return isDigit(c)
    || (c >= 'a' && c <= 'f')
    || (c >= 'A' && c <= 'F');
}

const ESC: { [c: string]: string } = {
  '"': '"', '\\\\': '\\\\', '/': '/',
  b: '\\b', f: '\\f', n: '\\n',
  r: '\\r', t: '\\t',
};

function hex4(src: string, i: number) {
  const h = src.slice(i, i + 4);
  for (let k = 0; k < 4; k++) {
    if (!isHex(h[k])) {
      fail(\`bad \\\\u escape at \${i}\`);
    }
  }
  return parseInt(h, 16);
}

function scanString(
  src: string, start: number,
): Scanned<string> {
  let out = '';
  let i = start + 1;
  while (src[i] !== '"') {
    if (i >= src.length) {
      fail(\`unclosed at \${start}\`);
    }
    const c = src[i];
    if (c.charCodeAt(0) < 32) {
      fail(\`control character at \${i}\`);
    }
    if (c !== '\\\\') {
      out += c;
      i++;
      continue;
    }
    const e = src[i + 1];
    if (e === 'u') {
      const code = hex4(src, i + 2);
      out += String.fromCharCode(code);
      i += 6;
    } else if (ESC[e] !== undefined) {
      out += ESC[e];
      i += 2;
    } else {
      fail(\`bad escape at \${i}\`);
    }
  }
  return { value: out, end: i + 1 };
}`,
    tests: `const q = (s) => JSON.stringify(s);
test('a plain string', () => {
  expect(scanString('"hi"', 0)).toEqual({ value: 'hi', end: 4 });
});
test('starts at start; end is just after the closing quote', () => {
  expect(scanString('["a", 1]', 1)).toEqual({ value: 'a', end: 4 });
});
test('the empty string', () => {
  expect(scanString('""', 0)).toEqual({ value: '', end: 2 });
});
test('two-character escapes', () => {
  expect(scanString(q('a\\nb\\tc'), 0).value).toBe('a\\nb\\tc');
  expect(scanString('"\\\\"\\\\\\\\\\\\/"', 0).value).toBe('"\\\\/');
  expect(scanString('"\\\\b\\\\f\\\\r"', 0).value).toBe('\\b\\f\\r');
});
test('end counts escapes as their two characters', () => {
  expect(scanString('"\\\\n" x', 0).end).toBe(4);
});
test('\\\\u escapes', () => {
  expect(scanString('"caf\\\\u00e9"', 0).value).toBe('café');
  expect(scanString('"\\\\u00C9"', 0).value).toBe('É');
  expect(scanString('"\\\\uD834\\\\uDD1E"', 0).value).toBe('𝄞');
});
test('an unclosed string is refused', () => {
  expect(() => scanString('"abc', 0)).toThrow();
  expect(() => scanString('"ab\\\\"', 0)).toThrow();
});
test('a raw control character is refused', () => {
  expect(() => scanString('"a\\nb"', 0)).toThrow();
});
test('a bad escape is refused', () => {
  expect(() => scanString('"\\\\q"', 0)).toThrow();
  expect(() => scanString('"\\\\u12"', 0)).toThrow();
  expect(() => scanString('"\\\\u00G9"', 0)).toThrow();
});`,
    hints: [
      'Build the value like any string-building loop: `let out = \'\'`, start the finger after the opening quote, and loop until `src[i]` is `"`. Check for running out of text inside the loop.',
      'An ordinary character is copied with `out += c`. A backslash looks at the next character: a table such as `{ n: \'\\n\', t: \'\\t\', ... }` turns a letter into the character it stands for.',
      'For `\\u`, check that the four characters after it are all hex digits (`isHex` is given) before calling `parseInt(h, 16)`; then skip six characters. Return `end: i + 1`, after the closing quote.',
    ],
    walkthrough: `**How to think about it.** A string starts at the opening quote at \`start\`, and you build its value one character at a time, exactly like the string-building loops in the strings chapters, until you meet the closing quote. Most characters are copied as they are. The backslash is the exception: it starts an **escape**, a two-character code for a character that could not be written plainly (\`\\n\` for a line break, \`\\"\` for a quote inside the string), or a six-character \`\\u\` code, four hex digits naming a character by its number. Along the way, refuse three kinds of bad input: running out of text before the closing quote; a raw control character (any code below 32, such as an actual line break; JSON requires those to be escaped); and an escape that does not exist.

A small table makes the two-character escapes easy: an object whose keys are the letters after the backslash and whose values are the characters they stand for.

**The solution, line by line.**

- \`const ESC: { [c: string]: string } = {\` declares that table with an index signature: any string key, string values.
- \`  '"': '"', '\\\\': '\\\\', '/': '/',\` maps \`\\"\`, \`\\\\\` and \`\\/\` to a quote, a backslash and a slash. (In the source, \`'\\\\'\` is how you write a single backslash in a JavaScript string.)
- \`  b: '\\b', f: '\\f', n: '\\n',\` and \`  r: '\\r', t: '\\t',\` map the five letter escapes to backspace, form feed, line feed, carriage return and tab.
- \`function hex4(src: string, i: number) {\` reads the four hex digits of a \`\\u\` escape starting at \`i\`.
- \`  const h = src.slice(i, i + 4);\` cuts them out (fewer than four if the text ends early).
- \`  for (let k = 0; k < 4; k++) {\` checks each of the four, and \`    if (!isHex(h[k])) {\` with \`fail(...)\` (with the message \`bad \\u escape at \${i}\`, a template literal) refuses anything that is not 0 to 9 or a to f in either case. If \`h\` is short, \`h[k]\` is \`undefined\`, which \`isHex\` also rejects.
- \`  return parseInt(h, 16);\` turns the checked digits into a number. \`parseInt(text, 16)\` reads text as a base-16 number, so \`'00e9'\` is 233. (Checking first matters: on its own, \`parseInt\` quietly stops at the first bad character.)
- \`function scanString(\`, \`  src: string, start: number,\`, \`): Scanned<string> {\` is the signature.
- \`  let out = '';\` starts the value empty, and \`  let i = start + 1;\` puts the finger just after the opening quote.
- \`  while (src[i] !== '"') {\` loops until the closing quote.
- \`    if (i >= src.length) {\` and \`fail(...)\` (with the message \`unclosed at \${start}\`, a template literal) catch the text running out. Past the end, \`src[i]\` is \`undefined\`, which is not a quote, so the loop would otherwise go on for ever.
- \`    const c = src[i];\` reads the character, and \`    if (c.charCodeAt(0) < 32) {\` with \`fail(...)\` (with the message \`control character at \${i}\`, a template literal) refuses a raw control character.
- \`    if (c !== '\\\\') {\` handles an ordinary character: \`      out += c;\` copies it, \`      i++;\` moves on, and \`      continue;\` goes straight back to the loop test.
- \`    const e = src[i + 1];\` reads the character after the backslash.
- \`    if (e === 'u') {\` handles a \`\\u\` escape: \`      const code = hex4(src, i + 2);\` reads the four digits after \`\\u\`, \`      out += String.fromCharCode(code);\` adds the character with that code (from the strings chapter), and \`      i += 6;\` skips all six characters. A character outside the basic range, such as 𝄞, arrives as two escapes in a row (\`\\uD834\\uDD1E\`); adding both halves in turn is exactly right, because a JavaScript string stores such a character as two halves too.
- \`    } else if (ESC[e] !== undefined) {\` looks the letter up in the table; \`      out += ESC[e];\` adds the character it stands for, and \`      i += 2;\` skips the backslash and the letter.
- \`    } else {\` and \`fail(...)\` (with the message \`bad escape at \${i}\`, a template literal) refuse anything else, such as \`\\q\` (or a backslash at the very end, where \`e\` is \`undefined\`).
- \`  return { value: out, end: i + 1 };\` returns the built string, and the index just after the closing quote.

**Common wrong attempts.**

- Finding the next \`"\` with \`indexOf\` and slicing: an escaped quote \`\\"\` ends the string too early, and escapes such as \`\\n\` stay as two characters.
- Copying the character after a backslash as it is: \`\\n\` becomes the letter \`n\` rather than a line break, and \`\\u00e9\` becomes \`u00e9\`.
- Forgetting the end-of-text check: an unclosed string makes the loop run for ever, because \`undefined\` is never a quote.`,
    wrong: [
      {
        code: `function scanString(
  src: string, start: number,
) {
  const end =
    src.indexOf('"', start + 1);
  if (end < 0) {
    throw new Error('unclosed');
  }
  const value =
    src.slice(start + 1, end);
  return { value: value, end: end + 1 };
}`,
        why: 'Slicing up to the next quote stops at an escaped quote `\\"`, leaves escapes such as `\\n` as two characters, and never refuses a raw line break.',
      },
      {
        code: `function scanString(
  src: string, start: number,
) {
  let out = '';
  let i = start + 1;
  while (src[i] !== '"') {
    if (i >= src.length) {
      throw new Error('unclosed');
    }
    if (src[i] === '\\\\') {
      out += src[i + 1];
      i += 2;
    } else {
      out += src[i];
      i++;
    }
  }
  return { value: out, end: i + 1 };
}`,
        why: 'Copying the character after a backslash turns `\\n` into the letter `n` and `\\u00e9` into `u00e9`, and accepts escapes that do not exist.',
      },
    ],
  },
  tokenize: {
    optional: true,
    lang: 'ts',
    title: 'The whole scanner',
    prompt: 'Put it together: write `tokenize(src)`, which returns the list of `Token`s for the whole text, ending with an `{ kind: \'end\', at }` token at the index where the text ran out. Skip spaces between tokens with `skipSpace`; the first character of each token decides its kind (punctuation, a quote, a minus sign or digit, or one of the words `true`, `false` and `null`); and **throw** for any other character. Paste your `skipSpace`, `scanNumber` and `scanString` (with their helpers) into the starter first. The scanner does not check the order of tokens: that is the parser\'s job.',
    starter: `type Punct =
  '[' | ']' | '{' | '}' | ':' | ',';
type Word = 'true' | 'false' | 'null';
type Token =
  | { kind: Punct; at: number }
  | { kind: Word; at: number }
  | { kind: 'num'; value: number;
      at: number }
  | { kind: 'str'; value: string;
      at: number }
  | { kind: 'end'; at: number };

type Scanned<T> = {
  value: T; end: number;
};

function fail(msg: string): never {
  throw new Error(msg);
}

function isDigit(c: string): boolean {
  return c >= '0' && c <= '9';
}

// Paste skipSpace, scanNumber and
// scanString (with their helpers) here.

function tokenize(src: string) {
  const out: Token[] = [];
  // your code here
  return out;
}

console.log(tokenize('[1, "a"]'));`,
    solution: `type Punct =
  '[' | ']' | '{' | '}' | ':' | ',';
type Word = 'true' | 'false' | 'null';
type Token =
  | { kind: Punct; at: number }
  | { kind: Word; at: number }
  | { kind: 'num'; value: number;
      at: number }
  | { kind: 'str'; value: string;
      at: number }
  | { kind: 'end'; at: number };
type Scanned<T> = {
  value: T; end: number;
};

function fail(msg: string): never {
  throw new Error(msg);
}

function isDigit(c: string): boolean {
  return c >= '0' && c <= '9';
}

function skipSpace(
  src: string, i: number,
): number {
  while (i < src.length) {
    const c = src[i];
    if (c !== ' ' && c !== '\\t' &&
        c !== '\\n' && c !== '\\r') {
      break;
    }
    i++;
  }
  return i;
}

function digits(
  src: string, i: number,
): number {
  if (!isDigit(src[i])) {
    fail(\`expected a digit at \${i}\`);
  }
  while (isDigit(src[i])) i++;
  return i;
}

function scanNumber(
  src: string, start: number,
): Scanned<number> {
  let i = start;
  if (src[i] === '-') i++;
  if (src[i] === '0') {
    i++;
    if (isDigit(src[i])) {
      fail(\`leading zero at \${start}\`);
    }
  } else {
    i = digits(src, i);
  }
  if (src[i] === '.') {
    i = digits(src, i + 1);
  }
  const e = src[i];
  if (e === 'e' || e === 'E') {
    i++;
    const sign = src[i];
    if (sign === '+' || sign === '-') {
      i++;
    }
    i = digits(src, i);
  }
  const text = src.slice(start, i);
  return {
    value: Number(text), end: i,
  };
}

const ESC: { [c: string]: string } = {
  '"': '"', '\\\\': '\\\\', '/': '/',
  b: '\\b', f: '\\f', n: '\\n',
  r: '\\r', t: '\\t',
};

function isHex(c: string): boolean {
  return isDigit(c)
    || (c >= 'a' && c <= 'f')
    || (c >= 'A' && c <= 'F');
}

function hex4(src: string, i: number) {
  const h = src.slice(i, i + 4);
  for (let k = 0; k < 4; k++) {
    if (!isHex(h[k])) {
      fail(\`bad \\\\u escape at \${i}\`);
    }
  }
  return parseInt(h, 16);
}

function scanString(
  src: string, start: number,
): Scanned<string> {
  let out = '';
  let i = start + 1;
  while (src[i] !== '"') {
    if (i >= src.length) {
      fail(\`unclosed at \${start}\`);
    }
    const c = src[i];
    if (c.charCodeAt(0) < 32) {
      fail(\`control character at \${i}\`);
    }
    if (c !== '\\\\') {
      out += c;
      i++;
      continue;
    }
    const e = src[i + 1];
    if (e === 'u') {
      const code = hex4(src, i + 2);
      out += String.fromCharCode(code);
      i += 6;
    } else if (ESC[e] !== undefined) {
      out += ESC[e];
      i += 2;
    } else {
      fail(\`bad escape at \${i}\`);
    }
  }
  return { value: out, end: i + 1 };
}

const WORDS: Word[] =
  ['true', 'false', 'null'];

function scanToken(
  src: string, i: number, out: Token[],
): number {
  const c = src[i];
  if ('[]{}:,'.includes(c)) {
    const p = c as Punct;
    out.push({ kind: p, at: i });
    return i + 1;
  }
  if (c === '"') {
    const s = scanString(src, i);
    out.push({ kind: 'str',
      value: s.value, at: i });
    return s.end;
  }
  if (c === '-' || isDigit(c)) {
    const n = scanNumber(src, i);
    out.push({ kind: 'num',
      value: n.value, at: i });
    return n.end;
  }
  for (const w of WORDS) {
    if (src.startsWith(w, i)) {
      out.push({ kind: w, at: i });
      return i + w.length;
    }
  }
  return fail(\`bad character at \${i}\`);
}

function tokenize(src: string) {
  const out: Token[] = [];
  let i = skipSpace(src, 0);
  while (i < src.length) {
    i = scanToken(src, i, out);
    i = skipSpace(src, i);
  }
  out.push({ kind: 'end', at: i });
  return out;
}`,
    tests: `test('an array of a number and a string', () => {
  expect(tokenize('[1, "a"]')).toEqual([
    { kind: '[', at: 0 },
    { kind: 'num', value: 1, at: 1 },
    { kind: ',', at: 2 },
    { kind: 'str', value: 'a', at: 4 },
    { kind: ']', at: 7 },
    { kind: 'end', at: 8 },
  ]);
});
test('an object, with spaces everywhere', () => {
  expect(tokenize(' {"x": -1.5} ')).toEqual([
    { kind: '{', at: 1 },
    { kind: 'str', value: 'x', at: 2 },
    { kind: ':', at: 5 },
    { kind: 'num', value: -1.5, at: 7 },
    { kind: '}', at: 11 },
    { kind: 'end', at: 13 },
  ]);
});
test('true, false and null', () => {
  expect(tokenize('[true,false,null]').map((t) => t.kind)).toEqual(
    ['[', 'true', ',', 'false', ',', 'null', ']', 'end']);
});
test('empty text is just the end token', () => {
  expect(tokenize('  ')).toEqual([{ kind: 'end', at: 2 }]);
});
test('the scanner does not check the order of tokens', () => {
  expect(tokenize('] 1 [').map((t) => t.kind)).toEqual([']', 'num', '[', 'end']);
});
test('unknown characters are refused', () => {
  expect(() => tokenize('[1, x]')).toThrow();
  expect(() => tokenize("{'a': 1}")).toThrow();
  expect(() => tokenize('tru')).toThrow();
});
test('bad numbers and strings are refused', () => {
  expect(() => tokenize('[01]')).toThrow();
  expect(() => tokenize('["a]')).toThrow();
});`,
    hints: [
      'A loop: skip spaces, scan one token, repeat while text is left. After the loop, push the `\'end\'` token.',
      'Write a helper that scans one token at index `i`, pushes it, and returns the index after it. `\'[]{}:,\'.includes(c)` tests for punctuation.',
      'For the words, `src.startsWith(\'true\', i)` asks whether `true` starts at index `i`. Remember to record `at: i` before moving on.',
    ],
    walkthrough: `**How to think about it.** The hard parts are done: \`scanNumber\` and \`scanString\` each read one token and say where it ended. What is left is the loop that decides, from the character under the finger, which kind of token starts there, and the bookkeeping: skip spaces between tokens, remember where each token began, and add an \`'end'\` token at the end. The first character always decides: one of \`[]{}:,\` is punctuation; a quote starts a string; a minus sign or a digit starts a number; \`t\`, \`f\` or \`n\` must start one of the three words; anything else is an error. Notice that the scanner does not care about *order*: \`] 1 [\` scans happily, because checking structure is the parser's job, next chapter.

**The solution, line by line.** (The helpers are your solutions to the earlier exercises.)

- \`const WORDS: Word[] =\` and \`  ['true', 'false', 'null'];\` list the three words, typed so that each one is a valid token kind.
- \`function scanToken(\`, \`  src: string, i: number, out: Token[],\`, \`): number {\` scans the one token starting at \`i\`, pushes it onto \`out\`, and returns the index after it.
- \`  const c = src[i];\` reads the deciding character.
- \`  if ('[]{}:,'.includes(c)) {\` tests for punctuation, using the string method \`includes\`. \`    const p = c as Punct;\` is a type assertion (from the branded types chapter): the checker only knows \`c\` is a string, but the line above has checked it really is one of the six, so the assertion is backed by a check. \`    out.push({ kind: p, at: i });\` records the token, and \`    return i + 1;\` moves past it.
- \`  if (c === '"') {\` hands over to the string scanner: \`    const s = scanString(src, i);\`, then \`    out.push({ kind: 'str',\` and \`      value: s.value, at: i });\` record the value and where the string began, and \`    return s.end;\` continues after the closing quote.
- \`  if (c === '-' || isDigit(c)) {\` does the same for numbers with \`scanNumber\`, pushing a \`'num'\` token and returning \`n.end\`.
- \`  for (const w of WORDS) {\` tries each word: \`    if (src.startsWith(w, i)) {\` asks whether the text has that word starting at index \`i\` (the second argument of \`startsWith\` says where to look), then \`      out.push({ kind: w, at: i });\` and \`      return i + w.length;\`.
- \`return fail(...)\` (with the message \`bad character at \${i}\`, a template literal) handles everything else, such as \`x\`, a single quote, or \`tru\`. Writing \`return\` before a \`never\` call is a small courtesy to the checker: it makes plain that the function always ends here.
- \`function tokenize(src: string) {\` is the loop.
- \`  const out: Token[] = [];\` starts the list, and \`  let i = skipSpace(src, 0);\` skips any spaces at the very start.
- \`  while (i < src.length) {\` repeats while text is left: \`    i = scanToken(src, i, out);\` reads one token, and \`    i = skipSpace(src, i);\` skips the spaces after it, so the loop test sees the next token or the end.
- \`  out.push({ kind: 'end', at: i });\` marks the end of the text, and \`  return out;\` hands back the list.

**Common wrong attempts.**

- Forgetting the \`'end'\` token: the parser then has to check for "no more tokens" everywhere, and the tests expect it.
- Recording \`at\` *after* scanning (using the returned end index) gives every token the position where it stopped, so error messages point one token too far.
- Checking for \`true\` with \`src[i] === 't'\` and then skipping four characters accepts \`tree\` as \`true\`; \`startsWith\` checks all four letters.`,
    wrong: [
      {
        why: 'Leaving out the final `\'end\'` token: the tests expect it, and without it the parser would need an “out of tokens” check at every step.',
      },
      {
        why: 'Setting `at` from the index *after* the token: every error message would then point one token too late.',
      },
    ],
  },
};

export const quiz = [
  {
    q: 'Which of these texts does `JSON.parse` accept?',
    options: [
      {
        t: '`{\'name\': \'drip\'}`',
        why: 'JSON strings and keys need double quotes.',
      },
      {
        t: '`[1, 2, 3,]`',
        why: 'A trailing comma is not allowed in JSON, although JavaScript accepts one.',
      },
      {
        t: '`{"n": 007}`',
        why: 'Leading zeros are refused: `007` is not a JSON number.',
      },
      {
        t: '`{"n": -0.5e2}`',
        correct: true,
        why: 'A minus sign, a whole part of 0, a fraction and an exponent: every station of the number railway.',
      },
    ],
  },
  {
    q: 'What does `JSON.parse(JSON.stringify({ a: undefined, b: NaN }))` give?',
    options: [
      {
        t: '`{ a: undefined, b: NaN }`',
        why: 'JSON has no `undefined` and no `NaN`, so neither survives the trip.',
      },
      {
        t: '`{ b: null }`',
        correct: true,
        why: '`stringify` leaves out properties holding `undefined` and writes `NaN` as `null`.',
      },
      {
        t: 'An error',
        why: '`stringify` does not throw for these; it quietly changes them.',
      },
      {
        t: '`{}`',
        why: '`b` survives, as `null`.',
      },
    ],
  },
  {
    q: 'In the scanner, what is the job of the `at` field on every token?',
    options: [
      {
        t: 'It says how long the token is',
        why: 'Length is not stored; `at` is where the token starts.',
      },
      {
        t: 'It records where the token started, so later errors can point at the right place',
        correct: true,
        why: 'The parser, next chapter, reports structural mistakes using the `at` of the token it did not expect.',
      },
      {
        t: 'It is required by JSON',
        why: 'JSON says nothing about tokens; this is our own design.',
      },
    ],
  },
  {
    q: '`scanNumber(\'01\', 0)` should throw. Why is `Number(\'01\')` not enough to scan JSON numbers?',
    options: [
      {
        t: 'Because `Number(\'01\')` throws',
        why: 'It does not throw; it returns 1.',
      },
      {
        t: 'Because `Number` is slow',
        why: 'Speed is not the problem; correctness is.',
      },
      {
        t: 'Because `Number` accepts many texts that are not JSON, such as `01`, `1.`, `\' 80\'` and `\'\'`',
        correct: true,
        why: 'So the scanner checks the shape itself, following the grammar, and only then lets `Number` work out the value.',
      },
    ],
  },
  {
    q: 'Which string does `scanString(\'"a\\\\nb"\', 0).value` produce, where the text is the six characters `"a\\nb"`?',
    options: [
      {
        t: 'The four characters `a\\nb`',
        why: 'The backslash and `n` are an escape: together they stand for one character.',
      },
      {
        t: 'Three characters: `a`, a line break, `b`',
        correct: true,
        why: '`\\n` is the escape for a line feed, so two characters of text become one character of the value.',
      },
      {
        t: 'It throws, because of the line break',
        why: 'Only a *raw* line break is refused; the escape `\\n` is the correct way to write one.',
      },
    ],
  },
];
