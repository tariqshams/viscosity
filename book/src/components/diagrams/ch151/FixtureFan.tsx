import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// Chapter 151: what scripts/gen_expected.mjs writes for one program, and
// the totals in engine/rust/tests/expected (counted with ls on the repo:
// 95 programs, 4 files each, plus 14 --frames and 4 x 2 --profile files,
// 402 files in all).
const FILES: [string, string, number][] = [
  ['p.js', 'default: code', 0],
  ['p.explain.txt', 'default: explain', 1],
  ['p.assume.js', 'assume: code', 2],
  ['p.assume.explain.txt', 'assume: explain', 3],
];

export default function FixtureFan() {
  return (
    <Svg w={400} h={250} title="One program becomes four fixture files: code and explain text, for the default options and for bounds assume">
      <Box x={20} y={95} w={92} h={44} fill={tok('brand', 0.12)} stroke={tok('brand')}>
        <T x={66} y={110} size={12} mono anchor="middle">p.js</T>
        <T x={66} y={128} size={11} anchor="middle" fill={tok('muted')}>one program</T>
      </Box>
      {FILES.map(([name, what, k]) => {
        const y = 14 + k * 56;
        return (
          <g key={name}>
            <Arrow x1={114} y1={117} x2={176} y2={y + 20} color={tok('ink', 0.4)} width={1.5} />
            <Box x={180} y={y} w={206} h={40} fill={k < 2 ? tok('panel') : tok('accent', 0.1)} stroke={k < 2 ? tok('line') : tok('accent')}>
              <T x={192} y={y + 13} size={12} mono>{name}</T>
              <T x={192} y={y + 29} size={11} fill={tok('muted')}>{what}</T>
            </Box>
          </g>
        );
      })}
      <T x={200} y={240} size={11} anchor="middle" fill={tok('muted')}>95 programs × 4 = 380 files, + 14 frames + 8 profile = 402</T>
    </Svg>
  );
}
