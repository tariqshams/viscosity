import { StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

// An 8-slot table stored as two parallel arrays, like vm/table.ts. The
// starting slots are real: FNV-1a hash of each name, & 7.
type K = string | null;
type V = string | null;
const TOMB = '†';
const FIELD: Record<string, string> = { x: 'f1', y: 'f2', vx: 'f3', vy: 'f4', mass: 'f5', health: 'f6' };

type S = { op: string; keys: K[]; vals: V[]; path: number[]; hit?: number; count: number; note: string };

const E = (): [K[], V[]] => [Array(8).fill(null), Array(8).fill(null)];
const put = (ks: K[], vs: V[], i: number, k: K, v: V): [K[], V[]] => {
  const a = [...ks]; const b = [...vs]; a[i] = k; b[i] = v; return [a, b];
};

const [k0, v0] = E();
const [k1, v1] = put(k0, v0, 7, 'x', '10');
const [k2, v2] = put(k1, v1, 4, 'y', '20');
const [k3, v3] = put(k2, v2, 0, 'vy', '2');
const [k4, v4] = put(k3, v3, 1, 'mass', '5');
const [k5, v5] = put(k4, v4, 2, 'health', '100');
const [k6, v6] = put(k5, v5, 1, null, TOMB);
const [k7, v7] = put(k6, v6, 1, 'mass', '6');
const [k8, v8] = put(k7, v7, 3, 'vx', '1');

// Checked against vm/table.ts by running this sequence through Table.
const STATES: S[] = [
  { op: 'an empty table, capacity 8', keys: k0, vals: v0, path: [], count: 0, note: 'Keys on top, values below; slot i of one belongs with slot i of the other. A slot with no key and no value is truly empty.' },
  { op: 'set("x", 10)', keys: k1, vals: v1, path: [7], hit: 7, count: 1, note: 'hash("x") & 7 is 7, and slot 7 is empty, so x goes there.' },
  { op: 'set("y"), set("vy"), set("mass")', keys: k4, vals: v4, path: [4, 0, 1], count: 4, note: 'y lands in slot 4, vy in 0 and mass in 1, each in its own slot.' },
  { op: 'set("health", 100)', keys: k5, vals: v5, path: [7, 0, 1, 2], hit: 2, count: 5, note: 'A collision: hash("health") & 7 is 7, and x is there. Linear probing tries the next slot, wrapping from 7 to 0: vy, then mass, then slot 2, which is empty. Four probes.' },
  { op: 'get("health")', keys: k5, vals: v5, path: [7, 0, 1, 2], hit: 2, count: 5, note: 'A lookup walks the same path: start at 7 and step until the key matches. Had it met a truly empty slot first, health would not be in the table.' },
  { op: 'delete("mass")', keys: k6, vals: v6, path: [1], hit: 1, count: 5, note: 'Deleting cannot simply empty slot 1. It leaves a tombstone: no key, but the value true, meaning “something was here”. count stays 5.' },
  { op: 'get("health") again', keys: k6, vals: v6, path: [7, 0, 1, 2], hit: 2, count: 5, note: 'The probe steps over slot 1, because a tombstone says “keep going”, and finds health in slot 2. Had slot 1 been emptied, the search would stop there and wrongly say health is missing.' },
  { op: 'set("mass", 6)', keys: k7, vals: v7, path: [1, 2, 3], hit: 1, count: 5, note: 'Inserting remembers the first tombstone (slot 1) but keeps probing, in case mass is further along. At empty slot 3 it knows mass is new, so it reuses slot 1. count stays 5: no empty slot was used up.' },
  { op: 'set("vx", 1)', keys: k8, vals: v8, path: [3], hit: 3, count: 6, note: 'vx takes slot 3. count is 6 of 8: a load of 0.75, the most the table allows.' },
  { op: 'set("name", 1)', keys: k8, vals: v8, path: [], count: 6, note: 'count + 1 would be 7, past 8 × 0.75 = 6. So before inserting, the table grows to 16 slots and re-inserts every key with & 15, dropping any tombstones; only then does name go in.' },
];

export default function ProbeSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const W = 46;
  const x0 = 12;
  return (
    <StepFrame title="Probing an 8-slot table" steps={s} note={st.note}>
      <Svg w={400} h={200} title="An 8-slot hash table as two parallel arrays, keys and values, with the probe path marked">
        <T x={x0} y={14} size={14} mono weight={700}>{st.op}</T>
        <T x={x0} y={34} size={11} fill={tok('muted')}>count {st.count} · load {st.count}/8</T>
        {st.keys.map((k, i) => {
          const x = 30 + i * W;
          const onPath = st.path.includes(i);
          const isHit = st.hit === i;
          const v = st.vals[i];
          const isTomb = k === null && v === TOMB;
          const c = k ? FIELD[k] : 'line';
          return (
            <g key={i}>
              <T x={x + W / 2 - 2} y={58} size={11} mono anchor="middle" fill={tok('muted')}>{i}</T>
              <Box x={x} y={68} w={W - 4} h={34} r={3} fill={k ? tok(c, 0.18) : tok('panel')} stroke={isHit ? tok('brand') : onPath ? tok('accent') : tok('line')}>
                <T x={x + W / 2 - 2} y={85} size={k && k.length > 4 ? 11 : 12} mono anchor="middle" weight={700}>{k ?? ''}</T>
              </Box>
              <Box x={x} y={106} w={W - 4} h={30} r={3} fill={isTomb ? tok('ink', 0.08) : tok('panel')} stroke={isHit ? tok('brand') : onPath ? tok('accent') : tok('line')} dash={isTomb}>
                <T x={x + W / 2 - 2} y={121} size={12} mono anchor="middle" fill={isTomb ? tok('muted') : tok('ink')}>{v ?? ''}</T>
              </Box>
              {onPath && <T x={x + W / 2 - 2} y={150} size={11} mono anchor="middle" fill={isHit ? tok('brand') : tok('accent')}>{st.path.indexOf(i) + 1}</T>}
            </g>
          );
        })}
        <T x={26} y={85} size={11} anchor="end" fill={tok('muted')}>k</T>
        <T x={26} y={121} size={11} anchor="end" fill={tok('muted')}>v</T>
        {st.path.length > 0 && <T x={x0} y={172} size={11} fill={tok('muted')}>numbers below: the probe order (last = where it ends)</T>}
        <T x={x0} y={190} size={11} fill={tok('muted')}>dashed † = tombstone (no key, value true)</T>
      </Svg>
    </StepFrame>
  );
}
