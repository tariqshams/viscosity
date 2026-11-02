// Chapter 328: five collectors placed in the design space, from their
// own sources: V8's "Trash talk" and "Concurrent marking" posts; OpenJDK
// 21's G1 and ZGC barrier code; Go's runtime/mgc.go and mbarrier.go
// (go1.24.7); .NET's garbage-collection.md (Book of the Runtime).
import { Box, Svg, T, tok } from '../../viz/svg';

const COLS = ['generations', 'moves', 'concurrent', 'barriers'];
const ROWS: { n: string; c: [string, string][] }[] = [
  { n: 'V8', c: [['yes', 'young + old'], ['young: copy', 'old: few pages'], ['yes', 'concurrent'], ['write', 'Dijkstra']] },
  { n: 'G1', c: [['yes', ''], ['evacuates', 'in pauses'], ['yes', 'SATB'], ['write', 'SATB + cards']] },
  { n: 'ZGC', c: [['yes', 'Java 21 flag'], ['relocates', 'concurrently'], ['yes', ''], ['load + store', 'coloured ptrs']] },
  { n: 'Go', c: [['no', ''], ['no', 'size classes'], ['yes', ''], ['write', 'hybrid']] },
  { n: '.NET', c: [['yes', 'gen0/1/2'], ['compact', 'or sweep'], ['yes', 'background'], ['write', 'cards']] },
];
const X0 = 50;
const CW = 87;

export default function DesignSpace() {
  return (
    <Svg w={400} h={262} title="A table of five collectors: V8, G1, ZGC, Go and .NET, by generations, moving objects, marking while the program runs, and barriers.">
      {COLS.map((c, k) => (
        <T key={c} x={X0 + k * CW + CW / 2} y={16} size={11} weight={700} anchor="middle" fill={tok('muted')}>{c}</T>
      ))}
      {ROWS.map((r, i) => {
        const y = 30 + i * 46;
        return (
          <g key={r.n}>
            <T x={6} y={y + 21} size={12} weight={700}>{r.n}</T>
            {r.c.map(([a, b], k) => {
              const no = a === 'no';
              return (
                <Box key={k} x={X0 + k * CW + 2} y={y} w={CW - 4} h={40} r={4}
                  fill={no ? 'transparent' : tok('brand', 0.08)} stroke={no ? tok('line') : tok('brand', 0.6)} dash={no}>
                  <T x={X0 + k * CW + CW / 2} y={y + (b ? 14 : 20)} size={11} weight={700} anchor="middle">{a}</T>
                  {b && <T x={X0 + k * CW + CW / 2} y={y + 29} size={11} anchor="middle" fill={tok('muted')}>{b}</T>}
                </Box>
              );
            })}
          </g>
        );
      })}
    </Svg>
  );
}
