import { Arrow, Box, Svg, T, tok } from '../../viz/svg';
import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';

// A Map keyed by objects compares keys by identity (which object), not by
// contents. Blue arrows are references held by variables; the orange
// box is the lookup being made; green marks a hit and red a miss.
const CODE = `const a = { x: 1 };
const b = a;
const c = { x: 1 };
const m = new Map([[a, 'A']]);
m.get(b); // 'A'
m.get(c); // undefined
new Map([['1,2', 'A']]).get('1,2');`;

type S = { line: number; vars: string[]; map: boolean; look?: 'b' | 'c' | 's'; note: string };
const STATES: S[] = [
  { line: 0, vars: ['a'], map: false, note: 'a holds a reference to a new object on the heap: an arrow, not the object itself.' },
  { line: 1, vars: ['a', 'b'], map: false, note: 'b = a copies the reference. There is still one object, and both names lead to it.' },
  { line: 2, vars: ['a', 'b', 'c'], map: false, note: 'c is a second object that happens to look the same: same fields, same values, a different place in memory.' },
  { line: 3, vars: ['a', 'b', 'c'], map: true, note: 'The Map stores the key as a reference to the first object. It does not look inside the object at all.' },
  { line: 4, vars: ['a', 'b', 'c'], map: true, look: 'b', note: 'm.get(b): b leads to the very object that is the key, so the lookup hits and returns A.' },
  { line: 5, vars: ['a', 'b', 'c'], map: true, look: 'c', note: 'm.get(c): c leads to a different object. Equal contents do not matter; the lookup misses and returns undefined.' },
  { line: 6, vars: ['a', 'b', 'c'], map: true, look: 's', note: 'Strings are compared by value, so a key built from the contents, such as the string 1,2, is found by any equal string. This is how an engine keys a table by contents.' },
];

export default function MapKeySteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const vy: Record<string, number> = { a: 30, b: 66, c: 102 };
  const objY: Record<string, number> = { a: 46, c: 112 };
  const tgt = (v: string) => (v === 'c' ? 'c' : 'a');
  const hit = st.look === 'b' || st.look === 's';
  return (
    <StepFrame title="Map keys: identity, not contents" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={170} title="Variables a and b point at one object, c at a lookalike; a Map keyed by the first object finds it through b but not through c">
        <T x={10} y={12} size={11} weight={700} fill={tok('muted')}>VARIABLES</T>
        <T x={150} y={12} size={11} weight={700} fill={tok('muted')}>HEAP</T>
        <T x={300} y={12} size={11} weight={700} fill={tok('muted')}>MAP m</T>
        {st.vars.map((v) => (
          <g key={v}>
            <Box x={10} y={vy[v] - 12} w={50} h={24} fill={st.look === v ? tok('brand', 0.25) : tok('panel')} stroke={st.look === v ? tok('brand') : tok('line')}>
              <T x={35} y={vy[v]} size={13} mono weight={700} anchor="middle">{v}</T>
            </Box>
            <Arrow x1={60} y1={vy[v]} x2={146} y2={objY[tgt(v)] + 4} color={tok('accent')} />
          </g>
        ))}
        <Box x={150} y={34} w={100} h={30}><T x={200} y={49} size={12} mono anchor="middle">{'{ x: 1 }'}</T></Box>
        {st.vars.includes('c') && <Box x={150} y={100} w={100} h={30}><T x={200} y={115} size={12} mono anchor="middle">{'{ x: 1 }'}</T></Box>}
        {st.map && (
          <g>
            <Box x={290} y={34} w={100} h={30} fill={st.look === 'b' ? tok('safe', 0.2) : st.look === 'c' ? tok('danger', 0.15) : tok('panel')} stroke={st.look === 'b' ? tok('safe') : st.look === 'c' ? tok('danger') : tok('line')}>
              <T x={340} y={49} size={12} mono anchor="middle">key → 'A'</T>
            </Box>
            <Arrow x1={290} y1={49} x2={252} y2={49} color={tok('accent')} />
          </g>
        )}
        {st.look === 's' && (
          <Box x={290} y={100} w={100} h={30} fill={tok('safe', 0.2)} stroke={tok('safe')}>
            <T x={340} y={115} size={12} mono anchor="middle">'1,2' → 'A'</T>
          </Box>
        )}
        {st.look && <T x={10} y={156} size={13} mono weight={700} fill={hit ? tok('safe') : tok('danger')}>{hit ? "hit: 'A'" : 'miss: undefined'}</T>}
      </Svg>
    </StepFrame>
  );
}
