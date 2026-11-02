import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

// Simplified from synchronize() in companion/ts/src/parser.ts.
const CODE = `function synchronize() {
  panicMode = false;
  while (current.type !== 'eof') {
    if (previous.type === ';') return;
    if (STARTS.has(current.type)) return;
    // (it also stops at the } closing
    //  this block, and skips {…} whole)
    advance();
  }
}`;

// The program, one row of tokens per source line.
const LINES = [
  ['let', 'x', '=', '1'],
  ['x', '=', '2', ';'],
  ['print', '(', '3', '+', ';'],
  ['print', 'x', ';', 'end'],
];

type St = 'ok' | 'bad' | 'skip';
type S = { cur: number; marks: Record<number, St>; line: number | null; errors: [string, string][]; kept: string[]; note: string };

const E1: [string, string] = ["line 1: expected ';' after the variable", "declaration, found 'x'"];
const E2: [string, string] = ['line 3: expected an expression,', "found ';'"];
const range = (a: number, b: number, s: St) => Object.fromEntries(Array.from({ length: b - a + 1 }, (_, k) => [a + k, s]));

const STATES: S[] = [
  { cur: 0, marks: {}, line: null, errors: [], kept: [], note: 'The parser sees let and starts a variable declaration: let, a name, =, an expression, then a ;.' },
  { cur: 4, marks: { ...range(0, 3, 'ok'), 4: 'bad' }, line: null, errors: [E1], kept: [], note: 'After the 1, consume(\';\') finds x instead. It reports the error on line 1, where the ; belongs (a missing ; is reported on the line of the token before it). It does not throw: it sets panicMode, which keeps any further complaints about this statement quiet, and carries on.' },
  { cur: 4, marks: { ...range(0, 3, 'ok'), 4: 'bad' }, line: 1, errors: [E1], kept: [], note: 'When the let declaration returns, declaration() sees that panicMode is set and calls synchronize(), which first clears the flag.' },
  { cur: 5, marks: { ...range(0, 3, 'ok'), 4: 'skip' }, line: 7, errors: [E1], kept: [], note: 'The previous token, 1, is not a ;, and the next one, x, is not a keyword that starts a statement (only keywords are trusted). So advance() skips it.' },
  { cur: 8, marks: { ...range(0, 3, 'ok'), ...range(4, 7, 'skip') }, line: 3, errors: [E1], kept: [], note: 'The =, the 2 and the ; are skipped too. Now the previous token is a ;, so a statement has just ended: a safe place. synchronize() returns.' },
  { cur: 8, marks: { ...range(0, 3, 'ok'), ...range(4, 7, 'skip') }, line: null, errors: [E1], kept: [], note: 'Normal parsing resumes at the print on line 3. Notice what was lost: x = 2; was skipped unchecked. Panic mode gives up a little, to avoid inventing errors.' },
  { cur: 13, marks: { ...range(0, 3, 'ok'), ...range(4, 7, 'skip'), ...range(8, 11, 'ok'), 12: 'bad' }, line: null, errors: [E1, E2], kept: [], note: 'print ( 3 + and then a ;. After the +, the Pratt loop needs a right operand, takes the ;, and finds that it cannot start one: a second, genuine error. The missing ) and ; that follow are not reported, because panicMode is set again and they would only be echoes.' },
  { cur: 13, marks: { ...range(0, 3, 'ok'), ...range(4, 7, 'skip'), ...range(8, 11, 'ok'), 12: 'bad' }, line: 3, errors: [E1, E2], kept: [], note: 'synchronize() runs again. The previous token is already a ;, so it returns at once: nothing is skipped this time.' },
  { cur: 16, marks: { ...range(0, 3, 'ok'), ...range(4, 7, 'skip'), ...range(8, 11, 'ok'), 12: 'bad', ...range(13, 15, 'ok') }, line: null, errors: [E1, E2], kept: ['print x;'], note: 'print x; parses cleanly, and its statement is kept.' },
  { cur: 16, marks: { ...range(0, 3, 'ok'), ...range(4, 7, 'skip'), ...range(8, 11, 'ok'), 12: 'bad', ...range(13, 15, 'ok') }, line: null, errors: [E1, E2], kept: ['print x;'], note: 'The end. Two real errors from one run, and no made-up ones. But an error was reported, so Drip runs nothing at all, not even print x. Exit code 65.' },
];

export default function SyncSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const panic = st.line !== null;
  let idx = 0;
  return (
    <StepFrame title="Panic mode: skipping to a safe point" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={300} title="The tokens of a four-line program with two syntax errors. The parser reports each error, then skips tokens until just after a semicolon or just before a statement keyword.">
        <T x={8} y={10} size={11} weight={700} fill={panic ? tok('danger') : tok('muted')}>{panic ? 'PANIC MODE: SKIPPING' : 'PARSING'}</T>
        {LINES.map((l, row) => {
          let x = 30;
          const y = 22 + row * 36;
          return (
            <g key={row}>
              <T x={8} y={y + 13} size={11} mono fill={tok('muted')}>{row + 1}</T>
              {l.map((t) => {
                const k = idx++;
                const w = 16 + t.length * 8.5;
                const m = st.marks[k];
                const isCur = k === st.cur;
                const fill = m === 'bad' ? tok('danger', 0.18) : m === 'skip' ? 'transparent' : m === 'ok' ? tok('safe', 0.12) : tok('panel');
                const stroke = isCur ? tok('brand') : m === 'bad' ? tok('danger') : m === 'skip' ? tok('ink', 0.35) : m === 'ok' ? tok('safe') : tok('ink', 0.4);
                const box = (
                  <g key={k} opacity={m === 'skip' ? 0.5 : 1}>
                    <Box x={x} y={y} w={w} h={26} dash={m === 'skip'} fill={fill} stroke={stroke}>
                      <T x={x + w / 2} y={y + 13} size={t === 'end' ? 11 : 13} mono anchor="middle" weight={isCur ? 700 : 400}>{t}</T>
                    </Box>
                    {m === 'skip' && <line x1={x + 3} y1={y + 13} x2={x + w - 3} y2={y + 13} stroke={tok('danger')} strokeWidth={1.5} />}
                    {isCur && <T x={x + w / 2} y={y + 32} size={9} anchor="middle" fill={tok('brand')}>next</T>}
                  </g>
                );
                x += w + 6;
                return box;
              })}
            </g>
          );
        })}
        <T x={8} y={176} size={11} weight={700} fill={tok('muted')}>ERRORS REPORTED</T>
        {st.errors.length === 0 && <T x={8} y={194} size={12} fill={tok('muted')}>none yet</T>}
        {st.errors.map(([a, b], k) => (
          <g key={k}>
            <T x={8} y={194 + k * 34} size={11.5} mono fill={tok('danger')}>{a}</T>
            <T x={20} y={209 + k * 34} size={11.5} mono fill={tok('danger')}>{b}</T>
          </g>
        ))}
        <T x={8} y={270} size={11} weight={700} fill={tok('muted')}>STATEMENTS KEPT</T>
        <T x={8} y={288} size={12} mono fill={st.kept.length ? tok('safe') : tok('muted')}>{st.kept.length ? st.kept.join('  ') : 'none yet'}</T>
      </Svg>
    </StepFrame>
  );
}
