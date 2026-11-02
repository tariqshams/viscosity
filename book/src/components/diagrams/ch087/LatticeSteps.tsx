// 'Elements kinds': one array walking down the elements-kind lattice. Every kind
// shown at every step is what %DebugPrint printed in Node v22.23.4
// (V8 12.4) for the same lines of code. The backing store names
// (FixedArray, FixedDoubleArray) come from the same output.
import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const CODE = `const a = [1, 2, 3];
a.push(4.56);
a[3] = 4;
a.push('x');
a[9] = 1;`;

type Base = 'SMI' | 'DOUBLE' | 'ELEMENTS';
type Kind = { base: Base; holey: boolean };
type Slot = string | null; // null is a hole

type S = { line: number | null; kind: Kind; slots: Slot[]; store: string; seen: string[]; note: string };

const id = (k: Kind) => `${k.holey ? 'HOLEY' : 'PACKED'}_${k.base}`;
const BASES: Base[] = ['SMI', 'DOUBLE', 'ELEMENTS'];
const full = (n: string) => (n.endsWith('ELEMENTS') ? n : `${n}_ELEMENTS`);

const STATES: S[] = [
  { line: 0, kind: { base: 'SMI', holey: false }, slots: ['1', '2', '3'], store: 'FixedArray', seen: ['PACKED_SMI'], note: 'An array literal of small integers starts at the top: PACKED_SMI_ELEMENTS. Every slot holds a Smi, and V8 can optimise operations on the array for exactly that.' },
  { line: 1, kind: { base: 'DOUBLE', holey: false }, slots: ['1', '2', '3', '4.56'], store: 'FixedDoubleArray', seen: ['PACKED_SMI', 'PACKED_DOUBLE'], note: '4.56 is not a Smi. The array moves down one level to PACKED_DOUBLE_ELEMENTS, and its backing store becomes a FixedDoubleArray: raw doubles, side by side.' },
  { line: 2, kind: { base: 'DOUBLE', holey: false }, slots: ['1', '2', '3', '4'], store: 'FixedDoubleArray', seen: ['PACKED_SMI', 'PACKED_DOUBLE'], note: 'Overwrite the double with the integer 4. Every element is an integer again, but the kind stays PACKED_DOUBLE_ELEMENTS. Transitions only go one way.' },
  { line: 3, kind: { base: 'ELEMENTS', holey: false }, slots: ['1', '2', '3', '4', "'x'"], store: 'FixedArray', seen: ['PACKED_SMI', 'PACKED_DOUBLE', 'PACKED_ELEMENTS'], note: "A string can't be stored as a double, so the array falls to PACKED_ELEMENTS: a FixedArray of tagged values, any JavaScript value at all." },
  { line: 4, kind: { base: 'ELEMENTS', holey: true }, slots: ['1', '2', '3', '4', "'x'", null, null, null, null, '1'], store: 'FixedArray', seen: ['PACKED_SMI', 'PACKED_DOUBLE', 'PACKED_ELEMENTS', 'HOLEY_ELEMENTS'], note: 'Writing a[9] when the length is 5 leaves slots 5 to 8 empty: holes. The kind moves across to HOLEY_ELEMENTS. Filling the holes later would not move it back.' },
];

const COLX = { PACKED: 106, HOLEY: 296 };
const rowY = (b: Base) => 40 + BASES.indexOf(b) * 58;

export default function LatticeSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const cur = id(st.kind);
  const bw = 150;
  const bh = 34;
  return (
    <StepFrame title="Down the elements-kind lattice" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={300} title="Six elements kinds in a grid: SMI, DOUBLE and ELEMENTS down the side, PACKED and HOLEY across. Arrows point only down and to the right.">
        <T x={COLX.PACKED} y={10} size={11} weight={700} anchor="middle" fill={tok('muted')}>PACKED</T>
        <T x={COLX.HOLEY} y={10} size={11} weight={700} anchor="middle" fill={tok('muted')}>HOLEY</T>
        {BASES.map((b, i) => (
          <g key={b}>
            {i < 2 && (
              <>
                <Arrow x1={COLX.PACKED} y1={rowY(b) + bh / 2} x2={COLX.PACKED} y2={rowY(BASES[i + 1]) - bh / 2 - 2} color={tok('muted')} />
                <Arrow x1={COLX.HOLEY} y1={rowY(b) + bh / 2} x2={COLX.HOLEY} y2={rowY(BASES[i + 1]) - bh / 2 - 2} color={tok('muted')} />
              </>
            )}
            <Arrow x1={COLX.PACKED + bw / 2} y1={rowY(b)} x2={COLX.HOLEY - bw / 2 - 3} y2={rowY(b)} color={tok('muted')} />
          </g>
        ))}
        {BASES.flatMap((b) =>
          (['PACKED', 'HOLEY'] as const).map((p) => {
            const name = `${p}_${b}`;
            const here = name === cur;
            const was = st.seen.includes(name) && !here;
            return (
              <Box key={name} x={COLX[p] - bw / 2} y={rowY(b) - bh / 2} w={bw} h={bh} fill={here ? tok('brand', 0.18) : was ? tok('muted', 0.12) : tok('panel')} stroke={here ? tok('brand') : tok('line')}>
                <T x={COLX[p]} y={rowY(b)} size={11} mono weight={here ? 700 : 400} anchor="middle" fill={here ? tok('ink') : tok('muted')}>{name}</T>
              </Box>
            );
          }),
        )}
        <T x={4} y={196} size={11} weight={700} fill={tok('muted')}>ELEMENTS OF a</T>
        <T x={396} y={196} size={11} mono anchor="end" fill={tok('muted')}>{st.store}</T>
        {st.slots.map((v, k) => {
          const w = 38;
          const x = 4 + k * (w + 1);
          return (
            <g key={k}>
              <Box x={x} y={208} w={w} h={34} r={3} dash={v === null} fill={v === null ? 'transparent' : tok('panel')} stroke={v === null ? tok('muted') : tok('ink', 0.5)}>
                <T x={x + w / 2} y={225} size={11} mono anchor="middle" fill={v === null ? tok('muted') : tok('ink')}>{v === null ? 'hole' : v}</T>
              </Box>
              <T x={x + w / 2} y={252} size={11} mono anchor="middle" fill={tok('muted')}>{k}</T>
            </g>
          );
        })}
        <T x={4} y={280} size={12}>
          kind: <tspan className="mono" fontWeight={700}>{full(cur)}</tspan>
        </T>
      </Svg>
    </StepFrame>
  );
}
