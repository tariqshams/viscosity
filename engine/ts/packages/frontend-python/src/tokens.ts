// Tokenizing Python (book chapter 114). Python's blocks are made of
// indentation, so the tokenizer turns changes in indentation into INDENT and
// DEDENT tokens, and line ends into NEWLINE tokens, except inside brackets,
// where lines join implicitly.
export type PyTokType = 'name' | 'num' | 'str' | 'op' | 'newline' | 'indent' | 'dedent' | 'eof';
export interface PyTok { type: PyTokType; value: string; start: number; end: number; line: number; isFloat?: boolean; fstring?: boolean }

export class PySyntaxError extends SyntaxError {}

const OPS = ['**=', '//=', '>>=', '<<=', '...', '->', '**', '//', '==', '!=', '<=', '>=', '+=', '-=', '*=', '/=', '%=', '&=', '|=', '^=', ':=',
  '(', ')', '[', ']', '{', '}', ',', ':', '.', ';', '@', '=', '+', '-', '*', '/', '%', '<', '>', '&', '|', '^', '~'];

export function tokenize(src: string): PyTok[] {
  const toks: PyTok[] = [];
  const indents = [0];
  let i = 0;
  let line = 1;
  let depth = 0;
  let atLineStart = true;
  const err = (m: string): never => { throw new PySyntaxError(`${m} (line ${line})`); };
  while (i < src.length) {
    if (atLineStart && depth === 0) {
      // Measure indentation; skip blank and comment-only lines.
      let col = 0;
      let j = i;
      while (j < src.length && (src[j] === ' ' || src[j] === '\t')) { col += src[j] === '\t' ? 8 - (col % 8) : 1; j++; }
      if (src[j] === '\n' || src[j] === '#' || src[j] === '\r' || j >= src.length) {
        while (j < src.length && src[j] !== '\n') j++;
        i = j + 1;
        line++;
        continue;
      }
      i = j;
      atLineStart = false;
      if (col > indents[indents.length - 1]) {
        indents.push(col);
        toks.push({ type: 'indent', value: '', start: i, end: i, line });
      } else {
        while (col < indents[indents.length - 1]) {
          indents.pop();
          toks.push({ type: 'dedent', value: '', start: i, end: i, line });
        }
        if (col !== indents[indents.length - 1]) err('inconsistent indentation');
      }
    }
    const c = src[i];
    if (c === '\n') {
      if (depth === 0) toks.push({ type: 'newline', value: '', start: i, end: i, line });
      line++;
      i++;
      if (depth === 0) atLineStart = true; // inside brackets, a newline is just whitespace
      continue;
    }
    if (c === ' ' || c === '\t' || c === '\r') { i++; continue; }
    if (c === '#') { while (i < src.length && src[i] !== '\n') i++; continue; }
    if (c === '\\' && src[i + 1] === '\n') { i += 2; line++; continue; }
    const start = i;
    // strings, with optional prefixes (f, r, b, rb, ...)
    const pre = /^([rRbBfFuU]{0,2})(['"])/.exec(src.slice(i, i + 4));
    if (pre && (pre[1] === '' || /^[rbfu]{1,2}$/i.test(pre[1]))) {
      const isF = /f/i.test(pre[1]);
      const raw = /r/i.test(pre[1]);
      i += pre[1].length;
      const q = src.startsWith(pre[2].repeat(3), i) ? pre[2].repeat(3) : pre[2];
      i += q.length;
      while (i < src.length && !src.startsWith(q, i)) {
        if (src[i] === '\\' && !raw) i++;
        else if (src[i] === '\n') { if (q.length === 1) err('unterminated string'); line++; }
        i++;
      }
      if (i >= src.length) err('unterminated string');
      i += q.length;
      toks.push({ type: 'str', value: src.slice(start, i), start, end: i, line, fstring: isF });
      continue;
    }
    if (/[0-9]/.test(c) || (c === '.' && /[0-9]/.test(src.charAt(i + 1)))) {
      let isFloat = false;
      // charAt, not src[i]: past the end, src[i] is undefined, and a regex
      // tests undefined as the string "undefined" (which contains e, d, f).
      if (c === '0' && /[xXoObB]/.test(src.charAt(i + 1))) { i += 2; while (/[0-9a-fA-F_]/.test(src.charAt(i))) i++; }
      else {
        while (/[0-9_]/.test(src.charAt(i))) i++;
        if (src.charAt(i) === '.') { isFloat = true; i++; while (/[0-9_]/.test(src.charAt(i))) i++; }
        if (/[eE]/.test(src.charAt(i))) { isFloat = true; i++; if (/[+-]/.test(src.charAt(i))) i++; while (/[0-9]/.test(src.charAt(i))) i++; }
        if (/[jJ]/.test(src.charAt(i))) err('complex numbers are not supported');
      }
      toks.push({ type: 'num', value: src.slice(start, i), start, end: i, line, isFloat });
      continue;
    }
    if (/[A-Za-z_]/.test(c)) {
      while (i < src.length && /[\w]/.test(src[i])) i++;
      toks.push({ type: 'name', value: src.slice(start, i), start, end: i, line });
      continue;
    }
    const op = OPS.find((o) => src.startsWith(o, i));
    if (!op) err(`unexpected character '${c}'`);
    if (op === '(' || op === '[' || op === '{') depth++;
    if (op === ')' || op === ']' || op === '}') depth--;
    i += op!.length;
    toks.push({ type: 'op', value: op!, start, end: i, line });
  }
  if (toks.length && toks[toks.length - 1].type !== 'newline') toks.push({ type: 'newline', value: '', start: i, end: i, line });
  while (indents.length > 1) { indents.pop(); toks.push({ type: 'dedent', value: '', start: i, end: i, line }); }
  toks.push({ type: 'eof', value: '', start: i, end: i, line });
  return toks;
}
