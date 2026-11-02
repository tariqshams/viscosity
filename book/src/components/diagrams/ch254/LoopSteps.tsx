import { StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

// sum([5, 7]) in Ignition, one bytecode at a time. The listing is
// `node --print-bytecode --print-bytecode-filter=sum` (Node v22.23.4,
// V8 12.4), for:
//   function sum(xs) { let s = 0;
//     for (let i = 0; i < xs.length; i++) s += xs[i]; return s; }
// s lives in r0, i in r1; r2 receives a copy that nothing reads.
const CODE = [
  '@ 4  GetNamedProperty a0, [0], [0]',
  '@ 8  TestLessThan r1, [2]',
  '@11  JumpIfFalse [23]',
  '@13  Ldar r1',
  '@15  GetKeyedProperty a0, [4]',
  '@18  Add r0, [3]',
  '@21  Mov r0, r2',
  '@24  Star0',
  '@25  Ldar r1 / Inc [6] / Star1',
  '@30  JumpLoop [26], [0], [7]',
  '@34  Ldar r0 / Return',
];

type S = { at: number; r0: string; r1: string; r2: string; acc: string; note: string };

const STATES: S[] = [
  { at: -1, r0: '0', r1: '0', r2: '', acc: '0', note: 'sum([5, 7]) has run its first four bytecodes (LdaZero, Star0, LdaZero, Star1), so s (r0) and i (r1) are both 0. The loop starts at offset 4. a0 is the parameter xs.' },
  { at: 0, r0: '0', r1: '0', r2: '', acc: '2', note: 'GetNamedProperty reads xs.length into the accumulator: constant-pool entry [0] is the name "length", and the last [0] is the feedback slot of this property access.' },
  { at: 1, r0: '0', r1: '0', r2: '', acc: 'true', note: 'TestLessThan r1 compares i with the accumulator: is 0 < 2? The accumulator becomes true, and slot [2] records what kinds of value were compared.' },
  { at: 2, r0: '0', r1: '0', r2: '', acc: 'true', note: 'JumpIfFalse would jump 23 bytes forward, to offset 34, if the test had failed; it did not, so execution falls through into the body.' },
  { at: 3, r0: '0', r1: '0', r2: '', acc: '0', note: 'Ldar r1 loads i into the accumulator, ready to be used as an index.' },
  { at: 4, r0: '0', r1: '0', r2: '', acc: '5', note: 'GetKeyedProperty replaces the accumulator (the key) with xs[0], 5. Its feedback slot [4] is where the element access remembers the array map it saw, elements kind included.' },
  { at: 5, r0: '0', r1: '0', r2: '', acc: '5', note: 'Add r0, [3] computes s + 5 into the accumulator, and slot [3] records two small integers.' },
  { at: 6, r0: '0', r1: '0', r2: '0', acc: '5', note: 'Mov r0, r2 copies the old s into the spare register r2. Nothing in this listing reads r2 again; it is a copy the bytecode generator made for the compound assignment.' },
  { at: 7, r0: '5', r1: '0', r2: '0', acc: '5', note: 'Star0, a one-byte short form of Star r0, stores the accumulator into s. Ignition has short forms like this for the first sixteen registers.' },
  { at: 8, r0: '5', r1: '1', r2: '0', acc: '1', note: 'The update i++: Ldar r1, Inc [6] (with its own feedback slot) and Star1. i is now 1.' },
  { at: 9, r0: '5', r1: '1', r2: '0', acc: '1', note: 'JumpLoop jumps 26 bytes back, from 30 to the loop test at 4. Every backward jump charges the function\'s hotness budget, and this is the point where a long-running loop can switch into optimised code (on-stack replacement). [0] is the loop depth and [7] its feedback slot.' },
  { at: 10, r0: '12', r1: '2', r2: '5', acc: '12', note: 'The second trip adds 7 the same way. Then the test 2 < 2 fails, JumpIfFalse goes to offset 34, and Ldar r0 / Return returns 12 from the accumulator.' },
];

function Reg({ x, y, name, v, hi }: { x: number; y: number; name: string; v: string; hi?: boolean }) {
  return (
    <g>
      <T x={x} y={y + 11} size={11} mono fill={tok('muted')}>{name}</T>
      <Box x={x + 30} y={y} w={56} h={22} r={3} fill={hi ? tok('accent', 0.15) : tok('panel')} stroke={hi ? tok('accent') : tok('line')} dash={!v}>
        <T x={x + 58} y={y + 11} size={12} mono anchor="middle">{v}</T>
      </Box>
    </g>
  );
}

export default function LoopSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const prev = STATES[Math.max(0, s.i - 1)];
  return (
    <StepFrame title="sum([5, 7]) in Ignition, bytecode by bytecode" steps={s} note={st.note}>
      <Svg w={400} h={300} title="Left: the loop part of sum's real bytecode listing, with the current bytecode highlighted in orange. Right: the registers r0 (s), r1 (i) and r2, and the accumulator; a register that just changed is highlighted in blue.">
        <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>BYTECODE (loop of sum)</T>
        {CODE.map((l, k) => (
          <Box key={l} x={8} y={22 + k * 24} w={262} h={20} r={3}
            fill={k === st.at ? tok('brand', 0.18) : tok('panel')}
            stroke={k === st.at ? tok('brand') : tok('line')}>
            <T x={14} y={32 + k * 24} size={11} mono fill={k === st.at ? tok('brand') : tok('ink')}>{l}</T>
          </Box>
        ))}
        <T x={286} y={12} size={11} weight={700} fill={tok('muted')}>REGISTERS</T>
        <Reg x={286} y={26} name="r0" v={st.r0} hi={st.r0 !== prev.r0} />
        <Reg x={286} y={54} name="r1" v={st.r1} hi={st.r1 !== prev.r1} />
        <Reg x={286} y={82} name="r2" v={st.r2} hi={st.r2 !== prev.r2} />
        <Reg x={286} y={120} name="acc" v={st.acc} hi={st.acc !== prev.acc} />
        <T x={286} y={162} size={11} fill={tok('muted')}>s is r0, i is r1</T>
        <T x={286} y={178} size={11} fill={tok('muted')}>a0 is xs = [5, 7]</T>
      </Svg>
    </StepFrame>
  );
}
