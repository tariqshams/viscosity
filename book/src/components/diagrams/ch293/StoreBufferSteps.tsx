import { StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// Chapter 293: the store-buffering litmus test on an x86-like machine.
// Each core parks its stores in its own FIFO buffer; loads read memory
// (or their own buffer), so both loads can miss both stores.
type S = { pc: [number, number]; buf: [string[], string[]]; mem: { x: number; y: number }; r1?: number; r2?: number; note: string };

const STATES: S[] = [
  { pc: [0, 0], buf: [[], []], mem: { x: 0, y: 0 }, note: 'Two threads on two cores; x and y start at 0. Thread 1 will write x and read y; thread 2 will write y and read x. Under sequential consistency at least one of them must see a 1.' },
  { pc: [1, 0], buf: [['x = 1'], []], mem: { x: 0, y: 0 }, note: 'Core 1 runs x = 1. Rather than wait for memory, it parks the store in its store buffer and carries on. Memory still says x = 0.' },
  { pc: [1, 1], buf: [['x = 1'], ['y = 1']], mem: { x: 0, y: 0 }, note: 'Core 2 does the same with y = 1. Both stores are on their way, and neither has arrived.' },
  { pc: [2, 1], buf: [['x = 1'], ['y = 1']], mem: { x: 0, y: 0 }, r1: 0, note: 'Core 1 reads y. Its own buffer has nothing for y, so it reads memory: r1 = 0.' },
  { pc: [2, 2], buf: [['x = 1'], ['y = 1']], mem: { x: 0, y: 0 }, r1: 0, r2: 0, note: 'Core 2 reads x from memory: r2 = 0. Both loads have overtaken their own thread\'s earlier store.' },
  { pc: [2, 2], buf: [[], []], mem: { x: 1, y: 1 }, r1: 0, r2: 0, note: 'The buffers drain and memory ends with x = 1 and y = 1, but the damage is done: r1 = r2 = 0, an outcome no interleaving can produce. It happened 63177 times in a million runs on this book\'s x86 machine.' },
];

const CODE: [string[], string[]] = [['x = 1', 'r1 = y'], ['y = 1', 'r2 = x']];

export default function StoreBufferSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="Store buffering on x86" steps={s} note={st.note}>
      <Svg w={400} h={236} title="Two cores, each with its code, a store buffer and a register, above a shared memory holding x and y">
        {[0, 1].map((t) => {
          const x0 = 8 + t * 200;
          const reg = t === 0 ? st.r1 : st.r2;
          return (
            <g key={t}>
              <T x={x0} y={12} size={11} weight={700} fill={tok('muted')}>{`CORE ${t + 1}`}</T>
              {CODE[t].map((l, k) => (
                <Box key={l} x={x0} y={22 + k * 28} w={110} h={24} fill={k < st.pc[t] ? tok('brand', 0.12) : tok('panel')} stroke={k < st.pc[t] ? tok('brand') : tok('line')}>
                  <T x={x0 + 10} y={34 + k * 28} size={12} mono>{l}</T>
                </Box>
              ))}
              <T x={x0 + 120} y={34} size={11} fill={tok('muted')}>{t === 0 ? 'r1' : 'r2'}</T>
              <Box x={x0 + 140} y={22} w={40} h={24} dash={reg === undefined}>
                <T x={x0 + 160} y={34} size={13} mono anchor="middle">{reg === undefined ? '' : String(reg)}</T>
              </Box>
              <T x={x0} y={92} size={11} fill={tok('muted')}>store buffer</T>
              <Box x={x0} y={100} w={180} h={28} fill={st.buf[t].length ? tok('warn', 0.15) : 'transparent'} stroke={st.buf[t].length ? tok('warn') : tok('line')} dash={!st.buf[t].length}>
                <T x={x0 + 10} y={114} size={12} mono>{st.buf[t].join(', ')}</T>
              </Box>
              <Arrow x1={x0 + 90} y1={130} x2={x0 + 90} y2={164} color={tok('ink', 0.4)} dash />
            </g>
          );
        })}
        <T x={8} y={160} size={11} weight={700} fill={tok('muted')}>SHARED MEMORY</T>
        <Box x={8} y={168} w={384} h={40} fill={tok('panel')}>
          <T x={110} y={188} size={14} mono anchor="middle">{`x = ${st.mem.x}`}</T>
          <T x={290} y={188} size={14} mono anchor="middle">{`y = ${st.mem.y}`}</T>
        </Box>
        <T x={8} y={226} size={11} fill={tok('muted')}>A load checks its own buffer, then memory.</T>
      </Svg>
    </StepFrame>
  );
}
