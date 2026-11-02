// Chapter 116: how an optimizing compiler removes a temporary object. The
// steps follow TurboFan's escape analysis as its source describes it
// (src/compiler/escape-analysis.{h,cc} and escape-analysis-reducer.cc):
// a virtual object per allocation, its fields tracked as variables, loads
// replaced, the allocation removed, and an ObjectState in the deopt frame
// state so the deoptimizer can rebuild it. The code is a simplified sketch.
import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const SRC = `function len2(p) {
  return p.x * p.x + p.y * p.y;
}
for (let i = 0; i < n; i++)
  t += len2({ x: xs[i], y: ys[i] });`;

const INLINED = `for (let i = 0; i < n; i++) {
  const p = { x: xs[i], y: ys[i] };
  t += p.x * p.x + p.y * p.y;
}`;

const REPLACED = `for (let i = 0; i < n; i++) {
  const p_x = xs[i];
  const p_y = ys[i];
  t += p_x * p_x + p_y * p_y;
}`;

const ESCAPES = `for (let i = 0; i < n; i++) {
  const p = { x: xs[i], y: ys[i] };
  t += p.x * p.x + p.y * p.y;
  out[i] = p;
}`;

type Obj = 'real' | 'virtual' | 'gone' | 'deopt';
type S = { code: string; line: number | null; obj: Obj; uses: { t: string; ok: boolean | null }[]; allocs: string; note: string };

const STATES: S[] = [
  { code: SRC, line: 4, obj: 'real', uses: [{ t: 'passed to len2(p)', ok: false }], allocs: '1 per iteration', note: 'Each iteration builds a fresh object and passes it to len2. Seen from the loop alone, the object escapes into a call: the compiler can’t know what len2 does with it.' },
  { code: INLINED, line: 1, obj: 'real', uses: [{ t: 'p.x read', ok: null }, { t: 'p.y read', ok: null }], allocs: '1 per iteration', note: 'TurboFan copies len2’s body into the loop (inlining, chapter 135). Now every use of p is in view: there is no call any more, only field reads.' },
  { code: INLINED, line: 2, obj: 'virtual', uses: [{ t: 'p.x read', ok: true }, { t: 'p.y read', ok: true }], allocs: 'still in the code', note: 'Escape analysis treats the allocation as a virtual object whose fields are just variables: x holds xs[i], y holds ys[i]. Every use is a field read, so p never escapes.' },
  { code: REPLACED, line: 3, obj: 'gone', uses: [{ t: 'p.x → p_x', ok: true }, { t: 'p.y → p_y', ok: true }], allocs: '0', note: 'Scalar replacement: each read p.x becomes the value that was stored there. Nothing reads the object any more, so the allocation is removed. The field values can stay in registers.' },
  { code: REPLACED, line: null, obj: 'deopt', uses: [{ t: 'frame state: p = {x: p_x, y: p_y}', ok: true }], allocs: '0 (unless a deopt)', note: 'One user remains: the deopt information. If a guard in this loop fails, the interpreter will expect a real p. So the frame state describes p by its fields, and the deoptimizer builds the object then, and only then.' },
  { code: ESCAPES, line: 3, obj: 'real', uses: [{ t: 'p.x read', ok: true }, { t: 'p.y read', ok: true }, { t: 'stored into out[i]', ok: false }], allocs: '1 per iteration', note: 'Store p into an array and it escapes: something outside the loop can now see it, and see that out[0] !== out[1]. The object must really exist, so the allocation stays.' },
];

export default function ScalarSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const objOpacity = st.obj === 'gone' ? 0.25 : 1;
  const dashed = st.obj !== 'real';
  return (
    <StepFrame title="Removing a temporary object" steps={s} note={st.note}>
      <CodeTrace code={st.code} line={st.line} />
      <Svg w={400} h={230} title="The temporary object p with fields x and y, its uses, and the allocations per iteration">
        <T x={4} y={12} size={11} weight={700} fill={tok('muted')}>THE OBJECT p</T>
        <Box x={4} y={24} w={150} h={92} dash={dashed} opacity={objOpacity} fill={st.obj === 'real' ? tok('panel') : 'transparent'} stroke={st.obj === 'deopt' ? tok('warn') : tok('ink', 0.6)}>
          <T x={14} y={42} size={11} fill={tok('muted')}>{st.obj === 'real' ? 'heap object' : st.obj === 'virtual' ? 'virtual object' : st.obj === 'gone' ? 'no object' : 'built only on deopt'}</T>
          <Box x={14} y={54} w={130} h={24} r={3} fill={tok('f1', 0.18)} stroke={tok('f1')}>
            <T x={22} y={66} size={12} mono>x: {st.obj === 'real' ? 'xs[i]' : 'p_x'}</T>
          </Box>
          <Box x={14} y={84} w={130} h={24} r={3} fill={tok('f2', 0.18)} stroke={tok('f2')}>
            <T x={22} y={96} size={12} mono>y: {st.obj === 'real' ? 'ys[i]' : 'p_y'}</T>
          </Box>
        </Box>
        {(st.obj === 'gone' || st.obj === 'deopt') && (
          <g>
            <Arrow x1={110} y1={66} x2={110} y2={146} color={tok('f1')} dash />
            <Arrow x1={130} y1={96} x2={130} y2={146} color={tok('f2')} dash />
            <Box x={84} y={148} w={70} h={26} r={3} fill={tok('safe', 0.1)} stroke={tok('safe')}>
              <T x={119} y={161} size={11} anchor="middle">registers</T>
            </Box>
          </g>
        )}
        <T x={176} y={12} size={11} weight={700} fill={tok('muted')}>USES OF p</T>
        {st.uses.map((u, k) => {
          const c = u.ok === null ? 'muted' : u.ok ? 'safe' : 'danger';
          return (
            <Box key={k} x={176} y={24 + k * 32} w={220} h={26} r={4} fill={tok(c, 0.1)} stroke={tok(c)}>
              <T x={184} y={37 + k * 32} size={11} mono>{u.t}</T>
            </Box>
          );
        })}
        <T x={4} y={200} size={11} weight={700} fill={tok('muted')}>ALLOCATIONS</T>
        <T x={4} y={218} size={13} mono weight={700} fill={st.allocs.startsWith('0') ? tok('safe') : tok('ink')}>{st.allocs}</T>
      </Svg>
    </StepFrame>
  );
}
