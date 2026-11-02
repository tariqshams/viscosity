// Chapter 205-b (staged split of 189): dominator-based value numbering on a
// diamond. The walk visits the dominator tree depth first; each block opens
// a scope in the table, and leaving the block closes it.
import { StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

const BLOCKS = [
  { name: 'b0', rows: ['%2 = binop * %0, %1'] },
  { name: 'b1', rows: ['%4 = binop * %0, %1', '%5 = binop + %0, %1'] },
  { name: 'b2', rows: ['%6 = binop + %0, %1'] },
  { name: 'b3', rows: ['%7 = phi %4, %2', '%8 = phi %5, %6', '%9 = binop * %1, %0', '%10 = binop + %0, %1'] },
];

type S = { hot: number | null; row: number | null; scopes: string[][]; marks: Record<string, string>; note: string };
const STATES: S[] = [
  { hot: null, row: null, scopes: [], marks: {}, note: 'The dominator tree is b0 with three children: b1, b2 and b3. The walk visits b0, then each child in turn, and the table keeps one scope per block on the current path of the walk.' },
  { hot: 0, row: 0, scopes: [['* 0 1 → %2']], marks: { '0-0': 'new' }, note: 'Enter b0: open its scope. %2 = a * b has key (*, 0, 1), not in the table: a new value, entered in b0’s scope.' },
  { hot: 1, row: 0, scopes: [['* 0 1 → %2'], []], marks: { '0-0': 'new', '1-0': '= %2' }, note: 'Enter b1, a child of b0: open a scope on top. %4 = a * b finds (*, 0, 1) in b0’s scope. b0 dominates b1, so %2 has certainly been computed: %4 is %2.' },
  { hot: 1, row: 1, scopes: [['* 0 1 → %2'], ['+ 0 1 → %5']], marks: { '0-0': 'new', '1-0': '= %2', '1-1': 'new' }, note: '%5 = a + b is new, and goes in b1’s own scope.' },
  { hot: 2, row: 0, scopes: [['* 0 1 → %2'], ['+ 0 1 → %6']], marks: { '0-0': 'new', '1-0': '= %2', '1-1': 'new', '2-0': 'new' }, note: 'Leave b1: its scope, and %5 with it, is thrown away. Enter b2. %6 = a + b is NOT found: on the path through b2, b1 never ran. A new value, in b2’s scope.' },
  { hot: 3, row: 0, scopes: [['* 0 1 → %2'], []], marks: { '0-0': 'new', '1-0': '= %2', '1-1': 'new', '2-0': 'new', '3-0': '= %2' }, note: 'Leave b2, enter b3. %7 = phi %4, %2. %4 is known to be %2, so this is phi %2, %2: the same value on both edges. No choice at all: %7 is %2.' },
  { hot: 3, row: 1, scopes: [['* 0 1 → %2'], ['phi 5 6 → %8']], marks: { '0-0': 'new', '1-0': '= %2', '1-1': 'new', '2-0': 'new', '3-0': '= %2', '3-1': 'new' }, note: '%8 = phi %5, %6 has two different operands, so it is a real choice: a new value.' },
  { hot: 3, row: 2, scopes: [['* 0 1 → %2'], ['phi 5 6 → %8']], marks: { '0-0': 'new', '1-0': '= %2', '1-1': 'new', '2-0': 'new', '3-0': '= %2', '3-1': 'new', '3-2': '= %2' }, note: '%9 = b * a: sorted, the key is (*, 0, 1), still in b0’s scope because b0 dominates b3. %9 is %2.' },
  { hot: 3, row: 3, scopes: [['* 0 1 → %2'], ['phi 5 6 → %8', '+ 0 1 → %10']], marks: { '0-0': 'new', '1-0': '= %2', '1-1': 'new', '2-0': 'new', '3-0': '= %2', '3-1': 'new', '3-2': '= %2', '3-3': 'new' }, note: '%10 = a + b is not found: it was computed on both paths, but by two different instructions, neither of which dominates b3. That case belongs to partial redundancy elimination, next chapter.' },
];

const POS = [
  { x: 6, y: 4, w: 200 },
  { x: 6, y: 52, w: 200 },
  { x: 6, y: 116, w: 200 },
  { x: 6, y: 164, w: 200 },
];
const LH = 16;

export default function GvnSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="Value numbering down the dominator tree" steps={s} note={st.note}>
      <Svg w={400} h={262} title="Four blocks with their instructions and the result of numbering each; on the right, the stack of table scopes.">
        {BLOCKS.map((b, k) => {
          const p = POS[k];
          const hot = st.hot === k;
          return (
            <Box key={k} x={p.x} y={p.y} w={p.w} h={18 + b.rows.length * LH} fill={hot ? tok('brand', 0.08) : tok('panel')} stroke={hot ? tok('brand') : tok('line')}>
              <T x={p.x + 6} y={p.y + 9} size={10} weight={700} fill={tok('muted')}>{b.name}</T>
              {b.rows.map((r, j) => {
                const m = st.marks[`${k}-${j}`];
                const y = p.y + 22 + j * LH;
                return (
                  <g key={j}>
                    <T x={p.x + 26} y={y} size={11} mono weight={hot && st.row === j ? 700 : 400}>{r}</T>
                    {m && <T x={p.x + p.w + 6} y={y} size={11} mono weight={700} fill={m === 'new' ? tok('muted') : tok('accent')}>{m}</T>}
                  </g>
                );
              })}
            </Box>
          );
        })}
        <T x={270} y={12} size={11} weight={700} fill={tok('muted')}>TABLE SCOPES</T>
        {st.scopes.map((sc, k) => (
          <Box key={k} x={262} y={24 + k * 66} w={134} h={58} fill={k === st.scopes.length - 1 ? tok('brand', 0.08) : tok('panel')} stroke={tok('line')}>
            <T x={270} y={34 + k * 66} size={10} weight={700} fill={tok('muted')}>{k === 0 ? 'b0' : `b${st.hot}`}</T>
            {sc.map((e, j) => <T key={j} x={270} y={50 + k * 66 + j * 15} size={11} mono>{e}</T>)}
          </Box>
        ))}
      </Svg>
    </StepFrame>
  );
}
