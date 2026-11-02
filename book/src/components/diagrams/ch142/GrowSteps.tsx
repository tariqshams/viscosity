import { StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

// A list that manages its own room, as a VM written in C or Rust has to:
// a block of `cap` slots, of which the first `len` are in use. When a push
// finds the block full, a block twice the size is made and every element
// is copied across. (The companion VM leaves this to JavaScript's arrays.)

type S = { cap: number; vals: string[]; copied: number; total: number; moving?: boolean; note: string };

const STATES: S[] = [
  { cap: 2, vals: [], copied: 0, total: 0, note: 'An empty list with room for 2. Its length is 0 and its capacity is 2: the capacity is how many slots it has, the length how many are used.' },
  { cap: 2, vals: ['a'], copied: 0, total: 0, note: 'push a: there is room, so a goes into slot 0 and the length becomes 1. No copying.' },
  { cap: 2, vals: ['a', 'b'], copied: 0, total: 0, note: 'push b: slot 1. The list is now full: length 2, capacity 2.' },
  { cap: 4, vals: ['a', 'b'], copied: 2, total: 2, moving: true, note: 'push c finds no room. A new block of twice the size, 4 slots, is made, and the 2 old elements are copied into it, one by one. The old block is thrown away.' },
  { cap: 4, vals: ['a', 'b', 'c'], copied: 0, total: 2, note: 'Now c goes into slot 2. That push cost 2 copies plus 1 store; the next one will be cheap.' },
  { cap: 4, vals: ['a', 'b', 'c', 'd'], copied: 0, total: 2, note: 'push d: slot 3, no copying. Full again.' },
  { cap: 8, vals: ['a', 'b', 'c', 'd', 'e'], copied: 4, total: 6, moving: true, note: 'push e: grow to 8, copying 4, then store e. Five pushes have cost 6 copies in all, and the next three pushes cost none.' },
  { cap: 8, vals: ['a', 'b', 'c', 'd', 'e'], copied: 0, total: 6, note: 'Each time the block doubles, the copying doubles too, but so does the number of cheap pushes before the next growth; on average a push costs a small, fixed amount, however long the list gets.' },
];

export default function GrowSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const w = 44;
  return (
    <StepFrame title="Growing by doubling" steps={s} note={st.note}>
      <Svg w={400} h={130} title="A block of slots: the used ones filled, the spare ones dashed, with the length, capacity and number of copies so far">
        <T x={10} y={14} size={12} mono>length {st.vals.length} · capacity {st.cap}</T>
        <T x={390} y={14} size={12} mono anchor="end">copies so far: {st.total}</T>
        {Array.from({ length: st.cap }, (_, k) => {
          const x = 10 + k * (w + 4);
          const v = st.vals[k];
          const was = st.moving && k < st.copied;
          return (
            <g key={`${st.cap}-${k}`}>
              <Box x={x} y={30} w={w} h={40} r={4} fill={v ? (was ? tok('warn', 0.2) : tok('brand', 0.15)) : tok('panel')} stroke={v ? tok('brand') : tok('line')} dash={!v}>
                <T x={x + w / 2} y={50} size={15} mono anchor="middle">{v ?? ''}</T>
              </Box>
              <T x={x + w / 2} y={82} size={11} mono anchor="middle" fill={tok('muted')}>{k}</T>
            </g>
          );
        })}
        {st.moving && <T x={10} y={108} size={12} fill={tok('warn')}>{`grew: ${st.copied} elements copied into a block of ${st.cap}`}</T>}
        <T x={10} y={124} size={11} fill={tok('muted')}>dashed: spare room, allocated but not yet used</T>
      </Svg>
    </StepFrame>
  );
}
