import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// One typed column growing by doubling. The diagram starts at capacity 4 to
// stay small (Viscosity's container starts at 16); the code is the real
// push/grow from emit.ts, cut down to one column.
const CODE = `push(v) {
  const n = this.length;
  if (n === this.cap) this.grow();
  this.a[n] = v;
  return (this.length = n + 1);
}
grow() {
  const cap = (this.cap *= 2);
  const t = new Float64Array(cap);
  t.set(this.a); this.a = t;
}`;

type S = {
  line: number | null;
  len: number;
  cap: number;
  old?: number; // capacity of the old column while copying
  copies: number;
  pushes: number;
  peek?: boolean;
  note: string;
};

const STATES: S[] = [
  { line: null, len: 0, cap: 4, copies: 0, pushes: 0, note: 'A new container: capacity 4, length 0. The Float64Array already has 4 slots, all zero. Capacity is how many slots exist; length is how many are in use.' },
  { line: 3, len: 3, cap: 4, copies: 0, pushes: 3, note: 'Three pushes. Each one writes into the next free slot and bumps the length. No allocation, no copying: this is the cheap, common case.' },
  { line: 4, len: 4, cap: 4, copies: 0, pushes: 4, note: 'The fourth push fills the last slot. Length equals capacity now, but nothing happens yet: the check runs at the start of the next push.' },
  { line: 9, len: 4, cap: 8, old: 4, copies: 4, pushes: 4, note: 'Push number 5 finds n === cap, so it calls grow(). A Float64Array can’t get longer, so grow() makes a new one twice the size and copies the 4 old values across with set().' },
  { line: 3, len: 5, cap: 8, copies: 4, pushes: 5, note: 'Then the push carries on as usual: write slot 4, length 5. The old array is garbage now. Three slots are spare, waiting for the next pushes.' },
  { line: 4, len: 8, cap: 8, copies: 4, pushes: 8, note: 'Three more cheap pushes fill it again. Notice how long it took: as many pushes as we copied last time.' },
  { line: 9, len: 8, cap: 16, old: 8, copies: 12, pushes: 8, note: 'Push number 9 grows again: a new array of 16, and 8 values copied. Each grow copies more, but it also buys twice as much room, so grows get rarer.' },
  { line: 4, len: 9, cap: 16, copies: 12, pushes: 9, note: '9 pushes, 12 copies so far. The total number of copies is always less than the capacity (4 + 8 < 16), so on average every push costs a small constant amount of copying.' },
  { line: null, len: 9, cap: 16, copies: 12, pushes: 9, peek: true, note: 'The spare slots hold zeros. Reading a[12] wouldn’t fail: it would quietly return 0, where the original array gave undefined. That is why every check compares an index with length, never with the column’s size.' },
];

const SW = 22;
const X0 = 24;
const VAL = (k: number) => (k + 1) * 10;

function Column({ y, cap, len, label, faded, peek }: { y: number; cap: number; len: number; label: string; faded?: boolean; peek?: boolean }) {
  return (
    <g opacity={faded ? 0.45 : 1}>
      <T x={X0} y={y - 10} size={11} mono fill={tok('muted')}>{label}</T>
      {Array.from({ length: cap }, (_, k) => {
        const used = k < len;
        const hit = peek && k === 12;
        return (
          <g key={k}>
            <rect x={X0 + k * SW} y={y} width={SW - 2} height={26} rx={3}
              fill={used ? tok('f1', 0.85) : hit ? tok('danger', 0.15) : 'transparent'}
              stroke={hit ? tok('danger') : used ? tok('f1') : tok('line')} strokeWidth={1.2}
              strokeDasharray={used ? undefined : '3 3'} />
            <T x={X0 + k * SW + SW / 2 - 1} y={y + 13} size={9} mono anchor="middle" fill={used ? tok('paper') : tok('muted')}>{used ? VAL(k) : 0}</T>
          </g>
        );
      })}
    </g>
  );
}

export default function CapacitySteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const copying = st.old !== undefined;
  return (
    <StepFrame title="Capacity, length and doubling" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={200} title="A column's slots: used ones filled, spare ones dashed; growing copies the old slots into a twice-as-big array">
        {copying ? (
          <>
            <Column y={30} cap={st.old!} len={st.old!} label={`old a: cap ${st.old}`} faded />
            {Array.from({ length: st.old! }, (_, k) => (
              <Arrow key={k} x1={X0 + k * SW + 10} y1={58} x2={X0 + k * SW + 10} y2={92} color={tok('brand', 0.8)} width={1.5} />
            ))}
            <Column y={96} cap={st.cap} len={st.len} label={`new a: cap ${st.cap}`} />
          </>
        ) : (
          <Column y={64} cap={st.cap} len={st.len} label={`a: cap ${st.cap}`} peek={st.peek} />
        )}
        {st.peek && <T x={X0 + 12 * SW + 10} y={104} size={11} mono anchor="middle" fill={tok('danger')}>a[12] → 0</T>}
        <Box x={8} y={140} w={384} h={50} fill={tok('panel')}>
          <T x={20} y={156} size={12} mono>length {st.len}</T>
          <T x={130} y={156} size={12} mono>capacity {st.cap}</T>
          <T x={20} y={178} size={12} mono>pushes {st.pushes}</T>
          <T x={130} y={178} size={12} mono fill={copying ? tok('brand') : undefined} weight={copying ? 700 : undefined}>copies {st.copies}</T>
          <T x={380} y={167} size={11} anchor="end" fill={tok('muted')}>{st.len === st.cap ? 'full' : `${st.cap - st.len} spare`}</T>
        </Box>
      </Svg>
    </StepFrame>
  );
}
