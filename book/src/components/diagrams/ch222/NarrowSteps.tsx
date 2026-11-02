// Chapter 222: refining a value's kinds on the two edges of a typeof test.
// Without a new name on each edge, the test teaches the analysis nothing;
// with a copy (a pi node) at the start of each branch, each branch gets
// its own, narrower fact, and the phi below joins them again.
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';
import { StepFrame, useSteps } from '../../viz/stepper';

type Line = { code: string; fact?: string; c?: string };
type S = { top: Line[]; left: Line[]; right: Line[]; bottom: Line[]; note: string };

const TOP0 = [{ code: 'x0 = c ? 1 : \'one\'' }, { code: 'typeof x0 === \'number\'?' }];
const TOP = [{ code: 'x0 = c ? 1 : \'one\'', fact: '{number, string}', c: 'warn' }, { code: 'typeof x0 === \'number\'?' }];

const STATES: S[] = [
  { top: TOP0, left: [{ code: 't1 = t0 + x0' }], right: [{ code: 's1 = x0 + \'!\'' }], bottom: [{ code: 'x3 = φ(x0, x0)' }], note: 'A value that is a number on one path and a string on the other, then a typeof test. Inside the true branch x0 is certainly a number; the question is whether the analysis can know that. (t0 is a number throughout.)' },
  { top: TOP, left: [{ code: 't1 = t0 + x0' }], right: [{ code: 's1 = x0 + \'!\'' }], bottom: [{ code: 'x3 = φ(x0, x0)' }], note: 'The facts are now sets of kinds. x0 joins a number and a string, so its fact is {number, string} (amber: more than one kind).' },
  { top: TOP, left: [{ code: 't1 = t0 + x0', fact: '{number, string}', c: 'danger' }], right: [{ code: 's1 = x0 + \'!\'', fact: '{string}', c: 'safe' }], bottom: [{ code: 'x3 = φ(x0, x0)' }], note: 'With one fact per SSA value, x0 has the same fact in both branches, so t0 + x0 might be a string concatenation and t1 is {number, string} (red: the test was there, and the analysis learned nothing from it).' },
  { top: TOP, left: [{ code: 'x1 = π(x0)', fact: '{number}', c: 'safe' }, { code: 't1 = t0 + x1', fact: '{number}', c: 'safe' }], right: [{ code: 's1 = x0 + \'!\'', fact: '{string}', c: 'safe' }], bottom: [{ code: 'x3 = φ(x0, x0)' }], note: 'Give x0 a new name at the start of the true branch: x1 = π(x0), a copy whose fact is x0’s fact intersected with {number}. Uses in the branch now read x1, and t1 is a number (green).' },
  { top: TOP, left: [{ code: 'x1 = π(x0)', fact: '{number}', c: 'safe' }, { code: 't1 = t0 + x1', fact: '{number}', c: 'safe' }], right: [{ code: 'x2 = π(x0)', fact: '{string}', c: 'safe' }, { code: 's1 = x2 + \'!\'', fact: '{string}', c: 'safe' }], bottom: [{ code: 'x3 = φ(x1, x2)' }], note: 'The false edge gets its own copy, x2, whose fact is x0’s fact with number removed: {string}. The φ below now joins the two copies.' },
  { top: TOP, left: [{ code: 'x1 = π(x0)', fact: '{number}', c: 'safe' }, { code: 't1 = t0 + x1', fact: '{number}', c: 'safe' }], right: [{ code: 'x2 = π(x0)', fact: '{string}', c: 'safe' }, { code: 's1 = x2 + \'!\'', fact: '{string}', c: 'safe' }], bottom: [{ code: 'x3 = φ(x1, x2)', fact: '{number, string}', c: 'warn' }], note: 'After the branches meet, x3 is the union again, {number, string}: a test refines a value only on the edges it controls. Because x0 is an SSA value it can never change after the test, which is what makes the refinement sound.' },
];

function Block({ x, y, w, lines }: { x: number; y: number; w: number; lines: Line[] }) {
  const h = 14 + lines.length * 34;
  return (
    <Box x={x} y={y} w={w} h={h}>
      {lines.map((l, k) => (
        <g key={k}>
          <T x={x + w / 2} y={y + 16 + k * 34} size={11.5} mono anchor="middle">{l.code}</T>
          {l.fact && <T x={x + w / 2} y={y + 31 + k * 34} size={11} weight={700} anchor="middle" fill={tok(l.c ?? 'ink')}>{l.fact}</T>}
        </g>
      ))}
    </Box>
  );
}

export default function NarrowSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="Narrowing a value on the edges of a test" steps={s} note={st.note}>
      <Svg w={420} h={300} title="A control-flow graph: a block that makes x0 and tests its type, a true branch on the left, a false branch on the right, and a join block below; each value is labelled with the set of kinds it may have">
        <Block x={110} y={4} w={200} lines={st.top} />
        <Arrow x1={170} y1={86} x2={110} y2={112} />
        <Arrow x1={250} y1={86} x2={310} y2={112} />
        <T x={118} y={96} size={11} anchor="end" fill={tok('muted')}>true</T>
        <T x={302} y={96} size={11} fill={tok('muted')}>false</T>
        <Block x={10} y={114} w={190} lines={st.left} />
        <Block x={220} y={114} w={190} lines={st.right} />
        <Arrow x1={105} y1={200} x2={180} y2={234} />
        <Arrow x1={315} y1={200} x2={240} y2={234} />
        <Block x={110} y={236} w={200} lines={st.bottom} />
      </Svg>
    </StepFrame>
  );
}
