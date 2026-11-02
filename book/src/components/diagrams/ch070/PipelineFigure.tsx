// Chapter 70 (second half): where each kind of Drip error is found. The
// scanner and parser find syntax errors; the resolver checks the static
// rules; both are compile errors, so nothing runs. Only the interpreter
// finds runtime errors, part-way through running.
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const STAGES = [
  { name: 'scanner', finds: ['unexpected character', 'unterminated string'], kind: 'compile' },
  { name: 'parser', finds: ["expected ';' ...", 'cannot assign ...'], kind: 'compile' },
  { name: 'resolver', finds: ['already declared', "'return' outside"], kind: 'compile' },
  { name: 'interpreter', finds: ['cannot add ...', 'stack overflow'], kind: 'runtime' },
];

export default function PipelineFigure() {
  const rowH = 52;
  return (
    <Svg w={400} h={STAGES.length * rowH + 52} title="The four stages of running a Drip program, top to bottom: scanner, parser, resolver and interpreter. The first three find compile errors, which stop the program before anything runs, with exit code 65. The interpreter finds runtime errors while the program is running, with exit code 70.">
      <T x={6} y={10} size={11} weight={700} fill={tok('muted')}>STAGE</T>
      <T x={148} y={10} size={11} weight={700} fill={tok('muted')}>FINDS, FOR EXAMPLE</T>
      {STAGES.map((s, i) => {
        const y = 22 + i * rowH;
        const rt = s.kind === 'runtime';
        const c = rt ? tok('warn') : tok('brand');
        return (
          <g key={s.name}>
            <Box x={6} y={y} w={120} h={36} fill={rt ? tok('warn', 0.08) : tok('brand', 0.08)} stroke={c}>
              <T x={66} y={y + 18} size={12.5} mono anchor="middle" weight={700}>{s.name}</T>
            </Box>
            {i < STAGES.length - 1 && <Arrow x1={66} y1={y + 36} x2={66} y2={y + rowH} />}
            <T x={148} y={y + 10} size={11.5} mono>{s.finds[0]}</T>
            <T x={148} y={y + 27} size={11.5} mono>{s.finds[1]}</T>
          </g>
        );
      })}
      <line x1={138} x2={138} y1={22} y2={22 + 3 * rowH - 16} stroke={tok('brand')} strokeWidth={2} />
      <T x={396} y={22 + 1.5 * rowH - 8} size={11} anchor="end" fill={tok('brand')} weight={700}>compile errors:</T>
      <T x={396} y={22 + 1.5 * rowH + 8} size={11} anchor="end" fill={tok('brand')}>nothing runs,</T>
      <T x={396} y={22 + 1.5 * rowH + 24} size={11} anchor="end" fill={tok('brand')}>exit 65</T>
      <T x={6} y={22 + STAGES.length * rowH + 14} size={11.5} fill={tok('warn')}>runtime errors: the program stops part-way, exit code 70</T>
    </Svg>
  );
}
