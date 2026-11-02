import { StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

// Chapter 147: two flame graphs drawn from real callgrind numbers.
// Source: `valgrind --tool=callgrind` (valgrind 3.22) on drip-rs, a
// release build (rustc 1.97, lto, codegen-units = 1) with debug info
// added by CARGO_PROFILE_RELEASE_DEBUG=true, running
// corpus/benchmark/fib.drip and strings.drip on the book's shared cloud
// VM, 2026-11-02; then `callgrind_annotate --inclusive=yes
// --tree=calling`. The values are instruction counts (Ir), not time.
// A box's width is its inclusive cost; the bare top of a box is its self
// cost. Boxes are ordered by size, left to right; x order means nothing.
type Frame = { name: string; ir: number; depth: number; x: number; col: string };
type S = { prog: 'fib' | 'strings'; upTo: number; hot?: string; note: string };

const FIB_TOTAL = 5_593_942_673;
const STR_TOTAL = 3_577_294_690;

// x is the left offset, in Ir, within the whole program.
const FIB: Frame[] = [
  { name: 'Vm::run', ir: 5_593_508_419, depth: 0, x: 0, col: 'brand' },
  { name: 'call_value', ir: 775_407_050, depth: 1, x: 0, col: 'accent' },
  { name: 'pop_numbers', ir: 578_030_669, depth: 1, x: 775_407_050, col: 'f2' },
  { name: 'Table::get', ir: 338_359_440, depth: 1, x: 1_353_437_719, col: 'warn' },
  { name: 'read_string', ir: 211_474_680, depth: 1, x: 1_691_797_159, col: 'f3' },
  { name: 'call', ir: 570_981_555, depth: 2, x: 0, col: 'safe' },
];

const STR: Frame[] = [
  { name: 'Vm::run', ir: 3_576_725_575, depth: 0, x: 0, col: 'brand' },
  { name: 'call_value (str)', ir: 2_179_537_049, depth: 1, x: 0, col: 'accent' },
  { name: 'fmod', ir: 232_869_501, depth: 1, x: 2_179_537_049, col: 'f4' },
  { name: 'intern', ir: 190_536_580, depth: 1, x: 2_412_406_550, col: 'f5' },
  { name: 'Value::format', ir: 1_940_037_642, depth: 2, x: 0, col: 'f1' },
  { name: 'intern', ir: 170_379_407, depth: 2, x: 1_940_037_642, col: 'f5' },
  { name: 'format_into', ir: 1_922_037_642, depth: 3, x: 0, col: 'f1' },
  { name: 'format_number', ir: 1_724_904_116, depth: 4, x: 0, col: 'danger' },
  { name: 'format! (format_inner)', ir: 1_263_928_866, depth: 5, x: 0, col: 'danger' },
];

const STATES: S[] = [
  {
    prog: 'fib', upTo: 0, hot: 'Vm::run',
    note: 'fib(32), 5,593,942,673 instructions in all. The bottom box is Vm::run, the interpreter loop, and nearly all of the program is inside it. Width is the share of instructions; height is call depth.',
  },
  {
    prog: 'fib', upTo: 1,
    note: 'The functions run calls. call_value (13.9%) and pop_numbers (10.3%) are the widest; Table::get (6.0%) is the global lookup of fib itself, 7,049,155 times. close_upvalues (0.8%) is too thin to label.',
  },
  {
    prog: 'fib', upTo: 2, hot: 'Vm::run',
    note: 'call_value mostly calls call, which pushes the frame. The bare top of run, 65.2% of everything, is its self cost: dispatch, push and pop, and reading bytes, all inlined into it. That loop is fib’s cost.',
  },
  {
    prog: 'strings', upTo: 1, hot: 'call_value (str)',
    note: 'strings.drip, 3,577,294,690 instructions. Now call_value is 60.9% wide: it is the native str(), called 720,000 times. fmod is the % operator (6.5%); intern is joining strings with + (5.3%).',
  },
  {
    prog: 'strings', upTo: 4, hot: 'format_number',
    note: 'Climb the tower: str formats its argument with Value::format, then format_into, then format_number, which alone is 48.2% of the whole program. Turning small whole numbers into text costs more than everything else.',
  },
  {
    prog: 'strings', upTo: 5, hot: 'format! (format_inner)',
    note: 'Inside format_number, Rust’s format! machinery (format_inner, 2,138,403 calls: about three per number) is 35.3% of the program. The dispatch loop’s own share is only 17.9% here. The next chapter acts on this.',
  },
];

const W = 392;
const ROW = 26;

export default function FlameSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const frames = st.prog === 'fib' ? FIB : STR;
  const total = st.prog === 'fib' ? FIB_TOTAL : STR_TOTAL;
  const base = 196;
  const px = (ir: number) => (ir / total) * W;
  return (
    <StepFrame title="Two flame graphs from callgrind" steps={s} note={st.note}>
      <Svg w={400} h={236} title="Flame graphs of drip-rs running fib.drip and strings.drip, from callgrind instruction counts">
        <T x={4} y={12} size={12} mono weight={700}>{st.prog === 'fib' ? 'fib.drip' : 'strings.drip'}</T>
        <T x={396} y={12} size={11} mono anchor="end" fill={tok('muted')}>{total.toLocaleString('en-GB')} Ir</T>
        {frames.filter((f) => f.depth <= st.upTo).map((f) => {
          const w = px(f.ir);
          const x = 4 + px(f.x);
          const y = base - f.depth * ROW;
          const hot = st.hot === f.name;
          const label = `${f.name} ${((f.ir / total) * 100).toFixed(1)}%`;
          return (
            <Box key={`${f.name}-${f.depth}`} x={x} y={y} w={Math.max(w - 1, 1)} h={ROW - 2} r={2}
              fill={tok(f.col, hot ? 0.45 : 0.25)} stroke={hot ? tok('ink') : tok(f.col)}>
              {w > 46 && (
                <T x={x + 5} y={y + 12} size={11} mono weight={hot ? 700 : undefined}>
                  {w > label.length * 6.8 ? label : f.name.slice(0, Math.floor(w / 7))}
                </T>
              )}
            </Box>
          );
        })}
        <T x={4} y={232} size={11} fill={tok('muted')}>Width: inclusive instructions. Bare top: the box’s own (self) cost.</T>
      </Svg>
    </StepFrame>
  );
}
