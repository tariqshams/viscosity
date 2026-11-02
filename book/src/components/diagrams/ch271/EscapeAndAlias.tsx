// Chapter 271: the safety proof is two familiar analyses. Escape: no
// reference to the array or an element may leave the code Viscosity
// rewrites (console.log(ps[3]), ps.reverse(), return ps). Alias: no value
// may be a second name for an element (a pushed record used again), and a
// parameter must point to exactly one collection (total(a), total(b)).
// Every message is real viscosity explain output.
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

export default function EscapeAndAlias() {
  return (
    <Svg w={400} h={300} title="Left, escape: the array and its elements live inside a region of rewritable uses; calls, returns and array methods would let a reference out. Right, alias: a parameter that points to one collection is fine; one that points to two, or a record with a second name, is refused.">
      <T x={100} y={12} size={12} weight={700} anchor="middle" fill={tok('brand')}>ESCAPE</T>
      <T x={100} y={28} size={11} anchor="middle" fill={tok('muted')}>nothing may leave</T>
      <Box x={14} y={40} w={172} h={110} stroke={tok('safe')} fill={tok('safe', 0.08)}>
        <T x={100} y={58} size={11} anchor="middle" fill={tok('safe')}>rewritable uses</T>
        <T x={26} y={80} size={11} mono>ps.length</T>
        <T x={26} y={98} size={11} mono>{'ps.push({ x: i })'}</T>
        <T x={26} y={116} size={11} mono>ps[i].x += 1</T>
        <T x={26} y={134} size={11} mono>step(ps)  (known)</T>
      </Box>
      <Arrow x1={60} y1={150} x2={40} y2={182} color={tok('danger')} />
      <Arrow x1={100} y1={150} x2={100} y2={182} color={tok('danger')} />
      <Arrow x1={140} y1={150} x2={160} y2={182} color={tok('danger')} />
      <T x={14} y={198} size={11} mono fill={tok('danger')}>console.log(ps[3])</T>
      <T x={14} y={216} size={11} mono fill={tok('danger')}>ps.reverse()</T>
      <T x={14} y={234} size={11} mono fill={tok('danger')}>return ps</T>
      <T x={14} y={258} size={11} fill={tok('muted')}>a reference reaches code</T>
      <T x={14} y={274} size={11} fill={tok('muted')}>Viscosity cannot rewrite</T>

      <T x={300} y={12} size={12} weight={700} anchor="middle" fill={tok('brand')}>ALIAS</T>
      <T x={300} y={28} size={11} anchor="middle" fill={tok('muted')}>no second name</T>
      <Box x={214} y={40} w={60} h={28} stroke={tok('brand')} fill={tok('brand', 0.14)}>
        <T x={244} y={54} size={11} mono anchor="middle">ps</T>
      </Box>
      <Box x={326} y={40} w={60} h={28} stroke={tok('brand')} fill={tok('brand', 0.14)}>
        <T x={356} y={54} size={11} mono anchor="middle">qs</T>
      </Box>
      <Arrow x1={326} y1={54} x2={276} y2={54} color={tok('safe')} />
      <T x={300} y={82} size={11} anchor="middle" fill={tok('safe')}>qs points only to ps: ok</T>
      <Box x={214} y={100} w={44} h={28} stroke={tok('brand')} fill={tok('brand', 0.14)}>
        <T x={236} y={114} size={11} mono anchor="middle">a</T>
      </Box>
      <Box x={342} y={100} w={44} h={28} stroke={tok('brand')} fill={tok('brand', 0.14)}>
        <T x={364} y={114} size={11} mono anchor="middle">b</T>
      </Box>
      <Box x={268} y={144} w={64} h={28} stroke={tok('danger')}>
        <T x={300} y={158} size={11} mono anchor="middle">total(xs)</T>
      </Box>
      <Arrow x1={290} y1={144} x2={250} y2={130} color={tok('danger')} />
      <Arrow x1={310} y1={144} x2={350} y2={130} color={tok('danger')} />
      <T x={300} y={188} size={11} anchor="middle" fill={tok('danger')}>xs may be a or b: refused</T>
      <T x={214} y={216} size={11} mono>const r = {'{ x: i }'};</T>
      <T x={214} y={234} size={11} mono>ps.push(r);</T>
      <T x={214} y={252} size={11} mono fill={tok('danger')}>r.x = 500;</T>
      <T x={214} y={274} size={11} fill={tok('danger')}>r and ps[5] alias: refused</T>
      <line x1={200} y1={8} x2={200} y2={290} stroke={tok('line')} strokeWidth={1} />
    </Svg>
  );
}
