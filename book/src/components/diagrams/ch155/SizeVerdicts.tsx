import { Box, Svg, T, tok } from '../../viz/svg';

// Chapter 155: the three kinds of size the analysis can record, from
// bounds_loops_and_sizes in engine/rust/crates/core/src/analysis.rs. The
// three programs are this chapter's s1, s2 and s3; the verdicts are what
// `viscosity explain` printed for them (rustc 1.97 release build):
// "about 200 elements", "at most 202 elements", "size unknown statically".
type Row = { y: number; loops: string[]; push: string; formula: string; verdict: string; color: string; why: string };

const ROWS: Row[] = [
  { y: 8, loops: ['i < 40', 'j < 5'], push: 'push', formula: '0 + 40 × 5', verdict: 'about 200', color: 'safe', why: 'every push runs on every trip' },
  { y: 116, loops: ['i < 100'], push: 'if: push / else: push', formula: '2 + 100 + 100', verdict: 'at most 202', color: 'warn', why: 'no push dominates the latch' },
  { y: 224, loops: ['i < 50'], push: 'add(i) → push', formula: 'push in a function', verdict: 'unknown', color: 'danger', why: 'depends on the calls to add' },
];

export default function SizeVerdicts() {
  return (
    <Svg w={400} h={330} title="Three ways a size estimate can end: about N, at most N, or unknown">
      {ROWS.map((r) => (
        <g key={r.verdict}>
          {r.loops.map((l, k) => (
            <Box key={l} x={4 + k * 16} y={r.y + k * 22} w={196 - k * 32} h={100 - k * 30} fill="transparent" stroke={tok('ink', 0.4)} dash>
              <T x={12 + k * 16} y={r.y + 12 + k * 22} size={11} mono fill={tok('muted')}>{`for ${l}`}</T>
            </Box>
          ))}
          <Box x={20 + (r.loops.length - 1) * 16} y={r.y + 60} w={164 - (r.loops.length - 1) * 32} h={26} fill={tok('brand', 0.12)} stroke={tok('brand')}>
            <T x={102} y={r.y + 73} size={11} mono anchor="middle">{r.push}</T>
          </Box>
          <T x={214} y={r.y + 16} size={11} fill={tok('muted')}>size =</T>
          <T x={214} y={r.y + 34} size={12} mono>{r.formula}</T>
          <Box x={214} y={r.y + 48} w={182} h={26} fill={tok(r.color, 0.14)} stroke={tok(r.color)}>
            <T x={305} y={r.y + 61} size={13} weight={700} anchor="middle">{r.verdict}</T>
          </Box>
          <T x={214} y={r.y + 88} size={11} fill={tok('muted')}>{r.why}</T>
        </g>
      ))}
    </Svg>
  );
}
