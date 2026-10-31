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
const [k3, v3] = put(k2, v2, 3, 'vx', '1');
const [k4, v4] = put(k3, v3, 0, 'vy', '2');
const [k5, v5] = put(k4, v4, 1, 'mass', '5');
const [k6, v6] = put(k5, v5, 2, 'health', '100');
const [k8, v8] = put(k6, v6, 1, null, TOMB);
const [k10, v10] = put(k8, v8, 1, 'mass', '6');

const STATES: S[] = [
  { op: 'an empty table, capacity 8', keys: k0, vals: v0, path: [], count: 0, note: 'Two parallel arrays: keys on top, values below. Slot i of one belongs with slot i of the other. A slot with no key and no value is truly empty.' },
  { op: 'set("x", 10)', keys: k1, vals: v1, path: [7], hit: 7, count: 1, note: 'hash("x") is 4245442695. With 8 slots the table keeps the low 3 bits: 4245442695 & 7 = 7. Slot 7 is empty, so x goes there.' },
  { op: 'set("y", 20)', keys: k2, vals: v2, path: [4], hit: 4, count: 2, note: 'hash("y") & 7 = 4. Empty: done. Notice how unrelated the slot is to the name; that’s the hash doing its job.' },
  { op: 'set("vx", 1), set("vy", 2)', keys: k4, vals: v4, path: [3, 0], count: 4, note: 'vx lands in slot 3, vy in slot 0. No two keys have wanted the same slot yet.' },
  { op: 'set("mass", 5)', keys: k5, vals: v5, path: [1], hit: 1, count: 5, note: 'mass goes to slot 1. Five of eight slots used.' },
  { op: 'set("health", 100)', keys: k6, vals: v6, path: [7, 0, 1, 2], hit: 2, count: 6, note: 'A collision: hash("health") & 7 = 7, and x is there. Linear probing tries the next slot, wrapping from 7 back to 0: vy, then mass, then slot 2, which is empty. Four probes.' },
  { op: 'get("health")', keys: k6, vals: v6, path: [7, 0, 1, 2], hit: 2, count: 6, note: 'A lookup retraces the same path: start at 7 and step until the key matches. Had it reached a truly empty slot first, health would not be in the table.' },
  { op: 'delete("mass")', keys: k8, vals: v8, path: [1], hit: 1, count: 6, note: 'Deleting can’t just empty slot 1. It leaves a tombstone: no key, but a value that marks “something was here” (the companion uses true). count stays 6.' },
  { op: 'get("health") again', keys: k8, vals: v8, path: [7, 0, 1, 2], hit: 2, count: 6, note: 'The probe passes slot 1 because the tombstone says “keep going”, and finds health in slot 2. With a plain empty slot there, the search would stop at 1 and wrongly report health missing.' },
  { op: 'set("mass", 6)', keys: k10, vals: v10, path: [1, 2, 3, 4, 5], hit: 1, count: 6, note: 'Inserting remembers the first tombstone (slot 1) but keeps probing, to be sure mass isn’t further along. At empty slot 5 it knows: mass is new, so it reuses slot 1.' },
  { op: 'set("name", …)', keys: k10, vals: v10, path: [], count: 6, note: 'count is 6, and 7 would pass 8 × 0.75 = 6, the load limit. So before inserting, the table grows to 16 slots and re-inserts every key with & 15. Tombstones are left behind.' },
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
        <T x={2} y={58} size={9} weight={700} fill={tok('muted')}>slot</T>
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
                <T x={x + W / 2 - 2} y={85} size={k && k.length > 4 ? 10 : 12} mono anchor="middle" weight={700}>{k ?? ''}</T>
              </Box>
              <Box x={x} y={106} w={W - 4} h={30} r={3} fill={isTomb ? tok('ink', 0.08) : tok('panel')} stroke={isHit ? tok('brand') : onPath ? tok('accent') : tok('line')} dash={isTomb}>
                <T x={x + W / 2 - 2} y={121} size={12} mono anchor="middle" fill={isTomb ? tok('muted') : tok('ink')}>{v ?? ''}</T>
              </Box>
              {onPath && <T x={x + W / 2 - 2} y={150} size={11} mono anchor="middle" fill={isHit ? tok('brand') : tok('accent')}>{st.path.indexOf(i) + 1}</T>}
            </g>
          );
        })}
        <T x={2} y={85} size={9} fill={tok('muted')}>keys</T>
        <T x={2} y={121} size={9} fill={tok('muted')}>vals</T>
        {st.path.length > 0 && <T x={x0} y={172} size={11} fill={tok('muted')}>numbers under the slots: probe order (orange = where it ends)</T>}
        <T x={x0} y={190} size={11} fill={tok('muted')}>† tombstone: no key, value true</T>
      </Svg>
    </StepFrame>
  );
}
