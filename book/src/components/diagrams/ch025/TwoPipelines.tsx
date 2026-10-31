import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

type Cell = { x: number; w: number; label: string; sub?: string; kind: 'data' | 'front' | 'mid' | 'back' };

const COL: Record<Cell['kind'], string> = { data: 'ink', front: 'brand', mid: 'warn', back: 'accent' };

function Row({ y, title, cells }: { y: number; title: string; cells: Cell[] }) {
  return (
    <g>
      <T x={8} y={y} size={12} weight={700} fill={tok('muted')}>{title}</T>
      {cells.map((c, k) => {
        const col = COL[c.kind];
        const data = c.kind === 'data';
        return (
          <g key={k}>
            <Box x={c.x} y={y + 14} w={c.w} h={46} r={data ? 14 : 6} fill={data ? tok('panel') : tok(col, 0.12)} stroke={data ? tok('ink', 0.4) : tok(col)}>
              <T x={c.x + c.w / 2} y={y + (c.sub ? 31 : 37)} size={12} weight={700} anchor="middle">{c.label}</T>
              {c.sub && <T x={c.x + c.w / 2} y={y + 47} size={9} anchor="middle" fill={tok('muted')}>{c.sub}</T>}
            </Box>
            {k < cells.length - 1 && <Arrow x1={c.x + c.w + 1} y1={y + 37} x2={cells[k + 1].x - 1} y2={y + 37} width={1.5} color={tok('ink', 0.5)} />}
          </g>
        );
      })}
    </g>
  );
}

/** Drip's tree-walker and Viscosity side by side: the same front end / back end split. */
export default function TwoPipelines() {
  return (
    <Svg w={400} h={222} title="Two pipelines. Drip: Drip source, front end (scan, parse, resolve), syntax tree, back end (tree-walker), output. Viscosity: JavaScript source, front end (parse, lower), VIR, middle (analyses, layout planner), back end (emit), JavaScript source with typed arrays.">
      <Row y={12} title="DRIP (PART III)" cells={[
        { x: 6, w: 58, label: 'Drip', sub: 'source', kind: 'data' },
        { x: 78, w: 92, label: 'front end', sub: 'scan · parse', kind: 'front' },
        { x: 184, w: 52, label: 'tree', kind: 'data' },
        { x: 250, w: 82, label: 'back end', sub: 'tree-walker', kind: 'back' },
        { x: 346, w: 48, label: 'output', kind: 'data' },
      ]} />
      <Row y={104} title="VISCOSITY (PLANNED)" cells={[
        { x: 4, w: 36, label: 'JS', sub: 'source', kind: 'data' },
        { x: 50, w: 78, label: 'front end', sub: 'parse · lower', kind: 'front' },
        { x: 138, w: 36, label: 'VIR', kind: 'data' },
        { x: 184, w: 78, label: 'middle', sub: 'analyse · plan', kind: 'mid' },
        { x: 272, w: 64, label: 'back end', sub: 'emit', kind: 'back' },
        { x: 346, w: 48, label: 'JS', sub: 'SoA', kind: 'data' },
      ]} />
      <T x={200} y={204} size={12} anchor="middle" fill={tok('muted')}>Same shape. Viscosity’s output is a program, not an answer.</T>
    </Svg>
  );
}
