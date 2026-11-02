// Chapter 251: when Viscosity can count a loop's trips. Real VIR headers
// from the program in AccessSteps: the line 11 loop (i < 10) and the line 5
// loop (i < ps.length). tripCount() needs a counting phi that starts at the
// constant 0 and steps by 1, compared with < or <= against a constant.
import { Box, Svg, T, tok } from '../../viz/svg';

type Line = { t: string; note?: string; ok?: boolean };
function Panel({ y, title, lines, verdict, ok }: { y: number; title: string; lines: Line[]; verdict: string; ok: boolean }) {
  const c = ok ? tok('safe') : tok('danger');
  return (
    <g>
      <T x={8} y={y + 8} size={12} weight={700}>{title}</T>
      <Box x={4} y={y + 18} w={392} h={lines.length * 18 + 14} stroke={tok('ink', 0.4)}>
        {lines.map((l, k) => (
          <g key={k}>
            <T x={12} y={y + 32 + k * 18} size={11} mono>{l.t}</T>
            {l.note && <T x={392} y={y + 32 + k * 18} size={11} anchor="end" fill={l.ok ? tok('safe') : tok('danger')}>{l.note}</T>}
          </g>
        ))}
      </Box>
      <T x={8} y={y + lines.length * 18 + 46} size={12} weight={700} fill={c}>{verdict}</T>
    </g>
  );
}

export default function TripCount() {
  return (
    <Svg w={400} h={262} title="Two loop headers in VIR. The first compares a counter that starts at 0 and steps by 1 with the constant 10, so it runs 10 times. The second compares with ps.length, which is not a constant, so its trip count is unknown.">
      <Panel y={0} title="for (let i = 0; i < 10; i++)" ok verdict="trips = 10" lines={[
        { t: '%48 = const 0', note: 'starts at 0', ok: true },
        { t: '%49 = phi %48, %59', note: 'steps by 1', ok: true },
        { t: '%50 = const 10', note: 'a constant', ok: true },
        { t: '%51 = binop < %49, %50', note: '<', ok: true },
      ]} />
      <Panel y={146} title="for (let i = 0; i < ps.length; i++)" ok={false} verdict="trips unknown (null)" lines={[
        { t: '%20 = phi %19, %42', note: 'counts 0, 1, …', ok: true },
        { t: '%22 = field.get %21 .length', note: 'not a constant', ok: false },
        { t: '%23 = binop < %20, %22', note: '<', ok: true },
      ]} />
    </Svg>
  );
}
