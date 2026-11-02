// Chapter 92: constant folding, one instruction at a time, on the real
// VIR loop header that Viscosity prints for `i < 2 * 50`. A folder keeps a
// table of known constants; an instruction folds only when every operand
// is in it.
import { StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

const ROWS = [
  { id: '%3', text: '%3 = phi %2, %14' },
  { id: '%4', text: '%4 = const 2' },
  { id: '%5', text: '%5 = const 50' },
  { id: '%6', text: '%6 = binop * %4, %5', folded: '%6 = const 100' },
  { id: '%7', text: '%7 = binop < %3, %6' },
  { id: 'br', text: 'condbr %7, b2, b4' },
];

type S = { at: number; known: Record<string, string>; folded: boolean; note: string };

const STATES: S[] = [
  { at: -1, known: {}, folded: false, note: 'The loop header b1, exactly as Viscosity prints it. The folder walks down the block, keeping a table of the values it knows to be constants. The table starts empty.' },
  { at: 0, known: {}, folded: false, note: '%3 is a phi: 0 on the way in, and %14 (i + 1) each time round. It is not a constant, so it does not go in the table.' },
  { at: 1, known: { '%4': '2' }, folded: false, note: '%4 is a const, so the table now says %4 = 2.' },
  { at: 2, known: { '%4': '2', '%5': '50' }, folded: false, note: '%5 is a const too: %5 = 50.' },
  { at: 3, known: { '%4': '2', '%5': '50' }, folded: false, note: '%6 multiplies %4 by %5. Both are in the table, and * on two numbers has no side effects and cannot throw. So it may be folded.' },
  { at: 3, known: { '%4': '2', '%5': '50', '%6': '100' }, folded: true, note: 'Fold: 2 * 50 is 100, so %6 becomes const 100, and the table gains %6 = 100. Anything that uses %6 now uses a constant.' },
  { at: 4, known: { '%4': '2', '%5': '50', '%6': '100' }, folded: true, note: '%7 compares %3 with %6. %6 is known, but %3 is not, so %7 cannot be folded. One unknown operand is enough to stop it.' },
  { at: 5, known: { '%4': '2', '%5': '50', '%6': '100' }, folded: true, note: 'The branch tests %7, which is not a constant, so it stays. One instruction changed, and the loop now compares i with 100 directly, which is the form Viscosity’s size estimate can read.' },
];

export default function FoldSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const RH = 30;
  const keys = Object.keys(st.known);
  return (
    <StepFrame title="Folding a block, top to bottom" steps={s} note={st.note}>
      <Svg w={400} h={ROWS.length * RH + 70} title="The instructions of block b1, with the folder's table of known constants underneath">
        <T x={10} y={12} size={11} weight={700} fill={tok('muted')}>BLOCK b1</T>
        <T x={300} y={12} size={11} weight={700} fill={tok('muted')}>KNOWN?</T>
        {ROWS.map((r, k) => {
          const y = 24 + k * RH;
          const hot = st.at === k;
          const isFolded = st.folded && !!r.folded;
          const val = st.known[r.id];
          return (
            <g key={r.id}>
              <Box x={10} y={y} w={272} h={RH - 6} r={4}
                fill={isFolded ? tok('safe', 0.14) : hot ? tok('brand', 0.08) : tok('panel')}
                stroke={hot ? tok('brand') : isFolded ? tok('safe') : tok('line')}>
                <T x={20} y={y + (RH - 6) / 2} size={13} mono>{isFolded ? r.folded : r.text}</T>
              </Box>
              <T x={300} y={y + (RH - 6) / 2} size={12} mono weight={val ? 700 : 400}
                fill={val ? tok('safe') : tok('muted')}>
                {k <= st.at ? (val ?? (r.id === 'br' ? '' : 'no')) : ''}
              </T>
            </g>
          );
        })}
        <T x={10} y={ROWS.length * RH + 44} size={12} weight={700} fill={tok('muted')}>TABLE</T>
        <T x={60} y={ROWS.length * RH + 44} size={13} mono>
          {keys.length ? keys.map((k) => `${k}=${st.known[k]}`).join('  ') : '(empty)'}
        </T>
      </Svg>
    </StepFrame>
  );
}
