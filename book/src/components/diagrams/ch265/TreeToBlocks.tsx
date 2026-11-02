import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// Chapter 265: how lower.ts turns a ForStatement (one tree node with four
// children) into blocks: the init is lowered in the current block, then
// loop() makes head, body, cont and exit (frontend-js/src/lower.ts).
export default function TreeToBlocks() {
  const L = 8;
  const R = 214;
  return (
    <Svg w={400} h={310} title="A ForStatement's four children, init, test, body and update, each lowered into its own place: the current block, the loop head, the body block and the continue block, with an exit block after">
      <T x={L} y={12} size={11} weight={700} fill={tok('muted')}>ESTREE (shaped like the text)</T>
      <Box x={L} y={22} w={170} h={30} fill={tok('accent', 0.12)} stroke={tok('accent')}>
        <T x={L + 85} y={37} size={12} mono anchor="middle" weight={700}>ForStatement</T>
      </Box>
      {[['init', 'let i = 0', 70], ['test', 'i < n', 122], ['body', 's = s + i', 174], ['update', 'i++', 226]].map(([k, v, y]) => (
        <g key={k as string}>
          <Arrow x1={L + 20} y1={52} x2={L + 20} y2={(y as number) + 14} color={tok('line')} width={1.2} />
          <Box x={L + 30} y={y as number} w={150} h={30} fill={tok('panel')}>
            <T x={L + 40} y={(y as number) + 15} size={11} mono>{`${k}: ${v}`}</T>
          </Box>
        </g>
      ))}

      <T x={R} y={12} size={11} weight={700} fill={tok('muted')}>VIR (shaped like the run)</T>
      {[['current block', 70], ['b1 head: condbr', 122], ['b2 body', 174], ['b3 cont: br b1', 226], ['b4 exit', 270]].map(([k, y]) => (
        <Box key={k as string} x={R} y={y as number} w={166} h={30} fill={tok('brand', 0.1)} stroke={tok('brand')}>
          <T x={R + 10} y={(y as number) + 15} size={11} mono>{k}</T>
        </Box>
      ))}
      <Arrow x1={188} y1={85} x2={R} y2={85} />
      <Arrow x1={188} y1={137} x2={R} y2={137} />
      <Arrow x1={188} y1={189} x2={R} y2={189} />
      <Arrow x1={188} y1={241} x2={R} y2={241} />
      <Arrow x1={R + 166} y1={241} x2={R + 166} y2={137} bend={0.5} color={tok('accent')} />
      <T x={L} y={285} size={11} fill={tok('muted')}>break → exit · continue → cont</T>
    </Svg>
  );
}
