import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const WORDS: { w: string; hit: string | null }[] = [
  { w: 'if', hit: 'if' },
  { w: 'iffy', hit: null },
  { w: 'while', hit: 'while' },
  { w: 'format', hit: null },
  { w: 'total', hit: null },
];

/** Scan the whole word first, then ask the table once. */
export default function KeywordLookup() {
  return (
    <Svg w={400} h={234} title="Five whole words looked up in the keyword table. if and while are found and become keyword tokens; iffy, format and total are not found and become identifiers.">
      <T x={6} y={12} size={11} weight={700} fill={tok('muted')}>WHOLE WORD</T>
      <T x={150} y={12} size={11} weight={700} fill={tok('muted')}>KEYWORDS.get(word)</T>
      <T x={300} y={12} size={11} weight={700} fill={tok('muted')}>TOKEN TYPE</T>
      {WORDS.map((x, k) => {
        const y = 26 + k * 40;
        const kw = x.hit !== null;
        return (
          <g key={x.w}>
            <Box x={6} y={y} w={100} h={28} r={5} fill={tok('panel')} stroke={tok('ink', 0.45)}>
              <T x={56} y={y + 14} size={14} mono weight={700} anchor="middle">{x.w}</T>
            </Box>
            <Arrow x1={108} y1={y + 14} x2={146} y2={y + 14} width={1.5} />
            <T x={150} y={y + 14} size={13} mono fill={kw ? tok('brand') : tok('muted')}>{kw ? `'${x.hit}'` : 'undefined'}</T>
            <Arrow x1={256} y1={y + 14} x2={294} y2={y + 14} width={1.5} />
            <Box x={296} y={y} w={98} h={28} r={5} fill={kw ? tok('brand', 0.14) : tok('accent', 0.12)} stroke={kw ? tok('brand') : tok('accent')}>
              <T x={345} y={y + 14} size={13} mono weight={700} anchor="middle">{kw ? `'${x.hit}'` : 'identifier'}</T>
            </Box>
          </g>
        );
      })}
      <T x={200} y={228} size={11} anchor="middle" fill={tok('muted')}>not found? ?? falls back to 'identifier'</T>
    </Svg>
  );
}
