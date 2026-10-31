// Chapter 84: why one push of an element into another array blocks the
// struct-of-arrays layout. Arrows that Viscosity can follow (from the
// array's own slots, or from SSA values like p) are fine; an arrow stored
// somewhere it doesn't track makes the element possibly aliased.
import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const CODE = `const ps = [];   // 100 × ps.push({ x: i })
const p = ps[3];
p.x = 42;
const keep = [];
keep.push(p);
keep[0].x = 7;`;

type S = {
  line: number | null;
  p?: boolean;
  keep?: boolean;
  keepArrow?: boolean;
  x3: string;
  soa?: boolean;
  note: string;
};

const STATES: S[] = [
  { line: 0, x3: '3', note: 'ps holds 100 records. Each record was a fresh { x: i } pushed straight in, so each one has exactly one arrow pointing at it: from its own slot in ps.' },
  { line: 1, p: true, x3: '3', note: 'const p = ps[3]. p is an SSA value, and Viscosity knows exactly what it points at: element 3 of ps. A must-alias it can follow, so it can rewrite p as the index 3.' },
  { line: 2, p: true, x3: '42', note: 'p.x = 42 is a write through that known alias. In struct-of-arrays form it would simply become ps.x[3] = 42.' },
  { line: 4, p: true, keep: true, keepArrow: true, x3: '42', note: 'keep.push(p) stores the arrow inside another array. Now a slot of keep points at element 3, and Viscosity doesn’t track where keep’s slots go. Element 3 may be aliased by anything that reads keep.' },
  { line: 5, p: true, keep: true, keepArrow: true, x3: '7', note: 'In the original program, keep[0].x = 7 changes the one and only record, so ps[3].x is 7 too. Two names, one object: the aliasing from chapter 4.' },
  { line: null, p: true, keep: true, soa: true, x3: '42', note: 'Imagine ps as columns anyway. There is no record 3 any more, only ps.x[3]. keep[0] would need some object: a copy. Then keep[0].x = 7 changes the copy, and ps.x[3] stays 42. Wrong answer. So Viscosity keeps ps as objects.' },
];

export default function AliasSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const SX = [150, 194, 238, 282];
  return (
    <StepFrame title="One push that blocks the layout" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={236} title="References on the left, ps’s slots and records on the right, and keep’s slot pointing at record 3">
        <T x={10} y={12} size={11} weight={700} fill={tok('muted')}>NAMES</T>
        <T x={150} y={12} size={11} weight={700} fill={tok('muted')}>{st.soa ? 'ps AS COLUMNS' : 'OBJECTS'}</T>
        <Box x={10} y={26} w={50} h={28}><T x={22} y={40} size={14} mono weight={700}>ps</T></Box>
        <Arrow x1={60} y1={40} x2={146} y2={40} />
        {!st.soa && SX.map((x, k) => (
          <g key={k}>
            <Box x={x} y={26} w={40} h={28} r={3}><T x={x + 20} y={40} size={11} mono anchor="middle">[{k === 3 ? 3 : k}]</T></Box>
            <Arrow x1={x + 20} y1={54} x2={x + 20} y2={92} color={tok('ink', 0.5)} />
            <Box x={x} y={94} w={40} h={30} r={6} fill={k === 3 ? tok('brand', 0.12) : tok('panel')} stroke={k === 3 ? tok('brand') : tok('line')}>
              <T x={x + 20} y={109} size={11} mono anchor="middle">x:<tspan fill={tok('f1')} fontWeight={700}>{k === 3 ? st.x3 : k}</tspan></T>
            </Box>
          </g>
        ))}
        {!st.soa && <T x={330} y={40} size={11} fill={tok('muted')}>… 100 slots</T>}
        {st.soa && (
          <g>
            <Box x={146} y={26} w={180} h={28} r={3} fill={tok('f1', 0.1)} stroke={tok('f1')}>
              <T x={156} y={40} size={12} mono>x: [0, 1, 2, <tspan fontWeight={700}>{st.x3}</tspan>, …]</T>
            </Box>
            <T x={150} y={109} size={11} fill={tok('muted')}>no record objects any more</T>
          </g>
        )}
        {st.p && (
          <g>
            <Box x={10} y={136} w={50} h={28} stroke={tok('safe')}><T x={26} y={150} size={14} mono weight={700}>p</T></Box>
            {st.soa
              ? <T x={70} y={150} size={11} mono fill={tok('safe')}>= index 3</T>
              : <Arrow x1={60} y1={150} x2={300} y2={124} color={tok('safe')} />}
          </g>
        )}
        {st.keep && (
          <g>
            <Box x={10} y={186} w={50} h={28}><T x={16} y={200} size={13} mono weight={700}>keep</T></Box>
            <Arrow x1={60} y1={200} x2={146} y2={200} />
            <Box x={150} y={186} w={40} h={28} r={3} stroke={st.keepArrow || st.soa ? tok('danger') : tok('line')}><T x={170} y={200} size={11} mono anchor="middle">[0]</T></Box>
            {st.keepArrow && <Arrow x1={190} y1={196} x2={300} y2={126} color={tok('danger')} width={2.4} bend={0.3} />}
            {st.soa && (
              <g>
                <Arrow x1={190} y1={200} x2={244} y2={200} color={tok('danger')} />
                <Box x={246} y={184} w={92} h={32} r={6} dash fill={tok('danger', 0.08)} stroke={tok('danger')}>
                  <T x={292} y={200} size={11} mono anchor="middle">copy {'{'} x:<tspan fontWeight={700}>7</tspan> {'}'}</T>
                </Box>
              </g>
            )}
          </g>
        )}
      </Svg>
    </StepFrame>
  );
}
