import { StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

// Chapter 350: code_frame in engine/rust/crates/core/src/plan.rs, step by
// step, on line 7 of the chapter's program ("\t\tkeep.push(ps[i]);"). The
// bailout site is the element ps[i]. → stands for a tab.
const CELLS = ['→', '→', ...'keep.push(ps[i]);'];
const SPAN = [12, 17]; // ps[i]: code points 12..17 of the line

type S = {
  span?: boolean; s?: boolean; e?: boolean; col?: boolean;
  width?: boolean; pad?: boolean; out?: boolean; note: string;
};

const STATES: S[] = [
  { span: true, note: 'The bailout site is a SourceRef: start and end are byte offsets into the whole file, and line is 7. Here it covers the element ps[i], the one passed to push.' },
  { span: true, s: true, note: 'source[..start].rfind(is_line_break) finds the break before the span. The line starts just after it (plus the break’s length: 1 for \\n, 3 bytes for U+2028).' },
  { span: true, s: true, e: true, note: 'source[start..].find(is_line_break) finds the end of the line. The text is source[s..e], with trailing spaces and tabs trimmed off.' },
  { span: true, col: true, note: 'col = before.chars().count(): the code points between the line start and the span. Two tabs and “keep.push(” make 12. Bytes would also be 12 here, but not after an “é”.' },
  { span: true, col: true, width: true, note: 'width = code points up to the span’s end (clipped to this line and to the text), minus col: 17 − 12 = 5. It is at least 1, so even an empty span gets a caret.' },
  { span: true, pad: true, width: true, note: 'The pad copies the text before the span, turning every character into a space except tabs, which stay tabs. So the carets line up whatever width a tab is drawn.' },
  { out: true, pad: true, width: true, note: 'The frame: the line number, " | " and the text; then a gutter of spaces as wide as the number, " | ", the pad and the carets. The TypeScript codeFrame prints exactly these bytes.' },
];

const X0 = 64;
const CW = 16;
const ROW = 56;
const CARET = 92;

export default function FrameSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const inSpan = (k: number) => k >= SPAN[0] && k < SPAN[1];
  return (
    <StepFrame title="code_frame on one line" steps={s} note={st.note}>
      <Svg w={400} h={190} title="Building a code frame: the line of the span, then a caret line with the same tabs">
        <T x={X0 - 10} y={ROW} size={12} mono anchor="end" fill={tok('muted')}>{st.out ? '7 |' : 'line 7'}</T>
        {CELLS.map((c, k) => {
          const hi = st.span && inSpan(k);
          const before = st.col && k < SPAN[0];
          return (
            <Box key={k} x={X0 + k * CW} y={ROW - 11} w={CW - 1} h={22} r={2}
              fill={hi ? tok('brand', 0.2) : before ? tok('f2', 0.18) : tok('panel')}
              stroke={hi ? tok('brand') : tok('line')}>
              <T x={X0 + k * CW + CW / 2 - 0.5} y={ROW} size={12} mono anchor="middle" fill={c === '→' ? tok('muted') : undefined}>{c}</T>
            </Box>
          );
        })}
        {st.s && (
          <g>
            <T x={X0} y={ROW - 24} size={11} mono fill={tok('brand')}>s ↓</T>
          </g>
        )}
        {st.e && (
          <T x={X0 + CELLS.length * CW - 2} y={ROW - 24} size={11} mono anchor="end" fill={tok('brand')}>↓ e</T>
        )}
        {(st.pad || st.width) && (
          <g>
            <T x={X0 - 10} y={CARET} size={12} mono anchor="end" fill={tok('muted')}>{st.out ? '  |' : 'carets'}</T>
            {CELLS.slice(0, SPAN[1]).map((c, k) => {
              const caret = st.width && inSpan(k);
              const padCell = st.pad && k < SPAN[0];
              if (!caret && !padCell) return null;
              return (
                <T key={k} x={X0 + k * CW + CW / 2 - 0.5} y={CARET} size={12} mono anchor="middle"
                  fill={caret ? tok('danger') : tok('muted')}>
                  {caret ? '^' : c === '→' ? '→' : '·'}
                </T>
              );
            })}
          </g>
        )}
        {st.col && (
          <T x={X0 + (SPAN[0] * CW) / 2} y={CARET + 28} size={11} mono anchor="middle" fill={tok('f2')}>col = 12</T>
        )}
        {st.width && (
          <T x={X0 + ((SPAN[0] + SPAN[1]) * CW) / 2} y={CARET + 28} size={11} mono anchor="middle" fill={tok('danger')}>width = 5</T>
        )}
        <T x={200} y={172} size={11} anchor="middle" fill={tok('muted')}>
          {st.pad ? '→ is a tab, · a space' : '→ is a tab'}
        </T>
      </Svg>
    </StepFrame>
  );
}
