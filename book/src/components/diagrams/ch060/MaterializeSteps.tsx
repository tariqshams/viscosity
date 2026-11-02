import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// Materializing from columns: every call builds a NEW object (an allocation,
// with its own header and identity), and writes to it never reach the
// columns. Mirrors the chapter's runnable example.
const CODE = `const s = {
  x: new Float64Array([1, 2]),
  y: new Float64Array([3, 4]),
};
function get(s, i) {
  return { x: s.x[i], y: s.y[i] };
}
const a = get(s, 0);
const b = get(s, 0);
console.log(a === b);
a.x = 99;
console.log(s.x[0]);`;

type Obj = { name: string; x: number; y: number };
type S = { line: number; objs: Obj[]; hl: 'none' | 'copy' | 'ident' | 'write'; out?: string; note: string };

const STATES: S[] = [
  { line: 0, objs: [], hl: 'none', note: 'Two particles stored as columns: x holds 1 and 2, y holds 3 and 4. There are no particle objects anywhere; only numbers in two typed arrays.' },
  { line: 7, objs: [{ name: 'a', x: 1, y: 3 }], hl: 'copy', note: 'get(s, 0) needs an object, so it builds one: a fresh allocation, with its own header, and the values of slot 0 copied in from each column.' },
  { line: 8, objs: [{ name: 'a', x: 1, y: 3 }, { name: 'b', x: 1, y: 3 }], hl: 'copy', note: 'Calling get(s, 0) again builds a second object with the same values. Every call pays for another allocation.' },
  { line: 9, objs: [{ name: 'a', x: 1, y: 3 }, { name: 'b', x: 1, y: 3 }], hl: 'ident', out: 'false', note: 'a === b compares identities, not contents: these are two different objects, so it prints false. With an array of objects, asking for particle 0 twice gives the same object both times.' },
  { line: 10, objs: [{ name: 'a', x: 99, y: 3 }, { name: 'b', x: 1, y: 3 }], hl: 'write', note: 'a.x = 99 changes the copy, and only the copy. Nothing links a back to the column, so s.x[0] is untouched.' },
  { line: 11, objs: [{ name: 'a', x: 99, y: 3 }, { name: 'b', x: 1, y: 3 }], hl: 'write', out: '1', note: 'It prints 1. An optimizer that turns objects into columns must make sure no program can notice either difference: new identities, and writes that go nowhere.' },
];

function Col({ y, name, vals, c }: { y: number; name: string; vals: number[]; c: string }) {
  return (
    <g>
      <T x={22} y={y + 14} size={13} mono weight={700} anchor="end" fill={tok(c)}>{name}</T>
      {vals.map((v, k) => (
        <Box key={k} x={30 + k * 44} y={y} w={40} h={28} r={3} fill={tok(c, k === 0 ? 0.3 : 0.12)} stroke={tok(c)}>
          <T x={50 + k * 44} y={y + 14} size={13} mono anchor="middle">{v}</T>
        </Box>
      ))}
    </g>
  );
}

export default function MaterializeSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="Building objects from columns" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={176} title="Two columns, x and y, on the left; the objects built from them on the right, each with its own header.">
        <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>COLUMNS</T>
        <Col y={26} name="x" vals={[1, 2]} c="f1" />
        <Col y={64} name="y" vals={[3, 4]} c="f2" />
        <T x={30} y={112} size={10} fill={tok('muted')}>slot 0 = particle 0</T>
        <T x={212} y={12} size={11} weight={700} fill={tok('muted')}>NEW OBJECTS</T>
        {st.objs.map((o, k) => {
          const x0 = 212 + k * 92;
          return (
            <g key={o.name}>
              <T x={x0} y={30} size={13} mono weight={700}>{o.name}</T>
              <Box x={x0} y={40} w={84} h={16} r={3} fill={tok('ink', 0.08)} stroke={tok('ink', 0.3)}>
                <T x={x0 + 6} y={48} size={10} fill={tok('muted')}>header</T>
              </Box>
              <Box x={x0} y={58} w={84} h={24} r={3} fill={tok('f1', 0.15)} stroke={st.hl === 'write' && o.name === 'a' ? tok('danger') : tok('f1')}>
                <T x={x0 + 6} y={70} size={12} mono>x: {o.x}</T>
              </Box>
              <Box x={x0} y={84} w={84} h={24} r={3} fill={tok('f2', 0.15)} stroke={tok('f2')}>
                <T x={x0 + 6} y={96} size={12} mono>y: {o.y}</T>
              </Box>
            </g>
          );
        })}
        {st.hl === 'copy' && st.objs.length > 0 && (
          <Arrow x1={72} y1={40} x2={208 + (st.objs.length - 1) * 92} y2={70} width={1.4} color={tok('ink', 0.45)} dash />
        )}
        {st.hl === 'ident' && <T x={300} y={128} size={12} mono anchor="middle" fill={tok('danger')}>a and b: two identities</T>}
        {st.out && <T x={8} y={160} size={13} mono weight={700}>prints: {st.out}</T>}
      </Svg>
    </StepFrame>
  );
}
