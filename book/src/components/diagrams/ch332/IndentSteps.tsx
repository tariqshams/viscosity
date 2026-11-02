import { StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

// Chapter 332: engine/rust/crates/frontend-python/src/tokens.rs on a
// five-line program. The tokens are what the TS tokenizer printed for the
// same source (the two are held equal by the parity fixtures).
const LINES = ['for p in ps:', '    f(p.x,', '  p.y)', '    p.x += 1', 'print(1)'];

type S = { line: number; stack: number[]; depth: number; toks: string; note: string };

const STATES: S[] = [
  { line: 0, stack: [0], depth: 0, toks: 'for p in ps : NEWLINE', note: 'Line 1 starts at width 0, the top of the stack: no INDENT or DEDENT. The line end, outside brackets, is a NEWLINE token.' },
  { line: 1, stack: [0, 4], depth: 1, toks: 'INDENT f ( p . x ,', note: 'Line 2 is 4 wide, more than the top (0): push 4 and emit INDENT. Then “(” raises the bracket depth to 1.' },
  { line: 2, stack: [0, 4], depth: 0, toks: 'p . y ) NEWLINE', note: 'The line break came inside brackets (depth 1), so it was just whitespace: no NEWLINE, and line 3’s width is never measured. Its 2 would have been inconsistent. “)” brings depth back to 0.' },
  { line: 3, stack: [0, 4], depth: 0, toks: 'p . x += 1 NEWLINE', note: 'Line 4 is 4 wide, equal to the top: still inside the loop body, no token.' },
  { line: 4, stack: [0], depth: 0, toks: 'DEDENT print ( 1 ) NEWLINE', note: 'Line 5 is 0 wide, less than 4: pop and emit DEDENT, once per level, until the top equals 0. A width between two levels would be an error.' },
  { line: 5, stack: [0], depth: 0, toks: 'EOF', note: 'At the end, a DEDENT for every level still open, then EOF. In the tokens that follow, a block is simply INDENT … DEDENT, like braces.' },
];

export default function IndentSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="INDENT and DEDENT from widths and depth" steps={s} note={st.note}>
      <Svg w={400} h={230} title="A Python tokenizer keeping a stack of indentation widths and a bracket depth">
        {LINES.map((l, k) => (
          <g key={k}>
            <Box x={8} y={10 + k * 26} w={230} h={22} r={3}
              fill={k === st.line ? tok('brand', 0.15) : tok('panel')}
              stroke={k === st.line ? tok('brand') : tok('line')} />
            <T x={14} y={21 + k * 26} size={11} mono fill={tok('muted')}>{k + 1}</T>
            <T x={30} y={21 + k * 26} size={12} mono>{l.replace(/ /g, ' ')}</T>
          </g>
        ))}
        <T x={262} y={18} size={11} fill={tok('muted')}>stack of widths</T>
        {st.stack.map((w, k) => (
          <Box key={k} x={262 + k * 44} y={28} w={38} h={24} r={3} fill={tok('f1', 0.18)} stroke={tok('f1')}>
            <T x={281 + k * 44} y={40} size={12} mono anchor="middle">{w}</T>
          </Box>
        ))}
        <T x={262} y={78} size={11} fill={tok('muted')}>bracket depth</T>
        <Box x={262} y={88} w={38} h={24} r={3} fill={st.depth ? tok('warn', 0.2) : tok('panel')} stroke={st.depth ? tok('warn') : tok('line')}>
          <T x={281} y={100} size={12} mono anchor="middle">{st.depth}</T>
        </Box>
        <T x={8} y={160} size={11} fill={tok('muted')}>tokens from this line</T>
        <Box x={8} y={170} w={384} h={30} r={4} fill={tok('panel')} stroke={tok('line')}>
          <T x={16} y={185} size={12} mono>{st.toks}</T>
        </Box>
      </Svg>
    </StepFrame>
  );
}
