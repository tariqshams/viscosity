// Chapter 68: what the call expression does with each kind of callee.
// Two kinds of value can be called (Drip functions and natives); a class
// and everything else are runtime errors, each with its own message.
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const ROWS: { kind: string; then: string[]; ok: boolean }[] = [
  { kind: 'a Drip function', then: ['check arity, new environment,', 'run the body'], ok: true },
  { kind: 'a native function', then: ['check arity, run its', 'TypeScript code'], ok: true },
  { kind: 'a class', then: ["error: cannot call a class:", "use 'new C(...)'"], ok: false },
  { kind: 'anything else', then: ['error: cannot call a number', '(or a string, a list, ...)'], ok: false },
];

export default function CallDispatch() {
  const top = 70;
  const gap = 58;
  return (
    <Svg w={400} h={top + ROWS.length * gap} title="A call expression first evaluates the callee and the arguments, then looks at what kind of value the callee is. A Drip function or a native function is run after an arity check; a class or any other value is a runtime error.">
      <Box x={110} y={6} w={180} h={40} fill={tok('brand', 0.08)} stroke={tok('brand')}>
        <T x={200} y={20} size={12.5} mono anchor="middle" weight={700}>callee(args)</T>
        <T x={200} y={36} size={11} anchor="middle" fill={tok('muted')}>evaluate both, then ask:</T>
      </Box>
      <line x1={22} x2={22} y1={52} y2={top + (ROWS.length - 1) * gap + 20} stroke={tok('ink', 0.5)} strokeWidth={2} />
      <line x1={22} x2={200} y1={52} y2={52} stroke={tok('ink', 0.5)} strokeWidth={2} />
      <line x1={200} x2={200} y1={46} y2={52} stroke={tok('ink', 0.5)} strokeWidth={2} />
      {ROWS.map((r, i) => {
        const y = top + i * gap;
        const c = r.ok ? tok('safe') : tok('warn');
        return (
          <g key={r.kind}>
            <Arrow x1={22} y1={y + 20} x2={40} y2={y + 20} color={tok('ink', 0.5)} />
            <Box x={42} y={y} w={130} h={40} stroke={tok('ink', 0.4)}>
              <T x={50} y={y + 14} size={11} fill={tok('muted')}>is it</T>
              <T x={50} y={y + 29} size={12.5} weight={700}>{r.kind}?</T>
            </Box>
            <Arrow x1={174} y1={y + 20} x2={192} y2={y + 20} color={c} />
            <Box x={194} y={y} w={200} h={40} fill={r.ok ? tok('safe', 0.08) : tok('warn', 0.08)} stroke={c}>
              <T x={202} y={y + 14} size={11.5} mono={!r.ok}>{r.then[0]}</T>
              <T x={202} y={y + 29} size={11.5} mono={!r.ok}>{r.then[1]}</T>
            </Box>
          </g>
        );
      })}
    </Svg>
  );
}
