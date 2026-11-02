// Chapter 106 (second half): one moment of a Drip program (inside area,
// called from report, called from the script), seen three ways: the
// TypeScript methods on the host stack, grouped by the Drip call they run
// for, and the one small entry per call in the interpreter's frames array.
import { Box, Svg, T, tok } from '../../viz/svg';

const GROUPS: { call: string; line: number; methods: string[] }[] = [
  { call: 'fn area', line: 2, methods: ['evaluate (w * h)', 'execute (return)', 'executeBlock', 'callFunction'] },
  { call: 'fn report', line: 5, methods: ['call', 'evaluate (the call)', 'execute (print)', 'executeBlock', 'callFunction'] },
  { call: 'script', line: 7, methods: ['call', 'evaluate (the call)', 'execute', 'interpret'] },
];

export default function HostFrames() {
  const rowH = 17;
  let y = 30;
  const parts = GROUPS.map((g) => {
    const top = y;
    y += g.methods.length * rowH + 10;
    return { ...g, top, h: g.methods.length * rowH };
  });
  return (
    <Svg w={400} h={y + 4} title="On the left, the TypeScript methods on the host stack, newest on top, grouped into the Drip call each group is running: four or five methods per call. On the right, the frames array with one entry per Drip call: fn area at line 2, fn report at line 5, script at line 7.">
      <T x={6} y={12} size={11} weight={700} fill={tok('muted')}>HOST STACK (TypeScript methods)</T>
      <T x={262} y={12} size={11} weight={700} fill={tok('muted')}>FRAMES ARRAY</T>
      {parts.map((g, i) => (
        <g key={g.call}>
          <Box x={6} y={g.top - 4} w={196} h={g.h + 8} fill={i === 0 ? tok('brand', 0.06) : 'transparent'} stroke={i === 0 ? tok('brand') : tok('ink', 0.35)}>
            {g.methods.map((m, j) => (
              <T key={m} x={16} y={g.top + j * rowH + 8} size={11.5} mono>{m}</T>
            ))}
          </Box>
          <line x1={204} x2={258} y1={g.top + g.h / 2} y2={g.top + g.h / 2} stroke={tok('ink', 0.4)} strokeDasharray="4 3" />
          <Box x={260} y={g.top + g.h / 2 - 17} w={134} h={34} fill={i === 0 ? tok('brand', 0.08) : tok('panel')} stroke={i === 0 ? tok('brand') : tok('ink', 0.4)}>
            <T x={270} y={g.top + g.h / 2 - 5} size={12} mono weight={700}>{g.call}</T>
            <T x={270} y={g.top + g.h / 2 + 9} size={11} mono fill={tok('muted')}>{`line ${g.line}`}</T>
          </Box>
        </g>
      ))}
    </Svg>
  );
}
