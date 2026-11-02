import { Box, Svg, T, tok } from '../../viz/svg';

// Chapter 390: an inverted index for three files (a.txt "the red fox",
// b.txt "the red hen", c.txt "a blue fox"), as built by the chapter's
// index_text and merge (BTreeMap keys sorted), and the query "red fox".
const ROWS: [string, string[]][] = [
  ['a', ['c']], ['blue', ['c']], ['fox', ['a', 'c']], ['hen', ['b']], ['red', ['a', 'b']], ['the', ['a', 'b']],
];

export default function IndexShape() {
  return (
    <Svg w={400} h={236} title="Six words, each with the sorted set of files that contain it; the query red fox keeps only a.txt">
      <T x={8} y={14} size={11} weight={700} fill={tok('muted')}>word</T>
      <T x={120} y={14} size={11} weight={700} fill={tok('muted')}>files</T>
      {ROWS.map(([w, fs], k) => {
        const hit = w === 'red' || w === 'fox';
        return (
          <g key={w}>
            <Box x={8} y={24 + k * 28} w={100} h={24} r={3} fill={hit ? tok('f1', 0.18) : tok('panel')} stroke={hit ? tok('f1') : tok('line')}>
              <T x={16} y={36 + k * 28} size={12} mono>{w}</T>
            </Box>
            {fs.map((f, j) => (
              <Box key={f} x={120 + j * 70} y={24 + k * 28} w={62} h={24} r={3} fill={hit && f === 'a' ? tok('safe', 0.2) : tok('panel')} stroke={hit && f === 'a' ? tok('safe') : tok('line')}>
                <T x={151 + j * 70} y={36 + k * 28} size={11} mono anchor="middle">{f}.txt</T>
              </Box>
            ))}
          </g>
        );
      })}
      <Box x={8} y={196} w={384} h={32} r={4} fill={tok('safe', 0.1)} stroke={tok('safe')}>
        <T x={16} y={212} size={11} mono>search("red fox") = {'{a,b}'} ∩ {'{a,c}'} = [a.txt]</T>
      </Box>
    </Svg>
  );
}
