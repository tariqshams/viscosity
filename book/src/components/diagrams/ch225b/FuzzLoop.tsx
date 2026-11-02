import { StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// Chapter 225-b: one turn of the repository's fuzzer (engine/rust/scripts/
// fuzz.mjs): a seed makes a program; it is compiled by both engines; the
// original and the compiled program are run in fresh VM contexts; outputs,
// code and explain text are compared; a failure is reduced and kept.
type Hi = 'seed' | 'gen' | 'compile' | 'run' | 'parity' | 'cmp' | 'fail' | 'keep';
type S = { hi: Hi; note: string };

const STATES: S[] = [
  { hi: 'seed', note: 'Program k of a campaign gets its own seed, worked out from the campaign seed and k. Same seed, same program: any failure can be made again on its own with --only k.' },
  { hi: 'gen', note: 'The generator builds a random program in the subset Viscosity cares about: arrays of record literals, loops over them, escapes, out-of-bounds reads inside try/catch. About one in 20 also gets an ECMAScript early error, which both engines must reject.' },
  { hi: 'compile', note: 'The TypeScript engine compiles it in-process; the Rust engine compiles a whole batch of files through its command-line tool, so it pays for a few process starts per batch rather than per program.' },
  { hi: 'run', note: 'Oracle one, behaviour: run the original and the compiled program, each in a fresh VM context, and record what they print and what they throw.' },
  { hi: 'parity', note: 'Oracle two, parity: the two engines must produce the same compiled code, the same explain text and the same code frames, byte for byte.' },
  { hi: 'cmp', note: 'Compare. With seed 1 and 300 programs, the run for this chapter reported 0 failing in about 8 seconds.' },
  { hi: 'fail', note: 'When something does differ, the program is written out, and with --reduce it is shrunk, a chunk of lines at a time, for as long as the same kind of failure stays.' },
  { hi: 'keep', note: 'The small program becomes a corpus test, so the bug can never come back unnoticed. The README lists five bugs found this way, each now with its own corpus program.' },
];

const BOXES: { id: Hi; x: number; y: number; w: number; label: string }[] = [
  { id: 'seed', x: 8, y: 10, w: 84, label: 'seed (S, k)' },
  { id: 'gen', x: 112, y: 10, w: 96, label: 'generate' },
  { id: 'compile', x: 228, y: 10, w: 164, label: 'compile: TS, Rust' },
  { id: 'run', x: 112, y: 86, w: 128, label: 'run both' },
  { id: 'parity', x: 260, y: 86, w: 132, label: 'TS = Rust?' },
  { id: 'cmp', x: 160, y: 156, w: 120, label: 'all equal?' },
  { id: 'fail', x: 8, y: 156, w: 120, label: 'reduce' },
  { id: 'keep', x: 8, y: 220, w: 120, label: 'corpus test' },
];

export default function FuzzLoop() {
  const s = useSteps(STATES);
  const hi = s.state.hi;
  const order = STATES.map((x) => x.hi);
  const k = order.indexOf(hi);
  return (
    <StepFrame title="One turn of the fuzzer" steps={s} note={s.state.note}>
      <Svg w={400} h={256} title="Seed, generate, compile with both engines, run both versions, compare, and reduce a failure into a corpus test">
        {BOXES.map((b) => {
          const on = b.id === hi;
          const done = order.indexOf(b.id) < k;
          const bad = b.id === 'fail' && on;
          return (
            <Box key={b.id} x={b.x} y={b.y} w={b.w} h={30} fill={on ? tok(bad ? 'danger' : 'brand', 0.15) : 'transparent'} stroke={on ? tok(bad ? 'danger' : 'brand') : tok('line')} dash={!on && !done}>
              <T x={b.x + b.w / 2} y={b.y + 15} size={12.5} mono anchor="middle" fill={done || on ? undefined : tok('muted')}>{b.label}</T>
            </Box>
          );
        })}
        <Arrow x1={92} y1={25} x2={110} y2={25} />
        <Arrow x1={208} y1={25} x2={226} y2={25} />
        <Arrow x1={270} y1={40} x2={190} y2={84} />
        <Arrow x1={320} y1={40} x2={324} y2={84} />
        <Arrow x1={180} y1={116} x2={210} y2={154} />
        <Arrow x1={320} y1={116} x2={250} y2={154} />
        <Arrow x1={160} y1={171} x2={130} y2={171} color={tok('danger')} />
        <T x={144} y={194} size={11} anchor="middle" fill={tok('danger')}>no</T>
        <Arrow x1={68} y1={186} x2={68} y2={218} />
        <Arrow x1={280} y1={171} x2={340} y2={171} />
        <T x={364} y={171} size={11} fill={tok('safe')}>yes:</T>
        <T x={364} y={187} size={11} fill={tok('safe')}>next k</T>
      </Svg>
    </StepFrame>
  );
}
