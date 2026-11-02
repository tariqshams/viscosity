// Chapter 141: drip-rs's struct-of-arrays hash table, 8 slots, with a
// tombstone. The keys really collide: FNV-1a (object.rs hash_string)
// gives y, a, len and key all `hash & 7 == 4`. Each step follows
// table.rs: find() probes from hash & mask, returns the first tombstone
// passed if the key is absent, and set() only bumps count for a slot
// that was truly empty. An empty slot is (None, Value::None), shown
// as None over none; a tombstone is (None, Value::Bool(true)).
import { StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

type Slot = { k: string | null; v: string };
type S = { op: string; slots: Slot[]; probe: number[]; hit: number | null; count: number; note: string };

const E: Slot = { k: null, v: 'none' };
const row = (m: Record<number, Slot>): Slot[] => Array.from({ length: 8 }, (_, i) => m[i] ?? E);

const STATES: S[] = [
  { op: 'set(y, 1)', slots: row({ 4: { k: 'y', v: '1' } }), probe: [4], hit: 4, count: 1, note: 'The first set grows the table to 8 slots. y’s hash & 7 is 4, slot 4 is empty, so y goes there. keys[4] = Some(y), values[4] = 1.' },
  { op: 'set(a, 2)  set(len, 3)', slots: row({ 4: { k: 'y', v: '1' }, 5: { k: 'a', v: '2' }, 6: { k: 'len', v: '3' } }), probe: [4, 5, 6], hit: 6, count: 3, note: 'a and len also start at 4. Linear probing steps (index + 1) & mask until it finds an empty slot: a lands in 5, len in 6.' },
  { op: 'delete(a)', slots: row({ 4: { k: 'y', v: '1' }, 5: { k: null, v: 'true' }, 6: { k: 'len', v: '3' } }), probe: [4, 5], hit: 5, count: 3, note: 'Deleting a leaves a tombstone: key None, value Bool(true). If slot 5 became truly empty, a later probe for len would stop there and miss it. count stays 3: tombstones still count.' },
  { op: 'get(len)', slots: row({ 4: { k: 'y', v: '1' }, 5: { k: null, v: 'true' }, 6: { k: 'len', v: '3' } }), probe: [4, 5, 6], hit: 6, count: 3, note: 'Slot 4 is y, not len. Slot 5 is None but its value isn’t Value::None, so it is a tombstone: keep going. Slot 6 holds len. Keys compare by handle, so no characters are read.' },
  { op: 'set(key, 4)', slots: row({ 4: { k: 'y', v: '1' }, 5: { k: 'key', v: '4' }, 6: { k: 'len', v: '3' } }), probe: [4, 5, 6, 7], hit: 5, count: 3, note: 'find walks 4, 5 (first tombstone: remembered), 6, then 7, which is empty, so key is absent. It returns the tombstone, 5. The slot was already counted, so count stays 3.' },
];

const X0 = 12;
const W = 46;
const sx = (i: number) => X0 + i * W;

export default function TableSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="Probing a two-column table" steps={s} note={st.note}>
      <Svg w={400} h={200} title="Eight slots in two columns, keys above values, with the probe sequence marked">
        <T x={X0} y={14} size={12} mono weight={700}>{st.op}</T>
        <T x={388} y={14} size={11} mono anchor="end" fill={tok('muted')}>count = {st.count}</T>
        {st.slots.map((slot, i) => {
          const probed = st.probe.includes(i);
          const hit = st.hit === i;
          const tomb = slot.k === null && slot.v === 'true';
          const stroke = hit ? tok('brand') : probed ? tok('accent') : tok('line');
          return (
            <g key={i}>
              <T x={sx(i) + W / 2 - 2} y={38} size={11} mono anchor="middle" fill={tok('muted')}>{i}</T>
              <Box x={sx(i)} y={48} w={W - 4} h={38} r={3} fill={hit ? tok('brand', 0.16) : tok('panel')} stroke={stroke}>
                <T x={sx(i) + W / 2 - 2} y={67} size={11} mono anchor="middle" fill={slot.k ? tok('ink') : tok('muted')}>{slot.k ?? 'None'}</T>
              </Box>
              <Box x={sx(i)} y={92} w={W - 4} h={38} r={3} fill={tomb ? tok('danger', 0.12) : tok('panel')} stroke={stroke} dash={tomb}>
                <T x={sx(i) + W / 2 - 2} y={111} size={11} mono anchor="middle" fill={tomb ? tok('danger') : slot.v === 'none' ? tok('muted') : tok('ink')}>{slot.v}</T>
              </Box>
              {probed && (
                <T x={sx(i) + W / 2 - 2} y={144} size={11} mono anchor="middle" fill={hit ? tok('brand') : tok('accent')}>
                  {hit ? '▲' : '·'}
                </T>
              )}
            </g>
          );
        })}
        <T x={X0} y={168} size={11} mono fill={tok('muted')}>keys:   Vec&lt;Option&lt;StrRef&gt;&gt;  (top row)</T>
        <T x={X0} y={184} size={11} mono fill={tok('muted')}>values: Vec&lt;Value&gt; (none = empty; dashed = tombstone)</T>
      </Svg>
    </StepFrame>
  );
}
