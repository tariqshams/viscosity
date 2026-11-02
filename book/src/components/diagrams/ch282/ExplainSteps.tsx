import { StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

// Reading a real `viscosity explain` report line by line: corpus program
// frontend-js/test/corpus/mixed_columns.js. The text is the CLI's real
// output, wrapped to fit a phone.
type Line = { rows: string[]; from: string };

const LINES: Line[] = [
  { rows: ['es (line 2) {id, hp, x, tag}', '  → struct of arrays'], from: 'Finding collections, Record shapes, the plan' },
  { rows: ['· loop at line 5 in <module>()', '  touches 3 of 4 fields (hp, tag, x)'], from: 'Access patterns' },
  { rows: ['· loop at line 12 in <module>()', '  touches 2 of 4 fields (hp, x)'], from: 'Access patterns' },
  { rows: ['· typed Float64Array columns for hp, x;', '  plain array columns for id, tag', '  (may hold non-numbers)'], from: 'Record shapes (numbers), Generating SoA storage' },
  { rows: ['· about 300 elements'], from: 'size estimate, or Profile-guided optimization' },
  { rows: ['· 4 of 9 element accesses proven', '  in bounds'], from: 'Proving it safe, Rewriting field accesses' },
];

const STATES: { hi: number; note: string }[] = [
  { hi: -1, note: 'The whole report for one collection. Each collection gets one verdict line, then one “·” line per reason. Step through to see which part of the compiler wrote each line.' },
  { hi: 0, note: 'The verdict line: the variable, the line that created it, its fields in shape order, and the layout chosen. Everything after the arrow is the decision; everything below it is the evidence.' },
  { hi: 1, note: 'One line per loop that touches the fields. The loop at line 5 is the inner loop of a nested pair; the outer loop at line 4 touches no field itself, so it isn’t listed. 3 of 4 fields: id is never read here.' },
  { hi: 2, note: 'The for-of loop at line 12 reads hp and x. Two hot loops, both touching only some fields: the access pattern that makes columns pay off.' },
  { hi: 3, note: 'Which columns. hp and x always hold numbers, so they get Float64Arrays. id holds strings (and later 42) and tag holds null or an object, so they get plain arrays. Mixed is fine; nothing had to bail out.' },
  { hi: 4, note: 'The size, from the constant loop bound 300. It clears the 64-element threshold. With a profile this line would say “(measured by profiling)”.' },
  { hi: 5, note: 'The safety cost. 4 accesses use loop indexes proven in range. The other 5 use constant indexes (es[4], es[3], es[5]) on lines 10 and 13, so the compiled code checks them, to throw the same TypeError the original would.' },
];

export default function ExplainSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  let y = 14;
  const placed = LINES.map((l) => {
    const top = y;
    y += l.rows.length * 15 + 7;
    return { ...l, top };
  });
  const cur = st.hi >= 0 ? LINES[st.hi] : null;
  return (
    <StepFrame title="Reading an explain report" steps={s} note={st.note}>
      <Svg w={400} h={310} title="The explain report for mixed_columns.js, one line highlighted at a time, with the analysis that produced that line">
        <Box x={4} y={4} w={392} h={y + 2} fill={tok('panel')} />
        {placed.map((l, k) => {
          const on = k === st.hi;
          return (
            <g key={k} opacity={st.hi < 0 || on ? 1 : 0.4}>
              {on && <rect x={8} y={l.top - 4} width={384} height={l.rows.length * 15 + 4} rx={3} fill={tok('brand', 0.15)} stroke={tok('brand')} />}
              {l.rows.map((r, j) => (
                <T key={j} x={14} y={l.top + 4 + j * 15} size={11} mono weight={k === 0 && j === 1 ? 700 : undefined}>{r}</T>
              ))}
            </g>
          );
        })}
        <Box x={4} y={y + 16} w={392} h={50} fill={cur ? tok('accent', 0.1) : 'transparent'} stroke={cur ? tok('accent') : tok('line')} dash={!cur}>
          <T x={14} y={y + 32} size={11} weight={700} fill={tok('muted')}>WRITTEN BY (SEE THE CHAPTER)</T>
          <T x={14} y={y + 51} size={12}>{cur ? cur.from : 'step through to see'}</T>
        </Box>
      </Svg>
    </StepFrame>
  );
}
