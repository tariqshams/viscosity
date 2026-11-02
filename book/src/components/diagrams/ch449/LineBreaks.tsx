import { Box, Svg, T, tok } from '../../viz/svg';

// Chapter 449: the line terminators ECMAScript counts, and so the ones
// LineIndex in crates/frontend-js/src/lines.rs records: \n, \r not
// followed by \n, \r\n (one break, recorded after the \n), U+2028 and
// U+2029. Each new line starts just after its break.
const ROWS: { text: string; brk: string; note: string }[] = [
  { text: 'let a;', brk: '\\n', note: 'line feed' },
  { text: 'let b;', brk: '\\r\\n', note: 'one break, not two' },
  { text: 'let c;', brk: '\\r', note: 'a lone carriage return' },
  { text: 'let d;', brk: 'U+2028', note: 'line separator' },
  { text: 'let e = ;', brk: '', note: 'line 5' },
];

export default function LineBreaks() {
  return (
    <Svg w={400} h={200} title="Five lines separated by the four kinds of line break JavaScript counts">
      {ROWS.map((r, k) => {
        const y = 10 + k * 36;
        return (
          <g key={k}>
            <T x={10} y={y + 14} size={12} mono fill={tok('muted')}>{k + 1}</T>
            <Box x={28} y={y} w={90} h={28} r={3} fill={tok('panel')} stroke={tok('line')}>
              <T x={36} y={y + 14} size={12} mono>{r.text}</T>
            </Box>
            {r.brk && (
              <Box x={124} y={y} w={66} h={28} r={3} fill={tok('brand', 0.15)} stroke={tok('brand')}>
                <T x={157} y={y + 14} size={12} mono anchor="middle">{r.brk}</T>
              </Box>
            )}
            <T x={200} y={y + 14} size={12} fill={tok('muted')}>{r.note}</T>
          </g>
        );
      })}
    </Svg>
  );
}
