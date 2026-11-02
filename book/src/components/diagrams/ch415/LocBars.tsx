// Chapter 415: lines of code in the TypeScript VM and in drip-rs, module
// by module. Counted for the chapter on 2026-11-02 with a short script
// over book/companion/ts/src/vm/*.ts and book/companion/rust/src/*.rs:
// lines that are not blank and not comments (//, ///, //!, /* ... */,
// and JSDoc lines starting with *), and for Rust nothing from a module's
// #[cfg(test)] onwards. object.ts is paired with object.rs + value.rs;
// main.rs (the CLI) has no twin inside ts/src/vm.
import { Svg, T, tok } from '../../viz/svg';

type Loc = { mod: string; ts: number | null; rs: number };
const LOC: Loc[] = [
  { mod: 'compiler', ts: 670, rs: 1099 },
  { mod: 'vm', ts: 462, rs: 849 },
  { mod: 'heap / gc', ts: 152, rs: 359 },
  { mod: 'object+value', ts: 98, rs: 332 },
  { mod: 'scanner', ts: 107, rs: 314 },
  { mod: 'table', ts: 97, rs: 122 },
  { mod: 'chunk', ts: 64, rs: 102 },
  { mod: 'debug', ts: 56, rs: 87 },
  { mod: 'main (CLI)', ts: null, rs: 50 },
  { mod: 'lib / index', ts: 8, rs: 14 },
];

export default function LocBars() {
  const L = 96;
  const scale = 230 / 1100;
  const ts = LOC.reduce((a, r) => a + (r.ts ?? 0), 0);
  const rs = LOC.reduce((a, r) => a + r.rs, 0);
  return (
    <Svg w={400} h={292} title="Lines of code per module in the TypeScript VM and in drip-rs">
      <rect x={L} y={4} width={10} height={10} fill={tok('accent', 0.7)} />
      <T x={L + 14} y={9} size={11}>TypeScript VM</T>
      <rect x={L + 120} y={4} width={10} height={10} fill={tok('brand', 0.7)} />
      <T x={L + 134} y={9} size={11}>drip-rs</T>
      {LOC.map((r, i) => {
        const y = 24 + i * 24;
        return (
          <g key={r.mod}>
            <T x={L - 6} y={y + 9} size={11} mono anchor="end">{r.mod}</T>
            {r.ts !== null && <rect x={L} y={y} width={r.ts * scale} height={8} rx={1.5} fill={tok('accent', 0.7)} />}
            <rect x={L} y={y + 9} width={r.rs * scale} height={8} rx={1.5} fill={tok('brand', 0.7)} />
            <T x={L + r.rs * scale + 4} y={y + 9} size={11} mono fill={tok('muted')}>{`${r.ts ?? '·'} / ${r.rs}`}</T>
          </g>
        );
      })}
      <T x={4} y={272} size={12} mono weight={700}>{`total: ${ts.toLocaleString('en-GB')} / ${rs.toLocaleString('en-GB')} lines (${(rs / ts).toFixed(2)}×)`}</T>
      <T x={4} y={288} size={11} fill={tok('muted')}>Code lines only: no blanks, no comments, no unit tests.</T>
    </Svg>
  );
}
