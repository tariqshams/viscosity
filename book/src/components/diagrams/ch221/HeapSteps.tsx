// Chapter 221: why an object named only by its allocation site merges the
// objects a factory makes for different callers, and how a heap context
// (the allocation site plus the context it ran in) keeps them apart.
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';
import { StepFrame, useSteps } from '../../viz/stepper';

type Obj = { id: string; v: string; ok: boolean };
type S = { title: string; code: string[]; a: string; b: string; objs: Obj[]; note: string };

const BASE = ['function box() {', '  return { v: null }; // h', '}', 'const a = box(); // s1', 'const b = box(); // s2', 'a.v = x; // x → ox', 'b.v = y; // y → oy'];
const WRAP = ['function box() {', '  return { v: null }; // h', '}', 'function make() {', '  return box(); // s3', '}', 'const a = make(); // s1', 'const b = make(); // s2', 'a.v = x; b.v = y;'];

const STATES: S[] = [
  { title: 'the program', code: BASE, a: '', b: '', objs: [], note: 'A factory: box makes a fresh object at one allocation site, h, and is called twice. At run time a and b are two different objects, so a.v is always ox and b.v is always oy.' },
  { title: 'objects named by site', code: BASE, a: 'h', b: 'h', objs: [{ id: 'h', v: '{ox, oy}', ok: false }], note: 'Name every object by its allocation site and there is only one abstract object, h. Both a and b point at it, both stores land in h.v, and reading a.v gives {ox, oy}: a false alias, shown in red.' },
  { title: 'call contexts, heap still by site', code: BASE, a: 'h', b: 'h', objs: [{ id: 'h', v: '{ox, oy}', ok: false }], note: 'Analysing box once for [s1] and once for [s2] keeps its local variables apart, but in both contexts the object it returns is the same h. Call contexts alone do not help a factory.' },
  { title: 'heap context, k = 1', code: BASE, a: 'h@[s1]', b: 'h@[s2]', objs: [{ id: 'h@[s1]', v: '{ox}', ok: true }, { id: 'h@[s2]', v: '{oy}', ok: true }], note: 'Now name an object by its site and the context its allocation ran in. box ran in [s1] and in [s2], so there are two abstract objects, and each field holds one value (green): the analysis agrees with every run.' },
  { title: 'a wrapper, heap context k = 1', code: WRAP, a: 'h@[s3]', b: 'h@[s3]', objs: [{ id: 'h@[s3]', v: '{ox, oy}', ok: false }], note: 'Put the factory behind make. Every call to box now comes from s3, so with one site of context both objects are h@[s3] and merge again. Two sites, h@[s3, s1] and h@[s3, s2], separate them, at the price of more abstract objects.' },
];

export default function HeapSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const ys: Record<string, number> = {};
  st.objs.forEach((o, k) => { ys[o.id] = 70 + k * 90; });
  return (
    <StepFrame title="Naming objects, with and without a heap context" steps={s} note={st.note}>
      <Svg w={420} h={250} title="Code on the left; on the right the variables a and b, the abstract objects they point at, and what each object's field v may hold">
        <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>{st.title.toUpperCase()}</T>
        {st.code.map((l, k) => (
          <T key={k} x={8} y={36 + k * 20} size={11} mono>{l}</T>
        ))}
        {st.a && (
          <g>
            <Box x={236} y={56} w={34} h={28}><T x={253} y={70} size={12} mono anchor="middle">a</T></Box>
            <Box x={236} y={146} w={34} h={28}><T x={253} y={160} size={12} mono anchor="middle">b</T></Box>
            {st.objs.map((o) => {
              const y = ys[o.id];
              const c = o.ok ? 'safe' : 'danger';
              return (
                <Box key={o.id} x={300} y={y - 22} w={114} h={44} fill={tok(c, 0.12)} stroke={tok(c)}>
                  <T x={357} y={y - 9} size={11} mono anchor="middle">{o.id}</T>
                  <T x={357} y={y + 9} size={11} mono anchor="middle">v: {o.v}</T>
                </Box>
              );
            })}
            <Arrow x1={270} y1={70} x2={298} y2={ys[st.a] - 4} />
            <Arrow x1={270} y1={160} x2={298} y2={ys[st.b] + 4} />
          </g>
        )}
      </Svg>
    </StepFrame>
  );
}
