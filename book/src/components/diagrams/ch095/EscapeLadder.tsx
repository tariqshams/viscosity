// Chapter 95: the three escape states as a ladder, from "never leaves
// this call" to "anyone may see it", with what each one still allows.
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const RUNGS = [
  { name: 'NoEscape', c: 'safe', what: 'never leaves this call', allows: ['stack allocation,', 'scalar replacement'] },
  { name: 'ArgEscape', c: 'warn', what: 'reaches the caller only', allows: ['one thread only: its', 'locks can be removed'] },
  { name: 'GlobalEscape', c: 'danger', what: 'reachable from anywhere', allows: ['heap, and nothing', 'more can be assumed'] },
];

export default function EscapeLadder() {
  return (
    <Svg w={400} h={232} title="Three rungs: NoEscape allows stack allocation and scalar replacement; ArgEscape allows removing locks; GlobalEscape allows nothing.">
      <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>STATE</T>
      <T x={392} y={12} size={11} weight={700} anchor="end" fill={tok('muted')}>WHAT THE COMPILER MAY DO</T>
      {RUNGS.map((r, k) => {
        const y = 26 + k * 66;
        return (
          <g key={r.name}>
            <Box x={4} y={y} w={176} h={54} fill={tok(r.c, 0.12)} stroke={tok(r.c)}>
              <T x={14} y={y + 17} size={14} mono weight={700}>{r.name}</T>
              <T x={14} y={y + 38} size={11} fill={tok('muted')}>{r.what}</T>
            </Box>
            <Box x={196} y={y} w={200} h={54}>
              <T x={206} y={y + 17} size={12}>{r.allows[0]}</T>
              <T x={206} y={y + 37} size={12}>{r.allows[1]}</T>
            </Box>
          </g>
        );
      })}
      <Arrow x1={188} y1={40} x2={188} y2={210} color={tok('ink', 0.5)} />
      <T x={200} y={226} size={11} anchor="middle" fill={tok('muted')}>down the ladder: escapes further, fewer tricks allowed</T>
    </Svg>
  );
}
