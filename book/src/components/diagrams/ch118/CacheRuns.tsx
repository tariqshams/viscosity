import { Box, Svg, T, tok } from '../../viz/svg';

// Chrome's cold, warm and hot runs, as described in the V8 blog post
// "Code caching for JavaScript developers" (2019, updated 2020).
const RUNS = [
  { name: 'cold run', lines: ['download script', 'parse + compile', 'store the file'], cache: false },
  { name: 'warm run', lines: ['file from cache', 'parse + compile', 'save bytecode too'], cache: true },
  { name: 'hot run', lines: ['file + bytecode', 'deserialize', 'skip compiling'], cache: true },
];

export default function CacheRuns() {
  return (
    <Svg w={400} h={170} title="Three visits to the same page. Cold run: download, parse and compile, store the file. Warm run: the file comes from the cache but is still compiled, and this time the compiled bytecode is saved next to it. Hot run: file and bytecode come from the cache, and compiling is skipped.">
      {RUNS.map((r, k) => {
        const x = 8 + k * 132;
        return (
          <g key={r.name}>
            <T x={x + 60} y={14} size={13} weight={700} anchor="middle" fill={k === 2 ? tok('safe') : tok('ink')}>{r.name}</T>
            {r.lines.map((l, j) => (
              <Box key={l} x={x} y={28 + j * 40} w={120} h={30} r={5}
                fill={(k === 2 && j > 0) ? tok('safe', 0.15) : (j === 1 ? tok('warn', 0.15) : tok('panel'))}
                stroke={(k === 2 && j > 0) ? tok('safe') : (j === 1 ? tok('warn') : tok('line'))}>
                <T x={x + 60} y={43 + j * 40} size={11} anchor="middle">{l}</T>
              </Box>
            ))}
            <T x={x + 60} y={160} size={10} anchor="middle" fill={tok('muted')}>visit {k + 1}</T>
          </g>
        );
      })}
    </Svg>
  );
}
