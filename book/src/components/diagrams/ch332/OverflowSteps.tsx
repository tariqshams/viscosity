// Chapter 332: a u8 is eight bits, so it counts 0..=255 and then has
// nowhere to go. The reader steps a counter up to 255 and sees the four
// things that can happen next: a panic (debug builds check), a wrap to 0
// (rustc's release default), and the methods that say which you want.
// The panic text is real output of rustc 1.97.0.
import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

const CODE = `let mut r: u8 = 253;
r += 1;
r += 1;
r += 1;           // debug build
r += 1;           // release build
r.wrapping_add(1) // any build
r.checked_add(1)  // any build`;

type S = { line: number; v: number | null; carry?: boolean; label: string; tone: 'ok' | 'bad' | 'warn'; note: string };

const STATES: S[] = [
  { line: 0, v: 253, label: '253', tone: 'ok', note: 'A u8 is one byte: eight bits, each 0 or 1. 253 is 11111101 in binary. The type says the box can only ever hold 0 to 255.' },
  { line: 1, v: 254, label: '254', tone: 'ok', note: 'Adding 1 works as you expect: 254 is 11111110.' },
  { line: 2, v: 255, label: '255 = u8::MAX', tone: 'ok', note: '255 is 11111111: every bit is 1. This is the largest value a u8 can hold, written u8::MAX.' },
  { line: 3, v: null, label: 'panic!', tone: 'bad', note: 'One more, in a debug build (cargo run, cargo test): Rust checks every addition and stops the program with “attempt to add with overflow”. The bug is caught where it happens.' },
  { line: 4, v: 0, carry: true, label: '0 (wrapped)', tone: 'warn', note: 'In a release build rustc leaves the check out by default, and the carry falls off the left end: 255 + 1 becomes 0. The Rust Reference still calls this an error in your program; it is simply not caught.' },
  { line: 5, v: 0, carry: true, label: '0, on purpose', tone: 'ok', note: 'If wrapping is what you want (a byte counter, a hash), say so: wrapping_add gives 0 in every kind of build.' },
  { line: 6, v: null, label: 'None', tone: 'ok', note: 'checked_add gives None when the answer does not fit, so you can handle it (Option, None and Some come in their own chapter). saturating_add would give 255: stick at the top.' },
];

export default function OverflowSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const bits = st.v === null ? null : st.v.toString(2).padStart(8, '0').split('');
  const col = st.tone === 'bad' ? tok('danger') : st.tone === 'warn' ? tok('warn') : tok('safe');
  return (
    <StepFrame title="Counting past 255 in a u8" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={118} title="The eight bits of a u8 and its value">
        <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>THE EIGHT BITS OF r</T>
        {st.carry && (
          <g>
            <Box x={6} y={24} w={30} h={34} r={4} fill={tok('warn', 0.15)} stroke={tok('warn')} dash>
              <T x={21} y={41} size={15} mono anchor="middle" fill={tok('warn')}>1</T>
            </Box>
            <T x={21} y={70} size={11} anchor="middle" fill={tok('warn')}>lost</T>
          </g>
        )}
        {Array.from({ length: 8 }, (_, k) => (
          <Box key={k} x={46 + k * 40} y={24} w={36} h={34} r={4} fill={bits ? (bits[k] === '1' ? tok('f1', 0.18) : tok('panel')) : tok('danger', 0.08)} stroke={bits ? tok('ink', 0.5) : tok('danger')} dash={!bits}>
            <T x={64 + k * 40} y={41} size={16} mono anchor="middle" weight={700}>{bits ? bits[k] : '?'}</T>
          </Box>
        ))}
        <T x={46} y={78} size={11} fill={tok('muted')}>128</T>
        <T x={362} y={78} size={11} anchor="end" fill={tok('muted')}>1</T>
        <Box x={110} y={86} w={180} h={28} r={5} fill={tok('panel')} stroke={col}>
          <T x={200} y={100} size={14} mono weight={700} anchor="middle" fill={col}>{st.label}</T>
        </Box>
      </Svg>
    </StepFrame>
  );
}
