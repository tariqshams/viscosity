// Chapter 140: the VM's value stack as it really is: one array, made at
// full size (filled with null) when the VM starts, plus sp, the index of
// the next free slot (companion/ts/src/vm/vm.ts: stack, sp, push, pop,
// peek). Shown just after the three consts of  print 1 + 2 * 3;
import { Box, Svg, T, tok } from '../../viz/svg';

const SLOTS = ['script', '1', '2', '3', 'null', 'null', 'null'];
const SP = 4;
const W = 50;
const sx = (k: number) => 22 + k * (W + 2);

export default function StackArray() {
  return (
    <Svg w={400} h={170} title="The stack array: slot 0 holds the script, slots 1 to 3 hold 1, 2 and 3, and the slots from 4 on hold null and are free. sp is 4. peek(0) is slot 3, peek(1) is slot 2. push writes slot sp and adds 1 to sp; pop takes 1 from sp and reads that slot.">
      {SLOTS.map((v, k) => {
        const live = k < SP;
        return (
          <g key={k}>
            <T x={sx(k) + W / 2} y={18} size={11} mono anchor="middle" fill={tok('muted')}>{k}</T>
            <Box x={sx(k)} y={28} w={W} h={34} r={3}
              fill={live ? (k === 0 ? tok('panel') : tok('safe', 0.14)) : tok('panel', 0.4)}
              stroke={live ? (k === 0 ? tok('line') : tok('safe')) : tok('line')} dash={!live} />
            <T x={sx(k) + W / 2} y={45} size={k === 0 ? 11 : 14} mono anchor="middle" fill={live ? tok('ink') : tok('muted')}>{v}</T>
          </g>
        );
      })}
      <T x={392} y={45} size={14} anchor="end" fill={tok('muted')}>…</T>
      <polygon points={`${sx(SP) + W / 2},66 ${sx(SP) + W / 2 - 6},76 ${sx(SP) + W / 2 + 6},76`} fill={tok('accent')} />
      <T x={sx(SP) + W / 2} y={86} size={12} mono anchor="middle" weight={700} fill={tok('accent')}>sp = 4</T>
      <T x={sx(3) + W / 2} y={86} size={11} mono anchor="middle" fill={tok('brand')}>peek(0)</T>
      <T x={sx(2) + W / 2} y={86} size={11} mono anchor="middle" fill={tok('brand')}>peek(1)</T>
      <T x={8} y={114} size={12} mono>push(v): stack[sp] = v, then sp = sp + 1</T>
      <T x={8} y={134} size={12} mono>pop(): sp = sp - 1, then read stack[sp]</T>
      <T x={8} y={156} size={11} fill={tok('muted')}>The top is slot sp - 1. Nothing is allocated or freed; only sp moves.</T>
    </Svg>
  );
}
