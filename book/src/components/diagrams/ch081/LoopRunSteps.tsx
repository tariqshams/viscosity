// Chapter 81: running the companion's real bytecode for
//   let n = 0; while n < 2 { n += 1; }
// one step at a time, with the instruction pointer, the stack and n.
// Raw bytes: jump.unless at 13 has distance 14 (16 + 14 = 30);
// loop at 27 has distance 24 (30 - 24 = 6).
import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

const LISTING = `0000    1 const               0 '0'
0003    | define.global       1 'n'
0006    2 load.global         2 'n'
0009    | const               3 '2'
0012    | lt
0013    | jump.unless        13 -> 30
0016    3 load.global         4 'n'
0019    | const               5 '1'
0022    | add
0023    | store.global        4 'n'
0026    | pop
0027    4 loop               27 -> 6
0030    | none
0031    | return`;

type S = { lines: number[]; ip: number; stack: string[]; n: string; sum?: string; note: string };

const STATES: S[] = [
  { lines: [], ip: 0, stack: ['script'], n: '-', note: 'The program is let n = 0; while n < 2 { n += 1; }. The VM starts at offset 0 and, as always, runs one instruction after another unless a jump says otherwise.' },
  { lines: [0, 1], ip: 6, stack: ['script'], n: '0', note: 'let n = 0 at the top level: const pushes 0, and define.global stores it in the globals table as n.' },
  { lines: [2, 3, 4], ip: 13, stack: ['script', 'true'], n: '0', note: 'The condition, n < 2, leaves true on the stack. Offset 6 is where every round of the loop starts.' },
  { lines: [5], ip: 16, stack: ['script'], n: '0', sum: 'true: no jump, ip = 13 + 3 = 16', note: 'jump.unless reads its distance (14) and pops the condition. It is true, so it does NOT jump: ip moves on past the 3-byte instruction to 16, the body.' },
  { lines: [6, 7, 8, 9, 10], ip: 27, stack: ['script'], n: '1', note: 'The body, n += 1: load n, push 1, add, store the sum back, and pop the leftover copy. n is now 1.' },
  { lines: [11], ip: 6, stack: ['script'], n: '1', sum: 'loop: ip = 30 − 24 = 6', note: 'loop reads its distance, 24, which leaves ip at 30, then SUBTRACTS it: 30 − 24 = 6. Back to the condition. No condition, no pop: loop always jumps.' },
  { lines: [2, 3, 4], ip: 13, stack: ['script', 'true'], n: '1', note: 'Second round: 1 < 2 is true.' },
  { lines: [5], ip: 16, stack: ['script'], n: '1', sum: 'true: no jump, ip = 16', note: 'jump.unless pops true and falls through into the body again.' },
  { lines: [6, 7, 8, 9, 10], ip: 27, stack: ['script'], n: '2', note: 'n becomes 2.' },
  { lines: [11], ip: 6, stack: ['script'], n: '2', sum: 'loop: ip = 30 − 24 = 6', note: 'loop sends ip back to 6 once more. The same three bytes, the same distance, every round.' },
  { lines: [2, 3, 4], ip: 13, stack: ['script', 'false'], n: '2', note: 'Third round: 2 < 2 is false.' },
  { lines: [5], ip: 30, stack: ['script'], n: '2', sum: 'false: ip = 16 + 14 = 30', note: 'jump.unless pops false, so this time it jumps: ip is 16 after the operand, plus 14, is 30. The whole body and the loop instruction are skipped.' },
  { lines: [12, 13], ip: 32, stack: ['script'], n: '2', note: 'none and return end the script. Two jumps, both with fixed distances worked out by the compiler, were all the VM needed to run a loop.' },
];

export default function LoopRunSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="A while loop, by instruction pointer" steps={s} note={st.note}>
      <CodeTrace code={LISTING} line={st.lines.length ? st.lines[st.lines.length - 1] : null} />
      <Svg w={400} h={120} title="The instruction pointer, the stack and the global n after this step, with the jump arithmetic when a jump has just run.">
        <T x={8} y={14} size={11} weight={700} fill={tok('muted')}>ip (next offset)</T>
        <Box x={8} y={24} w={88} h={30} fill={tok('brand', 0.14)} stroke={tok('brand')}>
          <T x={52} y={39} size={14} mono weight={700} anchor="middle">{String(st.ip).padStart(4, '0')}</T>
        </Box>
        <T x={112} y={14} size={11} weight={700} fill={tok('muted')}>stack</T>
        {st.stack.map((v, i) => (
          <Box key={i} x={112 + i * 66} y={24} w={62} h={30}>
            <T x={143 + i * 66} y={39} size={12} mono anchor="middle">{v}</T>
          </Box>
        ))}
        <T x={260} y={14} size={11} weight={700} fill={tok('muted')}>global n</T>
        <Box x={260} y={24} w={60} h={30}>
          <T x={290} y={39} size={14} mono anchor="middle">{st.n}</T>
        </Box>
        <T x={8} y={80} size={12.5} mono fill={tok('brand')}>{st.sum ?? ''}</T>
        <T x={8} y={104} size={11} fill={tok('muted')}>Highlighted: the last instruction run.</T>
      </Svg>
    </StepFrame>
  );
}
