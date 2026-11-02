import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// A design sketch, not something Viscosity does: a handle object standing
// in for element 0 of a struct of arrays, and what it takes to keep === true.
const CODE = `const h1 = at(0);
keep.push(h1);
keep[0].x = 42;
console.log(ps[0].x);
const h2 = at(0);
console.log(h1 === h2);
console.log(Object.keys(h1));`;

type S = {
  line: number | null;
  x0: number;
  h1?: boolean;
  keep?: boolean;
  write?: boolean;
  read?: boolean;
  h2?: 'new' | 'cached';
  keys?: boolean;
  verdict?: { text: string; ok: boolean };
  note: string;
};

const STATES: S[] = [
  { line: null, x0: 5, note: 'After the SoA rewrite, ps is a container of columns. Element 0 isn’t an object any more: it is slot 0 of each column. Here is the x column.' },
  { line: 0, x0: 5, h1: true, note: 'Suppose code needs ps[0] as a value. A handle is a small object that stands for the element: it remembers the container and the index, and nothing else. Its x is a getter and setter that use the column.' },
  { line: 1, x0: 5, h1: true, keep: true, note: 'The program keeps the element in another array. With a handle that is fine: keep[0] holds a reference to the handle, just as it held a reference to the object before.' },
  { line: 2, x0: 42, h1: true, keep: true, write: true, note: 'keep[0].x = 42 calls the setter, which writes ps.x[0]. The value lives in exactly one place, the column, so there is no stale copy anywhere.' },
  { line: 3, x0: 42, h1: true, keep: true, read: true, verdict: { text: 'prints 42, as before', ok: true }, note: 'Reading ps[0].x reads the same column slot and sees 42. Aliasing works: two paths to element 0, one value. A materialised copy would have printed 5 here.' },
  { line: 5, x0: 42, h1: true, keep: true, h2: 'new', verdict: { text: 'h1 === h2 → false (was true)', ok: false }, note: 'But ask for element 0 again and the naive at(i) builds a second handle. Both stand for the same element, yet they are different objects. The original program printed true here. Identity is broken.' },
  { line: 5, x0: 42, h1: true, keep: true, h2: 'cached', verdict: { text: 'h1 === h2 → true', ok: true }, note: 'Fix: cache one handle per index. at(0) returns the handle it made before, so === is true again. The price: one object per element that was ever handed out, which is what SoA was meant to remove.' },
  { line: 6, x0: 42, h1: true, keep: true, h2: 'cached', keys: true, verdict: { text: "keys: [ 'c', 'i' ], not [ 'x' ]", ok: false }, note: 'And a handle still doesn’t look like the original object. Object.keys, JSON.stringify, spreading and console.log all see c and i instead of x. Each of those would need emulating too.' },
];

const CX = 150;
const SW = 46;

export default function HandleSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const xs = [st.x0, 6, 7, 8];
  return (
    <StepFrame title="A handle for one element" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={250} title="A struct-of-arrays container, a handle object pointing at index 0, and the identity check">
        <Box x={CX - 12} y={8} w={SW * 4 + 24} h={62} fill={tok('panel')}>
          <T x={CX} y={22} size={11} mono fill={tok('muted')}>ps (container)</T>
          <T x={CX} y={48} size={12} mono>x</T>
          {xs.map((v, k) => (
            <g key={k}>
              <rect x={CX + 14 + k * SW} y={34} width={SW - 6} height={26} rx={3}
                fill={tok('f1', k === 0 && (st.write || st.read) ? 0.95 : 0.6)}
                stroke={k === 0 && (st.write || st.read) ? tok('brand') : tok('f1')} strokeWidth={k === 0 && (st.write || st.read) ? 2.5 : 1.2} />
              <T x={CX + 14 + k * SW + (SW - 6) / 2} y={47} size={12} mono anchor="middle" fill={tok('paper')}>{v}</T>
            </g>
          ))}
        </Box>
        {st.keep && (
          <Box x={8} y={92} w={84} h={40} fill={tok('panel')}>
            <T x={16} y={104} size={11} mono fill={tok('muted')}>keep</T>
            <T x={16} y={122} size={12} mono>[ ● ]</T>
          </Box>
        )}
        {st.keep && st.h1 && <Arrow x1={48} y1={124} x2={112} y2={150} color={tok('ink', 0.6)} width={1.5} />}
        {st.h1 && (
          <Box x={114} y={136} w={110} h={48} stroke={tok('brand')} fill={tok('brand', 0.08)}>
            <T x={122} y={150} size={11} mono weight={700}>h1 (handle)</T>
            <T x={122} y={170} size={11} mono>c: ps, i: 0</T>
          </Box>
        )}
        {st.h1 && <Arrow x1={170} y1={136} x2={CX + 30} y2={64} color={tok('brand', 0.8)} width={1.5} dash={!st.write && !st.read} />}
        {st.h2 === 'new' && (
          <Box x={262} y={136} w={110} h={48} stroke={tok('danger')} fill={tok('danger', 0.08)}>
            <T x={270} y={150} size={11} mono weight={700}>h2 (handle)</T>
            <T x={270} y={170} size={11} mono>c: ps, i: 0</T>
          </Box>
        )}
        {st.h2 === 'new' && <Arrow x1={300} y1={136} x2={CX + 40} y2={64} color={tok('danger', 0.8)} width={1.5} dash />}
        {st.h2 === 'cached' && (
          <g>
            <Box x={262} y={136} w={110} h={48} fill={tok('safe', 0.08)} stroke={tok('safe')}>
              <T x={270} y={150} size={11} mono weight={700}>cache hs</T>
              <T x={270} y={170} size={11} mono>[ h1, –, –, – ]</T>
            </Box>
            <Arrow x1={262} y1={162} x2={226} y2={162} color={tok('safe')} width={1.5} />
          </g>
        )}
        {st.write && <T x={240} y={110} size={11} mono fill={tok('brand')}>set x(42) → ps.x[0]</T>}
        {st.read && <T x={240} y={110} size={11} mono fill={tok('brand')}>ps.x[0] → 42</T>}
        {st.keys && <T x={122} y={200} size={11} mono fill={tok('danger')}>own keys: c, i</T>}
        {st.verdict && (
          <T x={200} y={232} size={13} weight={700} anchor="middle" fill={st.verdict.ok ? tok('safe') : tok('danger')}>{st.verdict.text}</T>
        )}
      </Svg>
    </StepFrame>
  );
}
