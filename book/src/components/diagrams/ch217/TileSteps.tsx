// Chapter 217: an 8 x 8 transpose b[j][i] = a[i][j], counting the cache
// misses on b in a toy cache of 4 lines of 4 numbers (least recently used
// line thrown out). Untiled, every write misses; in 4 x 4 tiles, only the
// first write to each line in each tile does.
import { StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

const N = 8;
const LINE = 4;
const CAP = 4;

function order(tiled: boolean): [number, number][] {
  const out: [number, number][] = [];
  if (!tiled) {
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) out.push([i, j]);
  } else {
    for (let ii = 0; ii < N; ii += 4) for (let jj = 0; jj < N; jj += 4)
      for (let i = ii; i < ii + 4; i++) for (let j = jj; j < jj + 4; j++) out.push([i, j]);
  }
  return out;
}

function run(tiled: boolean, upto: number) {
  const cache: string[] = [];
  let misses = 0;
  const written = new Set<string>();
  order(tiled).slice(0, upto).forEach(([i, j]) => {
    const line = `${j}:${Math.floor(i / LINE)}`;
    const k = cache.indexOf(line);
    if (k >= 0) cache.splice(k, 1);
    else {
      misses++;
      if (cache.length === CAP) cache.shift();
    }
    cache.push(line);
    written.add(`${i},${j}`);
  });
  return { cache, misses, written };
}

type S = { tiled: boolean; upto: number; tile?: [number, number]; note: string };

const STATES: S[] = [
  { tiled: false, upto: 0, note: 'b is an 8 × 8 grid stored row by row; a cache line holds 4 numbers (half a row of b), and the toy cache holds 4 lines. The untiled loop writes b down its columns: b[j][i] for j = 0 to 7, then the next i.' },
  { tiled: false, upto: 8, note: 'i = 0: eight writes down column 0 touch eight different lines. Each misses, and the cache can only keep the last four (outlined).' },
  { tiled: false, upto: 16, note: 'i = 1: column 1 lives in the same lines as column 0, but the first four were thrown out to make room for the last four, and so on round. Another 8 misses: 16 so far.' },
  { tiled: false, upto: 64, note: 'Untiled, all 64 writes miss: each line is fetched again for every one of its 4 numbers.' },
  { tiled: true, upto: 16, tile: [0, 0], note: 'Now in 4 × 4 tiles. The first tile writes columns 0 to 3 of rows 0 to 3: only 4 lines, which fit in the cache, so each misses once and then is reused 3 times. 4 misses.' },
  { tiled: true, upto: 32, tile: [0, 4], note: 'The next tile covers rows 4 to 7 of the same columns: 4 new lines, 4 misses. 8 so far.' },
  { tiled: true, upto: 64, tile: [4, 4], note: 'All four tiles: 16 misses instead of 64, for exactly the same 64 writes. Each line is fetched once and used for all 4 of its numbers.' },
];

const C = 24;
const X0 = 30;
const Y0 = 34;

export default function TileSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const r = run(st.tiled, st.upto);
  return (
    <StepFrame title="Cache misses on b, untiled and tiled" steps={s} note={st.note}>
      <Svg w={400} h={240} title="The 8 by 8 grid b, with written cells shaded and cached lines outlined, and a miss count">
        <T x={X0} y={14} size={11} weight={700} fill={tok('muted')}>b: row j, column i</T>
        {Array.from({ length: N * N }, (_, k) => {
          const j = Math.floor(k / N);
          const i = k % N;
          const w = r.written.has(`${i},${j}`);
          return <rect key={k} x={X0 + i * C} y={Y0 + j * C} width={C - 2} height={C - 2} rx={3}
            fill={w ? tok('brand', 0.35) : tok('panel')} stroke={tok('line')} strokeWidth={1} />;
        })}
        {r.cache.map((ln) => {
          const [j, h] = ln.split(':').map(Number);
          return <rect key={ln} x={X0 + h * LINE * C - 1} y={Y0 + j * C - 1} width={LINE * C} height={C} rx={4}
            fill="none" stroke={tok('accent')} strokeWidth={2.2} />;
        })}
        {st.tile && (
          <rect x={X0 + st.tile[0] * C - 3} y={Y0 + st.tile[1] * C - 3} width={4 * C + 4} height={4 * C + 4} rx={5}
            fill="none" stroke={tok('brand')} strokeWidth={1.5} strokeDasharray="5 4" />
        )}
        <Box x={244} y={34} w={150} h={96} r={6} fill={tok('panel')} stroke={tok('line')}>
          <T x={254} y={52} size={12} weight={700}>{st.tiled ? 'tiled (4 × 4)' : 'untiled'}</T>
          <T x={254} y={76} size={12}>writes: <tspan className="mono">{st.upto}</tspan></T>
          <T x={254} y={98} size={12}>misses: <tspan className="mono" fontWeight={700}>{r.misses}</tspan></T>
          <T x={254} y={118} size={11} fill={tok('muted')}>cache: 4 lines</T>
        </Box>
        <T x={244} y={150} size={11} fill={tok('accent')}>outlined: lines in cache</T>
        <T x={244} y={168} size={11} fill={tok('brand')}>shaded: written so far</T>
      </Svg>
    </StepFrame>
  );
}
