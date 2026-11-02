import { StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

// An 8-slot table as two parallel arrays, like vm/table.ts. The slots are
// real: FNV-1a hash of each name (the companion's hashString), & 7.
type K = string | null;
const FIELD: Record<string, string> = { x: 'f1', y: 'f2', vx: 'f3', vy: 'f4', mass: 'f5', health: 'f6' };
const PUTS: [string, string, number][] = [['x', '10', 7], ['y', '20', 4], ['vx', '1', 3], ['vy', '2', 0], ['mass', '5', 1]];

const fill = (n: number): [K[], K[]] => {
  const ks: K[] = Array(8).fill(null);
  const vs: K[] = Array(8).fill(null);
  for (const [k, v, i] of PUTS.slice(0, n)) { ks[i] = k; vs[i] = v; }
  return [ks, vs];
};

type S = { op: string; n: number; look?: number; bad?: boolean; hash?: string; note: string };

const STATES: S[] = [
  { op: 'an empty table', n: 0, note: 'Two arrays of 8, side by side: keys on top, values below. Slot i of one belongs with slot i of the other. Every slot starts empty.' },
  { op: 'set("x", 10)', n: 1, look: 7, hash: 'hash 4245442695 & 7 = 7', note: 'Hash the key, keep the low 3 bits: slot 7. It is empty, so the key goes in keys[7] and the value in values[7]. No searching at all.' },
  { op: 'set("y", 20)', n: 2, look: 4, hash: 'hash 4228665076 & 7 = 4', note: 'y lands in slot 4. Notice that the slot has nothing to do with the order of the names, or with the alphabet: the hash scatters them.' },
  { op: 'set vx, vy and mass', n: 5, hash: 'slots 3, 0 and 1', note: 'vx goes to slot 3, vy to 0 and mass to 1. Five keys, five different slots: so far, every key has had its slot to itself.' },
  { op: 'get("vx")', n: 5, look: 3, hash: 'hash 1296684707 & 7 = 3', note: 'A lookup does the same sum: hash "vx", keep 3 bits, look in slot 3. The key there is vx, so the answer is values[3], which is 1. One look, however many keys the table holds.' },
  { op: 'get("z")', n: 5, look: 5, hash: 'hash 4278997933 & 7 = 5', note: 'z would live in slot 5, and slot 5 is empty. So z is not in the table, and the lookup can say so after one look, without checking the other keys.' },
  { op: 'set("health", 100)', n: 5, look: 7, bad: true, hash: 'hash 1805184399 & 7 = 7', note: 'health also wants slot 7, and x is already there. Two keys, one slot: a collision. The table needs a rule for this: open addressing.' },
];

export default function PlaceSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const [keys, vals] = fill(st.n);
  const W = 46;
  return (
    <StepFrame title="Keys find their own slots" steps={s} note={st.note}>
      <Svg w={400} h={170} title="An 8-slot hash table as two parallel arrays, keys and values; the slot being looked at is outlined">
        <T x={8} y={14} size={14} mono weight={700}>{st.op}</T>
        <T x={8} y={34} size={12} mono fill={tok('muted')}>{st.hash ?? ''}</T>
        {keys.map((k, i) => {
          const x = 30 + i * W;
          const on = st.look === i;
          const edge = on ? (st.bad ? tok('danger') : tok('brand')) : tok('line');
          return (
            <g key={i}>
              <T x={x + W / 2 - 2} y={56} size={11} mono anchor="middle" fill={tok('muted')}>{i}</T>
              <Box x={x} y={66} w={W - 4} h={34} r={3} fill={k ? tok(FIELD[k], 0.2) : tok('panel')} stroke={edge}>
                <T x={x + W / 2 - 2} y={83} size={k && k.length > 3 ? 11 : 13} mono anchor="middle" weight={700}>{k ?? ''}</T>
              </Box>
              <Box x={x} y={104} w={W - 4} h={30} r={3} fill={tok('panel')} stroke={edge}>
                <T x={x + W / 2 - 2} y={119} size={13} mono anchor="middle">{vals[i] ?? ''}</T>
              </Box>
            </g>
          );
        })}
        <T x={26} y={83} size={11} anchor="end" fill={tok('muted')}>k</T>
        <T x={26} y={119} size={11} anchor="end" fill={tok('muted')}>v</T>
        <T x={8} y={156} size={11} fill={tok('muted')}>k: keys array · v: values · outlined: the slot</T>
      </Svg>
    </StepFrame>
  );
}
