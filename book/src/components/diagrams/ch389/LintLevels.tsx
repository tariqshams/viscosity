import { Box, Svg, T, tok } from '../../viz/svg';

// Chapter 388b: clippy's lint categories and default levels, from the
// rust-clippy README's table (correctness deny; suspicious, style,
// complexity, perf warn; pedantic, restriction, nursery, cargo allow).
const ROWS: [string, string, 'deny' | 'warn' | 'allow'][] = [
  ['correctness', 'outright wrong or useless', 'deny'],
  ['suspicious', 'most likely wrong', 'warn'],
  ['style', 'could be more idiomatic', 'warn'],
  ['complexity', 'simple thing done a hard way', 'warn'],
  ['perf', 'could run faster', 'warn'],
  ['pedantic', 'strict, some false alarms', 'allow'],
  ['restriction', 'bans features (pick singly)', 'allow'],
  ['nursery', 'still in development', 'allow'],
  ['cargo', 'about Cargo.toml', 'allow'],
];
const COL = { deny: 'danger', warn: 'warn', allow: 'muted' } as const;

export default function LintLevels() {
  return (
    <Svg w={400} h={262} title="Clippy's nine lint groups, each with its default level: deny, warn or allow">
      {ROWS.map(([g, d, lvl], k) => (
        <g key={g}>
          <Box x={8} y={8 + k * 28} w={384} h={24} r={3} fill={tok(COL[lvl], 0.1)} stroke={tok(COL[lvl], 0.6)}>
            <T x={16} y={20 + k * 28} size={11} mono weight={700}>{g}</T>
            <T x={112} y={20 + k * 28} size={11}>{d}</T>
            <T x={384} y={20 + k * 28} size={11} mono anchor="end" fill={tok(COL[lvl])}>{lvl}</T>
          </Box>
        </g>
      ))}
    </Svg>
  );
}
