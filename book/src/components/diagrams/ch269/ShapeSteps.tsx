import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// Unifying record shapes, one object literal at a time: the field list must
// match exactly, order included, and each field's column type can only fall
// from "number" to "anything". The program and verdicts are real (explain).
const CODE = `const ps = [];
for (let i = 0; i < 100; i++)
  ps.push({ x: i, y: 0 });
ps.push({ x: 5, y: 'far' });
ps.push({ y: 1, x: 2 });`;

type Slot = { f: string; v: string; bad?: boolean };
type S = {
  line: number | null;
  rec: Slot[] | null;
  shape: string[];
  types: ('num' | 'any')[];
  verdict: 'none' | 'ok' | 'bail' | 'soa';
  wrong?: boolean;
  drop?: boolean;
  note: string;
};

const STATES: S[] = [
  { line: 0, rec: null, shape: [], types: [], verdict: 'none', note: 'ps starts empty, so it has no shape yet. Viscosity will learn the shape from the object literals that go into it.' },
  { line: 2, rec: [{ f: 'x', v: 'i' }, { f: 'y', v: '0' }], shape: ['x', 'y'], types: ['num', 'num'], verdict: 'ok', note: 'The first literal sets the shape: fields x then y. Both values are numbers (i counts, 0 is a constant), so both columns start out typed.' },
  { line: 3, rec: [{ f: 'x', v: '5' }, { f: 'y', v: "'far'", bad: true }], shape: ['x', 'y'], types: ['num', 'any'], verdict: 'ok', note: 'Same fields, same order: the shapes unify. But slot 1 holds a string, so y can no longer be a Float64Array. It falls to a plain array column. The shape survives; only y’s type changed.' },
  { line: 4, rec: [{ f: 'y', v: '1', bad: true }, { f: 'x', v: '2', bad: true }], shape: ['x', 'y'], types: ['num', 'any'], verdict: 'bail', note: 'The same two fields, in the other order. Viscosity compares the lists as written and they differ, so this is a bailout: the collection stays an array of objects. (The real message reads ({x, y} vs {y, x}), because the worklist meets the last push first.)' },
  { line: 4, rec: [{ f: 'y', v: '1', bad: true }, { f: 'x', v: '2', bad: true }], shape: ['x', 'y'], types: ['num', 'any'], verdict: 'bail', wrong: true, note: 'Why so strict? The rewrite copies slot k of each literal into column k. Done blindly here, the 1 meant for y would land in x. Accepting reordered literals would need a second, smarter path, and JavaScript can tell the two orders apart anyway.' },
  { line: 3, rec: null, shape: ['x', 'y'], types: ['num', 'any'], verdict: 'soa', drop: true, note: 'Delete the last push and every literal agrees: the record shape is {x: number, y: anything}, a Float64Array for x and a plain array for y. (This short program never reads the fields in a loop, so the cost model keeps it as it is; add a loop doing ps[i].x += 1 and explain reports exactly these two columns.)' },
];

const COL = { x: tok('f1'), y: tok('f2') } as Record<string, string>;

export default function ShapeSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const code = st.drop ? CODE.split('\n').slice(0, 4).join('\n') : CODE;
  return (
    <StepFrame title="Unifying record shapes" steps={s} note={st.note}>
      <CodeTrace code={code} line={st.line} />
      <Svg w={400} h={250} title="An incoming object literal compared slot by slot with the collection's shape">
        <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>INCOMING LITERAL</T>
        {st.rec ? st.rec.map((r, k) => (
          <Box key={k} x={110 + k * 100} y={24} w={90} h={34} fill={r.bad ? tok('danger', 0.1) : tok('panel')} stroke={r.bad ? tok('danger') : COL[r.f]}>
            <T x={155 + k * 100} y={41} size={13} mono anchor="middle"><tspan fill={COL[r.f]} fontWeight={700}>{r.f}</tspan>{': ' + r.v}</T>
          </Box>
        )) : <T x={110} y={41} size={13} fill={tok('muted')}>none</T>}
        <T x={8} y={41} size={11} fill={tok('muted')}>slot 0, 1 →</T>
        <T x={8} y={92} size={11} weight={700} fill={tok('muted')}>THE SHAPE OF ps</T>
        {st.shape.length === 0 && <T x={110} y={122} size={13} fill={tok('muted')}>no shape yet</T>}
        {st.shape.map((f, k) => (
          <g key={f}>
            <Box x={110 + k * 100} y={104} w={90} h={34} fill={tok('panel')} stroke={COL[f]}>
              <T x={155 + k * 100} y={121} size={14} mono weight={700} anchor="middle" fill={COL[f]}>{f}</T>
            </Box>
            <Box x={110 + k * 100} y={144} w={90} h={30} fill={st.types[k] === 'num' ? tok('safe', 0.1) : tok('warn', 0.12)} stroke={st.types[k] === 'num' ? tok('safe') : tok('warn')}>
              <T x={155 + k * 100} y={159} size={11} mono anchor="middle">{st.types[k] === 'num' ? 'Float64Array' : 'plain array'}</T>
            </Box>
          </g>
        ))}
        {st.shape.length > 0 && <T x={8} y={121} size={11} fill={tok('muted')}>fields</T>}
        {st.shape.length > 0 && <T x={8} y={159} size={11} fill={tok('muted')}>column</T>}
        {st.wrong && (
          <g>
            <Arrow x1={155} y1={58} x2={155} y2={102} color={tok('danger')} />
            <T x={162} y={80} size={11} fill={tok('danger')}>y’s 1 lands in x</T>
          </g>
        )}
        <T x={200} y={210} size={14} weight={700} anchor="middle" fill={st.verdict === 'bail' ? tok('danger') : st.verdict === 'soa' ? tok('safe') : tok('muted')}>
          {st.verdict === 'bail' ? 'unsafe: different field order' : st.verdict === 'soa' ? 'one shape: x typed, y plain' : st.verdict === 'ok' ? 'shapes unify so far' : 'no verdict yet'}
        </T>
        {st.verdict === 'bail' && <T x={200} y={232} size={11} mono anchor="middle" fill={tok('muted')}>{'({x, y} vs {y, x})'}</T>}
      </Svg>
    </StepFrame>
  );
}
