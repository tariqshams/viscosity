import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// The shape of speculative code for `return a + b` when feedback says
// SignedSmall, following the V8 blog's descriptions (Maglev, 2023: a
// check node, then the cheap operation; "Leaving the Sea of Nodes", 2025:
// a checked add that deoptimizes on overflow). The deopt reasons are the
// ones --trace-deopt printed in Node v22.23.4 for failing guards.
export default function GuardFigure() {
  return (
    <Svg w={400} h={236} title="A flowchart. Entry, then a guard: is a a Smi? then: is b a Smi? then an integer add that checks for overflow, then return. Each guard and the overflow check has a side exit labelled with the reason --trace-deopt prints: not a Smi, overflow. The side exits all lead to one box: deoptimise, continue in the interpreter.">
      {[
        { y: 8, t: 'enter optimized add', kind: 'n' },
        { y: 52, t: 'guard: a is a Smi?', kind: 'g', why: 'not a Smi' },
        { y: 96, t: 'guard: b is a Smi?', kind: 'g', why: 'not a Smi' },
        { y: 140, t: 'add integers; overflow?', kind: 'g', why: 'overflow' },
        { y: 184, t: 'return the sum', kind: 'n' },
      ].map((r, k, all) => (
        <g key={k}>
          <Box x={8} y={r.y} w={196} h={32} fill={r.kind === 'g' ? tok('warn', 0.12) : tok('safe', 0.12)} stroke={r.kind === 'g' ? tok('warn') : tok('safe')}>
            <T x={18} y={r.y + 16} size={12}>{r.t}</T>
          </Box>
          {k < all.length - 1 && <Arrow x1={106} y1={r.y + 32} x2={106} y2={r.y + 44} color={tok('safe')} />}
          {r.why && (
            <>
              <Arrow x1={206} y1={r.y + 16} x2={262} y2={118} color={tok('danger', 0.7)} width={1.5} />
              <T x={214} y={r.y + 8} size={11} fill={tok('danger')}>{r.why}</T>
            </>
          )}
        </g>
      ))}
      <Box x={264} y={92} w={128} h={52} fill={tok('danger', 0.1)} stroke={tok('danger')}>
        <T x={328} y={110} size={12} weight={700} anchor="middle" fill={tok('danger')}>deoptimise</T>
        <T x={328} y={128} size={11} anchor="middle">continue in Ignition</T>
      </Box>
      <T x={8} y={228} size={11} fill={tok('muted')}>green: the fast path; amber: a check on a guess</T>
    </Svg>
  );
}
