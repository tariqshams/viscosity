import { Box, Svg, T, tok } from '../../viz/svg';

// Three values of enum Value { None, Bool(bool), Number(f64) }, drawn as
// the classic tag-plus-payload layout from "Sum types in memory": a small
// tag saying which variant, then room for the largest payload.

const ROWS = [
  { label: 'Value::None', tag: 'None', pay: '', used: 0 },
  { label: 'Value::Bool(true)', tag: 'Bool', pay: 'true', used: 0.2 },
  { label: 'Value::Number(2.5)', tag: 'Number', pay: '2.5', used: 1 },
];

export default function EnumLayout() {
  const payW = 200;
  return (
    <Svg w={400} h={200} title="Three values of an enum, each a tag followed by room for the largest payload">
      <T x={150} y={12} size={11} weight={700} fill={tok('muted')}>TAG</T>
      <T x={214} y={12} size={11} weight={700} fill={tok('muted')}>PAYLOAD (room for an f64)</T>
      {ROWS.map((r, i) => {
        const y = 24 + i * 50;
        return (
          <g key={r.label}>
            <T x={4} y={y + 16} size={11} mono>{r.label}</T>
            <Box x={142} y={y} w={56} h={32} r={3} fill={tok('accent', 0.18)} stroke={tok('accent')}>
              <T x={170} y={y + 16} size={11} mono weight={700} anchor="middle">{r.tag}</T>
            </Box>
            <Box x={200} y={y} w={payW} h={32} r={3} fill="transparent" stroke={tok('line')} dash />
            {r.used > 0 && (
              <Box x={200} y={y} w={payW * r.used} h={32} r={3} fill={tok('f1', 0.18)} stroke={tok('f1')}>
                <T x={200 + (payW * r.used) / 2} y={y + 16} size={12} mono anchor="middle">{r.pay}</T>
              </Box>
            )}
            {r.used === 0 && <T x={300} y={y + 16} size={11} anchor="middle" fill={tok('muted')}>unused</T>}
            {r.used > 0 && r.used < 1 && <T x={320} y={y + 16} size={11} anchor="middle" fill={tok('muted')}>unused</T>}
          </g>
        );
      })}
      <T x={4} y={184} size={12}>Every Value is the same size: 16 bytes on this machine.</T>
    </Svg>
  );
}
