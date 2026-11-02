import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const CODE = `const a = { x: 1 };
const b = a;
b.x = 99;
console.log(a.x);
const c = { x: 99 };
console.log(a === b);
console.log(a === c);`;

type S = { line: number; vars: ('a' | 'b' | 'c')[]; obj1: number; obj2: boolean; out: string[]; hl?: 'ab' | 'ac'; note: string };

const STATES: S[] = [
  { line: 0, vars: ['a'], obj1: 1, obj2: false, out: [], note: '{ x: 1 } creates an object somewhere in memory. The variable a doesn’t hold the object itself: it holds an arrow (a reference) to it.' },
  { line: 1, vars: ['a', 'b'], obj1: 1, obj2: false, out: [], note: 'const b = a copies the arrow, not the object. Now two names point at ONE object. This is called aliasing.' },
  { line: 2, vars: ['a', 'b'], obj1: 99, obj2: false, out: [], note: 'b.x = 99 follows b’s arrow and changes the object it lands on. There is only one object, so…' },
  { line: 3, vars: ['a', 'b'], obj1: 99, obj2: false, out: ['99'], note: '…a.x is 99 too. Nothing was “copied back”: a and b were always looking at the same object.' },
  { line: 4, vars: ['a', 'b', 'c'], obj1: 99, obj2: true, out: ['99'], note: 'A new { } always makes a brand-new object, even with identical contents. c points at the new one.' },
  { line: 5, vars: ['a', 'b', 'c'], obj1: 99, obj2: true, out: ['99', 'true'], hl: 'ab', note: 'a === b compares the arrows. They point at the same object, so: true.' },
  { line: 6, vars: ['a', 'b', 'c'], obj1: 99, obj2: true, out: ['99', 'true', 'false'], hl: 'ac', note: 'a === c is false: same contents, but two different objects. For objects, === asks “same object?”, not “same contents?”.' },
];

export default function RefSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const vy = { a: 30, b: 80, c: 130 } as const;
  return (
    <StepFrame title="Two names, one object" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={170} title="Variables on the left hold arrows to objects on the right">
        <T x={10} y={10} size={11} weight={700} fill={tok('muted')}>VARIABLES</T>
        <T x={230} y={10} size={11} weight={700} fill={tok('muted')}>OBJECTS IN MEMORY</T>
        {(['a', 'b', 'c'] as const).map((v) => st.vars.includes(v) && (
          <g key={v}>
            <Box x={10} y={vy[v] - 16} w={60} h={32} stroke={(st.hl === 'ab' && v !== 'c') || (st.hl === 'ac' && v !== 'b') ? tok('brand') : tok('ink', 0.5)}>
              <T x={24} y={vy[v]} size={16} mono weight={700}>{v}</T>
              <circle cx={56} cy={vy[v]} r={4} fill={tok('ink', 0.8)} />
            </Box>
            <Arrow x1={60} y1={vy[v]} x2={226} y2={v === 'c' ? 128 : 52} bend={v === 'b' ? -0.4 : 0} />
          </g>
        ))}
        <Box x={228} y={28} w={150} h={48} r={8} fill={tok('brand', 0.1)} stroke={tok('brand')}>
          <T x={246} y={52} size={15} mono>{'{ x: '}<tspan fill={tok('f1')} fontWeight={700}>{st.obj1}</tspan>{' }'}</T>
        </Box>
        {st.obj2 && (
          <Box x={228} y={104} w={150} h={48} r={8} fill={tok('accent', 0.1)} stroke={tok('accent')}>
            <T x={246} y={128} size={15} mono>{'{ x: '}<tspan fill={tok('f1')} fontWeight={700}>99</tspan>{' }'}</T>
          </Box>
        )}
        {st.out.length > 0 && <T x={10} y={164} size={13} mono fill={tok('muted')}>prints: {st.out.join(', ')}</T>}
      </Svg>
    </StepFrame>
  );
}
