import { Box, Svg, T, tok } from '../../viz/svg';
import results from '../../../../../engine/ts/packages/bench/results/python-layouts-2026-10-31.json';

// Chapter 229: the committed CPython layout benchmark
// (packages/bench/e2e-py/layouts.py, results/python-layouts-2026-10-31.json).
// Time per element for one update loop, and memory for 100,000 records.
const r = results as {
  python: string; n: number;
  ns_per_element: { objects: number; typed_columns: number; list_columns: number };
  memory_bytes: { objects: number; typed_columns: number };
};

const TIME = [
  { label: 'dataclass objects', v: r.ns_per_element.objects, c: 'f1' },
  { label: 'list columns', v: r.ns_per_element.list_columns, c: 'f3' },
  { label: "array('d') columns", v: r.ns_per_element.typed_columns, c: 'f4' },
];
const MEM = [
  { label: 'dataclass objects', v: r.memory_bytes.objects / 1e6, c: 'f1' },
  { label: "array('d') columns", v: r.memory_bytes.typed_columns / 1e6, c: 'f4' },
];

function Bars({ y, title, rows, unit, digits }: { y: number; title: string; rows: { label: string; v: number; c: string }[]; unit: string; digits: number }) {
  const max = Math.max(...rows.map((x) => x.v));
  return (
    <g>
      <T x={8} y={y} size={11} weight={700}>{title}</T>
      {rows.map((x, k) => (
        <g key={x.label}>
          <T x={8} y={y + 22 + k * 30} size={11}>{x.label}</T>
          <Box x={140} y={y + 12 + k * 30} w={Math.max(4, (x.v / max) * 190)} h={20} fill={tok(x.c, 0.5)} stroke={tok(x.c)} r={3} />
          <T x={146 + (x.v / max) * 190} y={y + 22 + k * 30} size={11} mono>{x.v.toFixed(digits)} {unit}</T>
        </g>
      ))}
    </g>
  );
}

export default function PyLayoutBars() {
  return (
    <Svg w={400} h={210} title={`CPython ${r.python}, ${r.n} elements: time per element and memory for objects and columns`}>
      <Bars y={12} title="Update loop, ns per element (lower is better)" rows={TIME} unit="ns" digits={1} />
      <Bars y={128} title={`Memory for ${r.n.toLocaleString('en')} records (lower is better)`} rows={MEM} unit="MB" digits={1} />
    </Svg>
  );
}
