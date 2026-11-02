import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

type Step = { label: string; kind: 'compile' | 'interpret' | 'data' };
const ROWS: { name: string; steps: Step[] }[] = [
  { name: 'Drip tree-walker (Part III)', steps: [{ label: 'tree', kind: 'data' }, { label: 'interpret', kind: 'interpret' }, { label: 'output', kind: 'data' }] },
  { name: 'tsc, then Node', steps: [{ label: 'TS', kind: 'data' }, { label: 'compile', kind: 'compile' }, { label: 'JS', kind: 'data' }] },
  { name: 'Drip VM (Part IV)', steps: [{ label: 'source', kind: 'data' }, { label: 'compile', kind: 'compile' }, { label: 'bytecode', kind: 'data' }, { label: 'interpret', kind: 'interpret' }] },
  { name: 'V8', steps: [{ label: 'bytecode', kind: 'data' }, { label: 'interpret', kind: 'interpret' }, { label: 'compile hot', kind: 'compile' }, { label: 'machine', kind: 'data' }] },
];

const W = 84;
const GAP = 14;

/** Four real systems, each a mix of compiling (blue) and interpreting (orange). */
export default function WhoRunsWhat() {
  return (
    <Svg w={400} h={276} title="Four rows. Drip's tree-walker interprets a tree. tsc compiles TypeScript to JavaScript. Drip's VM compiles source to bytecode, then interprets it. V8 interprets bytecode, then compiles hot code to machine code.">
      {ROWS.map((r, i) => {
        const y = 8 + i * 62;
        return (
          <g key={r.name}>
            <T x={6} y={y + 6} size={12} weight={700} fill={tok('muted')}>{r.name}</T>
            {r.steps.map((st, k) => {
              const x = 6 + k * (W + GAP);
              const col = st.kind === 'compile' ? 'brand' : st.kind === 'interpret' ? 'accent' : 'ink';
              const data = st.kind === 'data';
              return (
                <g key={k}>
                  <Box x={x} y={y + 18} w={W} h={30} r={data ? 14 : 6} fill={data ? tok('panel') : tok(col, 0.14)} stroke={data ? tok('ink', 0.4) : tok(col)}>
                    <T x={x + W / 2} y={y + 33} size={12} weight={data ? 400 : 700} anchor="middle">{st.label}</T>
                  </Box>
                  {k < r.steps.length - 1 && <Arrow x1={x + W + 1} y1={y + 33} x2={x + W + GAP - 1} y2={y + 33} width={1.5} color={tok('ink', 0.5)} />}
                </g>
              );
            })}
          </g>
        );
      })}
      <Box x={6} y={256} w={14} h={12} r={3} fill={tok('brand', 0.14)} stroke={tok('brand')} />
      <T x={26} y={262} size={11} fill={tok('muted')}>compiles</T>
      <Box x={96} y={256} w={14} h={12} r={3} fill={tok('accent', 0.14)} stroke={tok('accent')} />
      <T x={116} y={262} size={11} fill={tok('muted')}>interprets</T>
    </Svg>
  );
}
