import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

const CODE = `function synchronize() {
  advance(); // skip the bad token
  while (!atEnd()) {
    if (previous().type === ';') return;
    if (STARTS.has(peek().type)) return;
    advance();
  }
}`;

// The program, one row of tokens per source line.
const LINES = [
  ['let', 'x', '=', '1'],
  ['print', 'x', ';'],
  ['print', '(', '2', '+', ';'],
  ['print', '3', ';', 'end'],
];

type St = 'ok' | 'bad' | 'skip';
type S = { cur: number; marks: Record<number, St>; line: number | null; errors: [string, string][]; kept: string[]; note: string };

const E1: [string, string] = ["[line 2] Error at 'print':", "Expect ';' after variable declaration."];
const E2: [string, string] = ["[line 3] Error at ';':", 'Expect expression.'];
const range = (a: number, b: number, s: St) => Object.fromEntries(Array.from({ length: b - a + 1 }, (_, k) => [a + k, s]));

const STATES: S[] = [
  { cur: 0, marks: {}, line: null, errors: [], kept: [], note: 'The parser sees let and starts a variable declaration: let, a name, =, an expression, then a ;.' },
  { cur: 4, marks: { ...range(0, 3, 'ok'), 4: 'bad' }, line: null, errors: [E1], kept: [], note: 'After the 1, consume(\';\') finds print instead. It reports the error at the token where it noticed, on line 2, then throws a ParseError. (The ; was really missing from line 1.)' },
  { cur: 5, marks: { ...range(0, 3, 'ok'), 4: 'skip' }, line: 1, errors: [E1], kept: [], note: 'The throw unwinds to declaration(), whose catch calls synchronize(). Its first move is to skip the token it got stuck on, whatever it is, so it always makes progress.' },
  { cur: 6, marks: { ...range(0, 3, 'ok'), 4: 'skip', 5: 'skip' }, line: 5, errors: [E1], kept: [], note: 'The previous token (print) is not a ;. The next one, x, cannot start a statement. Skip it.' },
  { cur: 7, marks: { ...range(0, 3, 'ok'), ...range(4, 6, 'skip') }, line: 3, errors: [E1], kept: [], note: 'The ; is skipped too. Now the previous token is a ;, so a statement has just ended: a safe place. Stop panicking.' },
  { cur: 7, marks: { ...range(0, 3, 'ok'), ...range(4, 6, 'skip') }, line: null, errors: [E1], kept: [], note: 'Normal parsing resumes at the print on line 3. Notice what was lost: print x; was skipped unchecked. Panic mode gives up a little, to avoid inventing errors.' },
  { cur: 11, marks: { ...range(0, 3, 'ok'), ...range(4, 6, 'skip'), ...range(7, 10, 'ok'), 11: 'bad' }, line: null, errors: [E1, E2], kept: [], note: 'print ( 2 + and then a ;. After the +, the Pratt loop needs a right operand, and a ; cannot start one. A second, genuine error is reported.' },
  { cur: 12, marks: { ...range(0, 3, 'ok'), ...range(4, 6, 'skip'), ...range(7, 10, 'ok'), 11: 'skip' }, line: 3, errors: [E1, E2], kept: [], note: 'synchronize() skips the bad ;, and right away sees that the previous token is a ;. It stops at once: almost nothing was lost this time.' },
  { cur: 15, marks: { ...range(0, 3, 'ok'), ...range(4, 6, 'skip'), ...range(7, 10, 'ok'), 11: 'skip', ...range(12, 14, 'ok') }, line: null, errors: [E1, E2], kept: ['print 3;'], note: 'print 3; parses cleanly, and its statement is kept.' },
  { cur: 15, marks: { ...range(0, 3, 'ok'), ...range(4, 6, 'skip'), ...range(7, 10, 'ok'), 11: 'skip', ...range(12, 14, 'ok') }, line: null, errors: [E1, E2], kept: ['print 3;'], note: 'The end. Two real errors from one run, and no made-up ones. But an error was reported, so Drip runs nothing at all, not even print 3. Exit code 65.' },
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
