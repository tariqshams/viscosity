// Chapter 211: local value numbering down one block. Each instruction's key
// is its operation plus its operands' value numbers (sorted for + and *);
// a key already in the table means the instruction is redundant.
import { StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

const ROWS = [
  { id: 0, text: '%0 = param a' },
  { id: 1, text: '%1 = param b' },
  { id: 2, text: '%2 = binop * %0, %1' },
  { id: 3, text: '%3 = binop * %1, %0' },
  { id: 4, text: '%4 = const 2' },
  { id: 5, text: '%5 = binop + %2, %4' },
  { id: 6, text: '%6 = binop + %3, %4' },
];

type S = { at: number; vn: (number | null)[]; table: string[]; key: string; hit?: boolean; note: string };
const N = [null, null, null, null, null, null, null];
const STATES: S[] = [
  { at: -1, vn: N, table: [], key: '', note: 'One block, and an empty table. Each instruction will get a value number (VN); here a new value simply takes its own id as its number.' },
  { at: 1, vn: [0, 1, null, null, null, null, null], table: [], key: '', note: 'The two parameters are unknown values, each different from everything else: VN 0 and VN 1. They have no key, because nothing else can be "the same parameter".' },
  { at: 2, vn: [0, 1, 2, null, null, null, null], table: ['* 0 1 → 2'], key: '* 0 1', note: '%2 multiplies VN 0 by VN 1. The key (*, 0, 1) is not in the table, so %2 is a new value, VN 2, and the table records it.' },
  { at: 3, vn: [0, 1, 2, 2, null, null, null], table: ['* 0 1 → 2'], key: '* 0 1', hit: true, note: '%3 multiplies VN 1 by VN 0. * does not care about order, so the numbers are sorted: (*, 0, 1). That key is in the table: %3 is VN 2, the same value as %2. It is redundant.' },
  { at: 4, vn: [0, 1, 2, 2, 4, null, null], table: ['* 0 1 → 2', 'const 2 → 4'], key: 'const 2', note: '%4 is the constant 2: key (const, 2), new, VN 4.' },
  { at: 5, vn: [0, 1, 2, 2, 4, 5, null], table: ['* 0 1 → 2', 'const 2 → 4', '+ 2 4 → 5'], key: '+ 2 4', note: '%5 adds VN 2 and VN 4: key (+, 2, 4), new, VN 5.' },
  { at: 6, vn: [0, 1, 2, 2, 4, 5, 5], table: ['* 0 1 → 2', 'const 2 → 4', '+ 2 4 → 5'], key: '+ 2 4', hit: true, note: '%6 adds %3 and %4. It looks different from %5, but the key uses value numbers, and %3 is VN 2: (+, 2, 4). Found: %6 is VN 5. Redundancy in a chain, which a search for identical text would miss.' },
  { at: -1, vn: [0, 1, 2, 2, 4, 5, 5], table: ['* 0 1 → 2', 'const 2 → 4', '+ 2 4 → 5'], key: '', note: 'CSE: %3 and %6 compute values the block already has. Point their uses at %2 and %5, and DCE deletes them. Seven instructions became five.' },
];

export default function LvnSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const RH = 26;
  const done = s.atEnd;
  return (
    <StepFrame title="Numbering a block" steps={s} note={st.note}>
      <Svg w={400} h={ROWS.length * RH + 104} title="A block of seven instructions with each one's value number, and the value-numbering table below.">
        <T x={10} y={10} size={11} weight={700} fill={tok('muted')}>INSTRUCTION</T>
        <T x={330} y={10} size={11} weight={700} fill={tok('muted')}>VN</T>
        {ROWS.map((r, k) => {
          const y = 20 + k * RH;
          const hot = st.at === k;
          const v = st.vn[k];
          const redundant = v !== null && v !== r.id;
          return (
            <g key={k} opacity={done && redundant ? 0.4 : 1}>
              <Box x={10} y={y} w={300} h={RH - 5} r={4}
                fill={redundant ? tok('accent', 0.12) : hot ? tok('brand', 0.08) : tok('panel')}
                stroke={hot ? tok('brand') : redundant ? tok('accent') : tok('line')}>
                <T x={20} y={y + (RH - 5) / 2} size={12.5} mono>{r.text}</T>
              </Box>
              {done && redundant && <line x1={16} y1={y + 10} x2={300} y2={y + 10} stroke={tok('danger')} strokeWidth={1.5} />}
              <T x={330} y={y + (RH - 5) / 2} size={12.5} mono weight={700} fill={redundant ? tok('accent') : tok('ink')}>
                {v === null ? '' : `${v}${redundant ? ' (=)' : ''}`}
              </T>
            </g>
          );
        })}
        <T x={10} y={ROWS.length * RH + 34} size={11} weight={700} fill={tok('muted')}>
          {st.key ? `KEY  (${st.key.split(' ').join(', ')})  ${st.hit ? 'found' : 'new'}` : 'KEY'}
        </T>
        <T x={10} y={ROWS.length * RH + 56} size={11} weight={700} fill={tok('muted')}>TABLE</T>
        {st.table.map((t, k) => (
          <T key={k} x={66 + (k % 2) * 160} y={ROWS.length * RH + 56 + Math.floor(k / 2) * 18} size={12} mono>{t}</T>
        ))}
      </Svg>
    </StepFrame>
  );
}
