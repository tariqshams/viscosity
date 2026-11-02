import { StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// Chapter 339: how one position travels from the parser to the caret in
// engine/rust, for the program in the chapter (six lines, line 6 is
// "\tif (ps[i].x > 3) keep.push(ps[i]);"). The offsets are real: the
// second ps[i] on line 6 is bytes 139..144, line 6 starts at byte 111,
// so the span starts 28 code points into the line (one tab, 27 others).
// Stages: oxc's Span (frontend-js/src/lower.rs, Lowerer::src), the
// SourceRef on the VIR instruction (vir/src/lib.rs), Collection::bail
// (core/src/analysis.rs), and code_frame (core/src/plan.rs).
type K = 'span' | 'src' | 'bail' | 'frame';
type S = { hi: K; note: string };

const STATES: S[] = [
  { hi: 'span', note: 'oxc parses the program. The second ps[i] on line 6 is a member expression whose Span is bytes 139 to 144 of the source. oxc gives byte offsets and no line numbers.' },
  { hi: 'src', note: 'Lowering turns that span into a SourceRef on the VIR instruction for ps[i]: start 139, end 144, and line 6, which LineIndex finds by binary search over the line starts (partition_point).' },
  { hi: 'bail', note: 'The escape analysis finds the element passed to push. Collection::bail records the message and the instruction’s SourceRef. Its line also goes into the message: “line 6: an element is used by push”.' },
  { hi: 'frame', note: 'Only explain --frames looks at start and end again. code_frame finds line 6 (bytes 111 to 146), counts 28 code points before the span, copies the tab into the pad, and draws 5 carets.' },
];

const BOX: Record<K, { y: number; title: string; body: string }> = {
  span: { y: 8, title: 'oxc: MemberExpression', body: 'span 139..144 (bytes)' },
  src: { y: 66, title: 'VIR: SourceRef', body: 'start 139, end 144, line 6' },
  bail: { y: 124, title: 'analysis: bail(msg, at)', body: 'bailout_sites[msg] = at' },
  frame: { y: 182, title: 'plan: code_frame', body: 'col 28, width 5' },
};

// SVG text collapses runs of spaces; non-breaking ones keep the columns.
const nb = (t: string) => t.replace(/ /g, '\u00a0');

export default function SpanSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const grey = tok('ink', 0.4);
  return (
    <StepFrame title="From a span to a caret" steps={s} note={st.note}>
      <Svg w={400} h={290} title="A source position passes from the parser to the frame: span, SourceRef, bailout site, code frame">
        {(Object.keys(BOX) as K[]).map((k) => {
          const b = BOX[k];
          const on = st.hi === k;
          return (
            <Box key={k} x={40} y={b.y} w={320} h={44} r={4} fill={on ? tok('brand', 0.15) : tok('panel')} stroke={on ? tok('brand') : tok('line')}>
              <T x={52} y={b.y + 14} size={11} weight={700}>{b.title}</T>
              <T x={52} y={b.y + 32} size={11} mono fill={on ? undefined : tok('muted')}>{b.body}</T>
            </Box>
          );
        })}
        <Arrow x1={200} y1={52} x2={200} y2={64} color={grey} width={1.5} />
        <Arrow x1={200} y1={110} x2={200} y2={122} color={grey} width={1.5} />
        <Arrow x1={200} y1={168} x2={200} y2={180} color={grey} width={1.5} />
        <T x={12} y={248} size={10.5} mono fill={st.hi === 'frame' ? tok('ink') : tok('muted')}>{nb('6 | ⇥if (ps[i].x > 3) keep.push(ps[i]);')}</T>
        <T x={12} y={266} size={10.5} mono fill={st.hi === 'frame' ? tok('danger') : tok('muted')}>{nb('  | ⇥' + ' '.repeat(27) + '^^^^^')}</T>
        <T x={390} y={282} size={9} anchor="end" fill={tok('muted')}>⇥ = a tab, kept in the caret line</T>
      </Svg>
    </StepFrame>
  );
}
