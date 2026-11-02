import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// How a bug found by random testing becomes a permanent corpus case, as it
// happened in the repository (engine/rust/README.md, "Bugs found by
// fuzzing"): about 8,000 random programs found five bugs, each fixed in both
// engines and given a corpus program, such as write_rhs_first.js.
const BOXES = [
  { x: 8, y: 10, t: 'the fuzzer', s: ['seeded random programs,', 'two oracles'], c: 'accent' },
  { x: 208, y: 10, t: 'a failing program', s: ['shrunk to the few lines', 'that still fail'], c: 'warn' },
  { x: 208, y: 128, t: 'a new corpus file', s: ['write_rhs_first.js:', 'one idea, a header'], c: 'brand' },
  { x: 8, y: 128, t: 'generated tests', s: ['decision, behaviour,', 'parsers, Rust fixtures'], c: 'safe' },
];

export default function FindToFile() {
  const w = 184;
  const h = 76;
  return (
    <Svg w={400} h={222} title="A cycle: the fuzzer finds a failing program, it is shrunk, it becomes a corpus file, the corpus generates tests for ever after, and the fuzzer keeps looking for the next case">
      {BOXES.map((b) => (
        <Box key={b.t} x={b.x} y={b.y} w={w} h={h} fill={tok(b.c, 0.1)} stroke={tok(b.c)}>
          <T x={b.x + 12} y={b.y + 20} size={13} weight={700}>{b.t}</T>
          <T x={b.x + 12} y={b.y + 42} size={11} fill={tok('muted')}>{b.s[0]}</T>
          <T x={b.x + 12} y={b.y + 58} size={11} fill={tok('muted')}>{b.s[1]}</T>
        </Box>
      ))}
      <Arrow x1={192} y1={48} x2={206} y2={48} />
      <Arrow x1={300} y1={86} x2={300} y2={126} />
      <Arrow x1={208} y1={166} x2={194} y2={166} />
      <Arrow x1={100} y1={128} x2={100} y2={88} />
      <T x={200} y={214} size={11} anchor="middle" fill={tok('muted')}>the corpus keeps old bugs found; the fuzzer looks for new ones</T>
    </Svg>
  );
}
