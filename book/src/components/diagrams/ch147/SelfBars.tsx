// Chapter 147: the functions with the largest self cost (instructions in
// the function's own code, inlined helpers included) for two benchmark
// programs. Source: valgrind 3.22 callgrind on drip-rs (release build with
// debug info, rustc 1.97), 2026-11-02; `callgrind_annotate --auto=no`,
// with the per-file rows of each function added together. Shares are of
// all instructions: fib.drip 5,593,942,673 Ir, strings.drip
// 3,577,294,690 Ir.
import { Svg, T, tok } from '../../viz/svg';

type Bar = { name: string; pct: number; ours: boolean };

const FIB: Bar[] = [
  { name: 'Vm::run', pct: 65.2, ours: true },
  { name: 'pop_numbers', pct: 10.3, ours: true },
  { name: 'Vm::call', pct: 10.2, ours: true },
  { name: 'Table::get', pct: 6.0, ours: true },
  { name: 'read_string', pct: 3.8, ours: true },
];

const STR: Bar[] = [
  { name: 'Vm::run', pct: 17.9, ours: true },
  { name: '_int_free (libc)', pct: 6.6, ours: false },
  { name: 'fmod', pct: 6.3, ours: false },
  { name: 'format_inner', pct: 6.1, ours: false },
  { name: 'float → exponent', pct: 5.9, ours: false },
  { name: 'format_number', pct: 5.2, ours: true },
  { name: 'malloc (libc)', pct: 5.1, ours: false },
];

function Group({ y, title, bars }: { y: number; title: string; bars: Bar[] }) {
  const scale = 230 / 70;
  return (
    <g>
      <T x={4} y={y} size={12} mono weight={700}>{title}</T>
      {bars.map((b, i) => {
        const yy = y + 12 + i * 20;
        return (
          <g key={b.name}>
            <T x={128} y={yy + 8} size={11} mono anchor="end" fill={tok('ink')}>{b.name}</T>
            <rect x={134} y={yy} width={b.pct * scale} height={16} rx={2} fill={tok(b.ours ? 'brand' : 'warn', 0.55)} />
            <T x={140 + b.pct * scale} y={yy + 8} size={11} mono fill={tok('muted')}>{b.pct.toFixed(1)}%</T>
          </g>
        );
      })}
    </g>
  );
}

export default function SelfBars() {
  return (
    <Svg w={400} h={300} title="Largest self costs for fib.drip and strings.drip under callgrind">
      <Group y={10} title="fib.drip: self cost" bars={FIB} />
      <Group y={128} title="strings.drip: self cost" bars={STR} />
      <rect x={4} y={284} width={12} height={10} fill={tok('brand', 0.55)} />
      <T x={20} y={289} size={11} fill={tok('muted')}>drip-rs’s own code</T>
      <rect x={150} y={284} width={12} height={10} fill={tok('warn', 0.55)} />
      <T x={166} y={289} size={11} fill={tok('muted')}>Rust’s standard library and libc</T>
    </Svg>
  );
}
