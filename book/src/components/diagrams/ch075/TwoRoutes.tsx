// Chapter 75: two routes from source to running code. Part III's
// tree-walker builds a full token list and a whole syntax tree; the
// bytecode compiler (companion/ts/src/vm/compiler.ts with the on-demand
// scanner in vm/scanner.ts) holds two tokens at a time and writes bytes
// straight into the chunk, so no tree ever exists.
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

type B = { l1: string; l2: string; kind: 'src' | 'mem' | 'out' };
const ROWS: { title: string; boxes: B[] }[] = [
  { title: 'PART III: SCAN, PARSE, WALK', boxes: [
    { l1: 'source', l2: 'text', kind: 'src' },
    { l1: 'every token', l2: 'in a list', kind: 'mem' },
    { l1: 'the whole', l2: 'syntax tree', kind: 'mem' },
    { l1: 'walk the tree', l2: 'to run it', kind: 'out' },
  ] },
  { title: 'PART IV: ONE PASS', boxes: [
    { l1: 'source', l2: 'text', kind: 'src' },
    { l1: 'two tokens', l2: 'at a time', kind: 'mem' },
    { l1: 'bytes in', l2: 'the chunk', kind: 'out' },
    { l1: 'the VM', l2: 'runs them', kind: 'out' },
  ] },
];
const BX = [8, 106, 204, 302];
const BW = 90;

export default function TwoRoutes() {
  return (
    <Svg w={400} h={190} title="Two routes from source to running code. Part III: source, a list of every token, the whole syntax tree, then walking the tree. Part IV: source, two tokens at a time, bytes written straight into the chunk, then the VM runs them. No tree is built.">
      {ROWS.map((r, i) => {
        const y = 24 + i * 84;
        return (
          <g key={r.title}>
            <T x={8} y={y - 10} size={11} weight={700} fill={tok('muted')}>{r.title}</T>
            {r.boxes.map((b, k) => (
              <g key={k}>
                <Box x={BX[k]} y={y} w={BW} h={44} r={5}
                  fill={b.kind === 'mem' ? tok('accent', 0.12) : b.kind === 'out' ? tok('brand', 0.1) : tok('panel')}
                  stroke={b.kind === 'mem' ? tok('accent') : b.kind === 'out' ? tok('brand') : tok('line')} />
                <T x={BX[k] + BW / 2} y={y + 15} size={11} anchor="middle">{b.l1}</T>
                <T x={BX[k] + BW / 2} y={y + 30} size={11} anchor="middle">{b.l2}</T>
                {k < 3 && <Arrow x1={BX[k] + BW + 1} y1={y + 22} x2={BX[k + 1] - 1} y2={y + 22} width={1.5} />}
              </g>
            ))}
          </g>
        );
      })}
      <T x={8} y={182} size={11} fill={tok('muted')}>One pass holds only two tokens at a time, and never a tree.</T>
    </Svg>
  );
}
