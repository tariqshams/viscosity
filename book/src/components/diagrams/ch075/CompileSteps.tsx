// Chapter 75: the single-pass compiler on  print 1 + 2 * 3 - 4;
// The Pratt parser's calls are shown as a stack of frames, and the
// instructions appear the moment the compiler emits them. The output is
// the real disassembly from companion/ts/src/vm/compiler.ts.
import { StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

const TOKENS = ['1', '+', '2', '*', '3', '-', '4', ';'];
const EMIT = ['CONSTANT 0 (1)', 'CONSTANT 1 (2)', 'CONSTANT 2 (3)', 'MULTIPLY', 'ADD', 'CONSTANT 3 (4)', 'SUBTRACT', 'PRINT'];
const F0 = 'parsePrecedence(ASSIGNMENT)';
const fr = (op: string, p: string) => `binary ${op}: parsePrecedence(${p})`;

type S = { prev: number; cur: number; frames: string[]; emitted: number; note: string };

const STATES: S[] = [
  { prev: -1, cur: 0, frames: [F0], emitted: 0, note: 'The print statement has consumed print and calls expression(), which is parsePrecedence(ASSIGNMENT): “compile any expression at least this tight”, which means any expression at all.' },
  { prev: 0, cur: 1, frames: [F0], emitted: 1, note: 'advance() makes 1 the previous token. Its prefix rule is number(), which emits CONSTANT straight away. No node is built: the bytes are the only record.' },
  { prev: 1, cur: 2, frames: [F0, fr('+', 'FACTOR')], emitted: 1, note: 'The current token, +, is TERM: tight enough, so the loop takes it and calls its infix rule, binary(). binary remembers the + and compiles the right operand one level tighter, at FACTOR. Nothing is emitted for + yet.' },
  { prev: 2, cur: 3, frames: [F0, fr('+', 'FACTOR')], emitted: 2, note: '2 is a number: emit CONSTANT 1.' },
  { prev: 3, cur: 4, frames: [F0, fr('+', 'FACTOR'), fr('*', 'UNARY')], emitted: 2, note: '* is FACTOR, which is at least FACTOR, so the inner loop takes it. Another binary() call, now asking for UNARY or tighter.' },
  { prev: 4, cur: 5, frames: [F0, fr('+', 'FACTOR'), fr('*', 'UNARY')], emitted: 3, note: '3: emit CONSTANT 2. Three constants are out, and both operators are still waiting on the call stack.' },
  { prev: 4, cur: 5, frames: [F0, fr('+', 'FACTOR')], emitted: 4, note: 'The current token, -, is only TERM: weaker than UNARY, so that loop stops. Control returns into binary for *, which now emits MULTIPLY: its operands are already in the code.' },
  { prev: 4, cur: 5, frames: [F0], emitted: 5, note: '- is weaker than FACTOR too, so binary for + gets control back and emits ADD. The operator written first is emitted after the tighter one, exactly the order the VM needs.' },
  { prev: 5, cur: 6, frames: [F0, fr('-', 'FACTOR')], emitted: 5, note: 'Back in the outermost loop, - is tighter than ASSIGNMENT, so it is taken: binary for -, right operand at FACTOR.' },
  { prev: 6, cur: 7, frames: [F0, fr('-', 'FACTOR')], emitted: 6, note: '4: emit CONSTANT 3.' },
  { prev: 6, cur: 7, frames: [F0], emitted: 7, note: '; has no infix rule, so its precedence is NONE, weaker than everything. The loop stops and binary for - emits SUBTRACT.' },
  { prev: 7, cur: 8, frames: [], emitted: 8, note: 'The outer loop stops at ; as well. The print statement consumes it and emits PRINT. One pass over the tokens, and the code is finished: the same bytes as the disassembly in the text.' },
];

export default function CompileSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const tw = 40;
  return (
    <StepFrame title="Compiling print 1 + 2 * 3 - 4;" steps={s} note={st.note}>
      <Svg w={400} h={318} title="The single-pass compiler reads 1 + 2 * 3 - 4 one token at a time. Calls to parsePrecedence and binary pile up on a stack, and it emits CONSTANT 1, CONSTANT 2, CONSTANT 3, MULTIPLY, ADD, CONSTANT 4, SUBTRACT, PRINT.">
        <T x={8} y={10} size={11} weight={700} fill={tok('muted')}>tokens</T>
        <T x={392} y={10} size={10} anchor="end" fill={tok('muted')}>solid: previous · dashed: current</T>
        {TOKENS.map((t, k) => {
          const prev = k === st.prev;
          const cur = k === st.cur;
          const done = k < st.prev;
          return (
            <g key={k}>
              <Box x={8 + k * (tw + 8)} y={22} w={tw} h={28} r={4}
                fill={prev ? tok('brand', 0.22) : cur ? tok('accent', 0.12) : tok('panel')}
                stroke={prev ? tok('brand') : cur ? tok('accent') : tok('line')} dash={cur} opacity={done ? 0.5 : 1} />
              <T x={8 + k * (tw + 8) + tw / 2} y={37} size={15} mono anchor="middle">{t}</T>
            </g>
          );
        })}
        <T x={8} y={68} size={11} weight={700} fill={tok('muted')}>compiler calls (newest on top)</T>
        {st.frames.length === 0 && <T x={8} y={88} size={12} fill={tok('muted')}>expression finished</T>}
        {[...st.frames].reverse().map((f, k) => {
          const top = k === 0;
          return (
            <g key={f + k}>
              <Box x={8} y={78 + k * 26} w={384} h={22} r={3}
                fill={top ? tok('brand', 0.14) : tok('panel')} stroke={top ? tok('brand') : tok('line')} />
              <T x={16} y={89 + k * 26} size={12} mono>{f}</T>
            </g>
          );
        })}
        <T x={8} y={168} size={11} weight={700} fill={tok('muted')}>emitted so far</T>
        {EMIT.slice(0, st.emitted).map((e, k) => {
          const fresh = k === st.emitted - 1 && (s.i === 0 || STATES[s.i - 1].emitted < st.emitted);
          const col = k % 2;
          const row = Math.floor(k / 2);
          return (
            <g key={k}>
              <Box x={8 + col * 196} y={178 + row * 34} w={188} h={28} r={4}
                fill={fresh ? tok('safe', 0.2) : tok('safe', 0.07)} stroke={fresh ? tok('safe') : tok('safe', 0.5)} />
              <T x={16 + col * 196} y={192 + row * 34} size={12} mono>{`${k + 1}. ${e}`}</T>
            </g>
          );
        })}
      </Svg>
    </StepFrame>
  );
}
