import { Box, Svg, T, tok } from '../../viz/svg';

// What happened to each function of lazy.js, read straight off
// `node --log-function-events` (Node v22.23.4, V8 12.4): which steps each
// one went through. `eager` was compiled but its first-execution event
// never appears, because nothing in the file calls it.
const COLS = ['preparse', 'full parse', 'bytecode', 'runs'];
const ROWS: { name: string; did: boolean[]; verdict: string; good: boolean }[] = [
  { name: 'used', did: [true, true, true, true], verdict: 'parsed twice', good: false },
  { name: 'unused', did: [true, false, false, false], verdict: 'cheap: right guess', good: true },
  { name: 'eager', did: [false, true, true, false], verdict: 'compiled, never run', good: false },
];

export default function TwoParses() {
  return (
    <Svg w={400} h={170} title="A table of three functions against four steps. used: preparsed, then fully parsed, compiled and run, so it was parsed twice. unused: only preparsed, the cheap right guess. eager: fully parsed and compiled straight away, but never run in this file.">
      {COLS.map((c, j) => (
        <T key={c} x={110 + j * 62} y={14} size={11} weight={700} anchor="middle" fill={tok('muted')}>{c}</T>
      ))}
      {ROWS.map((r, k) => {
        const y = 28 + k * 46;
        return (
          <g key={r.name}>
            <T x={8} y={y + 17} size={13} mono weight={700}>{r.name}</T>
            {r.did.map((d, j) => (
              <Box key={j} x={86 + j * 62} y={y} w={48} h={34} r={4}
                fill={d ? tok('brand', 0.15) : tok('panel')} stroke={d ? tok('brand') : tok('line')} dash={!d}>
                <T x={110 + j * 62} y={y + 17} size={13} anchor="middle" fill={d ? tok('brand') : tok('muted')}>{d ? 'yes' : '·'}</T>
              </Box>
            ))}
            <T x={8} y={y + 40} size={11} fill={r.good ? tok('safe') : tok('warn')}>{r.verdict}</T>
          </g>
        );
      })}
    </Svg>
  );
}
