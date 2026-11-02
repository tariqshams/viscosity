import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

// Chapter 225: INDENT and DEDENT from a stack of indentation widths. The
// token stream is the real output of frontend-python/src/tokens.ts for this
// program (it matches CPython's own tokenize module token for token).
const CODE = `def step(ps):
    for p in ps:
        p.x += p.vx
    return ps
print(1)`;

type S = { line: number | null; col: number | null; stack: number[]; out: string[]; bad?: boolean; note: string };

const STATES: S[] = [
  { line: null, col: null, stack: [0], out: [], note: 'Before the first line, the stack holds a single 0. It is never popped. Watch the width of each line’s leading spaces, and compare it with the top of the stack.' },
  { line: 0, col: 0, stack: [0], out: ['def step(ps):', 'NEWLINE'], note: 'Width 0, top 0: equal, so no indentation token. The line’s own tokens follow, then NEWLINE.' },
  { line: 1, col: 4, stack: [0, 4], out: ['INDENT', 'for p in ps:', 'NEWLINE'], note: 'Width 4 is bigger than the top (0). Push 4 and emit one INDENT: a block has opened.' },
  { line: 2, col: 8, stack: [0, 4, 8], out: ['INDENT', 'p.x += p.vx', 'NEWLINE'], note: 'Width 8 is bigger than 4. Push 8, one more INDENT. Nesting is just a taller stack.' },
  { line: 3, col: 4, stack: [0, 4], out: ['DEDENT', 'return ps', 'NEWLINE'], note: 'Width 4 is smaller than 8. Pop until the top is not bigger: 8 goes, one DEDENT. Now the top is 4, which matches, so the for body is closed.' },
  { line: 4, col: 0, stack: [0], out: ['DEDENT', 'print(1)', 'NEWLINE'], note: 'Width 0: pop 4, one more DEDENT, and the def is closed. Dropping two levels at once would pop twice and emit two DEDENTs.' },
  { line: null, col: null, stack: [0], out: ['EOF'], note: 'End of file: one DEDENT for every width still above 0 (none here), then EOF. The parser never sees a space: only INDENT, DEDENT and NEWLINE.' },
  { line: 3, col: 2, stack: [0, 4, 8], out: ['error'], bad: true, note: 'What if line 4 had 2 spaces? Pop 8, then 4: the top is 0, and 2 ≠ 0. No open block has width 2, so it is “inconsistent indentation”, caught by the tokenizer itself.' },
];

export default function IndentSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="Turning indentation into tokens" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={190} title="The indentation stack and the tokens emitted for the current line">
        <T x={10} y={14} size={10} weight={700} fill={tok('muted')}>WIDTH</T>
        <Box x={10} y={24} w={70} h={40} fill={st.bad ? tok('f6', 0.2) : tok('accent', 0.1)} stroke={st.bad ? tok('f6') : tok('accent')}>
          <T x={45} y={44} size={18} mono anchor="middle" weight={700}>{st.col === null ? '–' : st.col}</T>
        </Box>
        <T x={10} y={86} size={10} weight={700} fill={tok('muted')}>STACK</T>
        {st.stack.map((w, k) => (
          <Box key={k} x={10} y={160 - k * 26} w={70} h={22} fill={k === st.stack.length - 1 ? tok('brand', 0.18) : tok('panel')} stroke={k === st.stack.length - 1 ? tok('brand') : tok('line')}>
            <T x={45} y={171 - k * 26} size={12} mono anchor="middle">{w}</T>
          </Box>
        ))}
        <T x={100} y={14} size={10} weight={700} fill={tok('muted')}>TOKENS FOR THIS LINE</T>
        {st.out.map((t, k) => {
          const special = t === 'INDENT' || t === 'DEDENT' || t === 'NEWLINE' || t === 'EOF' || t === 'error';
          return (
            <Box key={k} x={100} y={24 + k * 34} w={290} h={28}
              fill={t === 'error' ? tok('f6', 0.2) : special ? tok('f4', 0.15) : 'transparent'}
              stroke={t === 'error' ? tok('f6') : special ? tok('f4') : tok('line')}>
              <T x={112} y={38 + k * 34} size={12} mono weight={special ? 700 : undefined}>{t === 'error' ? 'inconsistent indentation' : t}</T>
            </Box>
          );
        })}
      </Svg>
    </StepFrame>
  );
}
