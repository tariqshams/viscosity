import { Box, Svg, T, tok } from '../../viz/svg';

/** A Map as a two-column table whose keys can be any value. */
export default function MapTable() {
  const rows = [
    { k: "'ada'", v: '36', note: 'a string' },
    { k: '7', v: "'seven'", note: 'a number' },
    { k: '{ id: 1 }', v: '100', note: 'an object (by identity)' },
  ];
  return (
    <Svg w={400} h={170} title="A Map drawn as a table with a key column and a value column. The keys are a string, a number and an object.">
      <T x={12} y={14} size={11} weight={700} fill={tok('muted')}>KEY</T>
      <T x={170} y={14} size={11} weight={700} fill={tok('muted')}>VALUE</T>
      <T x={280} y={14} size={11} weight={700} fill={tok('muted')}>KEY TYPE</T>
      {rows.map((r, i) => (
        <g key={r.k}>
          <Box x={8} y={26 + i * 46} w={150} h={38} fill={tok('accent', 0.1)} stroke={tok('accent')}>
            <T x={20} y={45 + i * 46} size={14} mono>{r.k}</T>
          </Box>
          <T x={162} y={45 + i * 46} size={14} fill={tok('muted')}>→</T>
          <Box x={172} y={26 + i * 46} w={96} h={38} fill={tok('panel')} stroke={tok('ink', 0.45)}>
            <T x={184} y={45 + i * 46} size={14} mono>{r.v}</T>
          </Box>
          <T x={280} y={45 + i * 46} size={12} fill={tok('muted')}>{r.note}</T>
        </g>
      ))}
    </Svg>
  );
}
