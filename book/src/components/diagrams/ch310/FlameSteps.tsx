import { StepFrame, useSteps } from '../../viz/stepper';
import { Svg, T, tok } from '../../viz/svg';

// Chapter 310: a flame graph built by hand from real callgrind numbers.
// Source: `valgrind --tool=callgrind` (valgrind 3.22) on drip-rs, release
// build (rustc 1.97, lto), running corpus/benchmark/fib.drip and zoo.drip
// on the book's shared cloud VM, 2026-10-31; then `callgrind_annotate
// --inclusive=yes` and `--tree=calling`. The values are instruction
// counts (Ir), not time. Widths are inclusive cost; the bare top of a box
// is its self cost. Boxes are ordered by size, not alphabetically as
// flamegraph.pl orders them: the x order carries no meaning either way.
type Frame = { name: string; ir: number; depth: number; x: number; col: string };
type S = { prog: 'fib' | 'zoo'; upTo: number; selfOf?: string; hot?: string; note: string };

const FIB_TOTAL = 20_186_274_402;
const ZOO_TOTAL = 7_528_846_449;

// [name, inclusive Ir, depth, left offset in Ir]
const FIB: Frame[] = [
  { name: 'main', ir: 20_185_973_025, depth: 0, x: 0, col: 'muted' },
  { name: 'Vm::run', ir: 20_185_841_592, depth: 1, x: 0, col: 'brand' },
  { name: 'call_value', ir: 3_135_374_121, depth: 2, x: 0, col: 'accent' },
  { name: 'Table::get', ir: 1_194_428_240, depth: 2, x: 3_135_374_121, col: 'warn' },
  { name: 'close_upvalues', ir: 179_164_224, depth: 2, x: 4_329_802_361, col: 'f3' },
  { name: 'call', ir: 2_418_717_118, depth: 3, x: 0, col: 'safe' },
];

const ZOO: Frame[] = [
  { name: 'main', ir: 7_528_545_072, depth: 0, x: 0, col: 'muted' },
  { name: 'Vm::run', ir: 7_528_350_794, depth: 1, x: 0, col: 'brand' },
  { name: 'Table::get', ir: 1_633_333_940, depth: 2, x: 0, col: 'warn' },
  { name: 'invoke_from_class', ir: 1_530_000_306, depth: 2, x: 1_633_333_940, col: 'accent' },
  { name: 'Table::set', ir: 110_007_539, depth: 2, x: 3_163_334_246, col: 'f3' },
  { name: 'call', ir: 810_000_418, depth: 3, x: 1_633_333_940, col: 'safe' },
  { name: 'Table::get', ir: 400_000_080, depth: 3, x: 2_443_334_358, col: 'warn' },
];

const STATES: S[] = [
  { prog: 'fib', upTo: 1, note: 'fib.drip under callgrind: 20,186,274,402 machine instructions in all. The bottom box is main, then Vm::run on top of it. Each is as wide as the instructions spent while it was on the stack: all of them.' },
  { prog: 'fib', upTo: 2, note: 'Next layer: what run called. call_value (15.5%), Table::get (5.9%), close_upvalues (0.9%). Each sits on run, as wide as its share.' },
  { prog: 'fib', upTo: 3, note: 'call_value spends most of its 15.5% inside call (12.0%). A tower in a flame graph is a chain of calls.' },
  { prog: 'fib', upTo: 3, selfOf: 'Vm::run', note: 'The part of run with nothing on top is its self cost: 77.7%. That is the dispatch loop itself, with push, pop and read_byte inlined into it, so they have no boxes of their own.' },
  { prog: 'zoo', upTo: 3, note: 'zoo.drip calls methods and reads fields: 7,528,846,449 instructions. Table::get now takes a big box directly on run (21.7%): the field lookups.' },
  { prog: 'zoo', upTo: 3, hot: 'Table::get', note: 'Table::get appears twice: on run, and on invoke_from_class (5.3%, the method lookups). Its self cost, 27.0%, is the two boxes added up. Same function, two call paths.' },
];

export default function FlameSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const frames = st.prog === 'fib' ? FIB : ZOO;
  const total = st.prog === 'fib' ? FIB_TOTAL : ZOO_TOTAL;
  const L = 8;
  const W = 384;
  const H = 26;
  const base = 150;
  const px = (ir: number) => (ir / total) * W;
  const pct = (ir: number) => `${((ir / total) * 100).toFixed(1)}%`;
  const shown = frames.filter((f) => f.depth <= st.upTo);
  const run = frames.find((f) => f.name === 'Vm::run') as Frame;
  const labelOf = (f: Frame) => {
    const w = px(f.ir);
    if (w > f.name.length * 6 + 44) return `${f.name} ${pct(f.ir)}`;
    return w > f.name.length * 6 + 6 ? f.name : '';
  };
  const unlabelled = shown.filter((f) => f.depth >= 2 && !labelOf(f).includes('%'));
  const kids = frames.filter((f) => f.depth === 2).reduce((a, f) => a + f.ir, 0);
  return (
    <StepFrame title={`A flame graph of drip-rs running ${st.prog}.drip`} steps={s} note={st.note}>
      <Svg w={400} h={222} title="Flame graph boxes: main, Vm::run, and the functions run called, with widths proportional to instructions executed">
        <T x={L} y={14} size={11} weight={700} fill={tok('brand')}>{`${st.prog}.drip · ${total.toLocaleString('en-US')} Ir`}</T>
        <T x={L} y={30} size={10} fill={tok('muted')}>width = instructions while on the stack · up = deeper</T>
        {shown.map((f, k) => {
          const y = base - f.depth * (H + 4);
          const w = Math.max(1.5, px(f.ir));
          const dim = st.hot && f.name !== st.hot;
          const label = labelOf(f);
          return (
            <g key={k} opacity={dim ? 0.35 : 1}>
              <title>{`${f.name}: ${f.ir.toLocaleString('en-US')} Ir inclusive (${pct(f.ir)})`}</title>
              <rect x={L + px(f.x)} y={y} width={w} height={H} rx={2} fill={tok(f.col, 0.28)} stroke={tok(f.col)} strokeWidth={1.2} />
              {label && <T x={L + px(f.x) + 4} y={y + H / 2} size={10} mono>{label}</T>}
            </g>
          );
        })}
        {st.selfOf && (
          <g>
            <rect x={L + px(kids)} y={base - 2 * (H + 4)} width={px(run.ir - kids)} height={H} rx={2} fill="none" stroke={tok('brand')} strokeWidth={1.5} strokeDasharray="4 3" />
            <T x={L + px(kids) + 6} y={base - 2 * (H + 4) + H / 2} size={10} mono fill={tok('brand')}>{`run's self cost: ${pct(run.ir - kids)}`}</T>
          </g>
        )}
        {(st.upTo >= 2 ? unlabelled.map((f) => `${f.name} ${pct(f.ir)}`) : ['main and run: 100.0% each'])
          .reduce<string[][]>((rows, t, k) => { if (k % 3 === 0) rows.push([]); rows[rows.length - 1].push(t); return rows; }, [])
          .map((row, k) => <T key={k} x={L} y={190 + k * 14} size={10} mono fill={tok('muted')}>{row.join(' · ')}</T>)}
      </Svg>
    </StepFrame>
  );
}
