import { Box, Svg, T, tok } from '../../viz/svg';

// Chapter 438: instrument() in engine/rust/crates/cli/src/profile.rs on a
// two-collection program (this chapter's lit.js). The initializer spans are
// the real byte ranges (11..31 and 44..46); they are sorted with
// Reverse(start), so qs is wrapped first and ps's offsets are still right.
// The result lines are what node read back from the instrumented file.
type Step = { title: string; lines: string[]; mark?: number };
const STEPS: Step[] = [
  { title: 'original', lines: ['const ps = [{ x: 1 }, { x: 2 }];', 'const qs = [];'] },
  { title: '1. wrap 44..46 (qs) first', lines: ['const ps = [{ x: 1 }, { x: 2 }];', 'const qs = __vsc_track("qs", []);'], mark: 1 },
  { title: '2. then 11..31 (ps): still in place', lines: ['const ps = __vsc_track("ps",', '  [{ x: 1 }, { x: 2 }]);', 'const qs = __vsc_track("qs", []);'], mark: 0 },
];

export default function WrapOrder() {
  let y = 6;
  return (
    <Svg w={400} h={232} title="Two initialisers wrapped last first, so the earlier byte offsets never move">
      {STEPS.map((s, k) => {
        const top = y;
        const h = 22 + s.lines.length * 16;
        y += h + 12;
        return (
          <g key={k}>
            <Box x={4} y={top} w={392} h={h} fill={k === 0 ? tok('panel') : tok('brand', 0.06)} stroke={k === 0 ? tok('line') : tok('brand')}>
              <T x={12} y={top + 12} size={11} weight={700} fill={tok('muted')}>{s.title}</T>
              {s.lines.map((l, j) => (
                <T key={j} x={12} y={top + 30 + j * 16} size={11} mono fill={(s.mark === 0 && j < 2) || (s.mark === 1 && j === 1) ? tok('brand') : undefined}>{l}</T>
              ))}
            </Box>
          </g>
        );
      })}
      <T x={6} y={224} size={11} fill={tok('muted')}>(step 2 is one line in the real output, wrapped here to fit)</T>
    </Svg>
  );
}
