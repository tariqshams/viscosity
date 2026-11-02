import { Box, Svg, T, tok } from '../../viz/svg';

// "Parsing arguments by hand": the four kinds of word on one command line,
// as parse_args in engine/rust/crates/cli/src/main.rs sorts them.
const WORDS: { w: string; k: 'cmd' | 'file' | 'opt' | 'val' | 'flag' }[] = [
  { w: 'build', k: 'cmd' },
  { w: 'a.js', k: 'file' },
  { w: '-o', k: 'opt' },
  { w: 'out/', k: 'val' },
  { w: '--frames', k: 'flag' },
  { w: 'b.js', k: 'file' },
];
const COL = { cmd: 'accent', file: 'safe', opt: 'brand', val: 'brand', flag: 'warn' } as const;
const WID = [48, 40, 26, 40, 72, 40];
const xs = WID.map((_, k) => 8 + WID.slice(0, k).reduce((a, w) => a + w + 6, 0));

export default function WordKinds() {
  return (
    <Svg w={400} h={200} title="The words of a command line sorted into a command, files, an option with its value, and a flag">
      <T x={8} y={14} size={11} mono fill={tok('muted')}>$ viscosity build a.js -o out/ --frames b.js</T>
      {WORDS.map((x, k) => (
        <Box key={k} x={xs[k]} y={30} w={WID[k]} h={28} r={4} fill={tok(COL[x.k], 0.15)} stroke={tok(COL[x.k])}>
          <T x={xs[k] + WID[k] / 2} y={44} size={12} mono anchor="middle">{x.w}</T>
        </Box>
      ))}
      <path d={`M${xs[2] + 4},64 L${xs[2] + 4},70 L${xs[3] + WID[3] - 4},70 L${xs[3] + WID[3] - 4},64`} fill="none" stroke={tok('brand')} strokeWidth={1.5} />
      <T x={(xs[2] + xs[3] + WID[3]) / 2} y={82} size={11} anchor="middle" fill={tok('brand')}>one option</T>
      {[
        { c: 'accent', t: 'command: the first word, checked later by run()' },
        { c: 'safe', t: 'file: any word that does not start with -' },
        { c: 'brand', t: 'option: a flag that takes the next word' },
        { c: 'warn', t: 'flag: a switch, on if present' },
      ].map((l, k) => (
        <g key={l.c}>
          <rect x={8} y={104 + k * 24} width={14} height={14} rx={3} fill={tok(l.c, 0.3)} stroke={tok(l.c)} />
          <T x={30} y={111 + k * 24} size={12}>{l.t}</T>
        </g>
      ))}
    </Svg>
  );
}
