import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// The order of the checks in plan() (engine/ts/packages/core/src/plan.ts)
// for a collection with no annotation, in auto mode. The profile is read at
// exactly one rung, the size check, after every safety check has passed.
const RUNGS: { text: string; keep: string; profile?: boolean }[] = [
  { text: 'any unsafe use?', keep: 'unsafe: ...' },
  { text: 'Python, not opted in?', keep: 'CPython: ...' },
  { text: 'no provably numeric field?', keep: 'no typed columns' },
  { text: 'no loop over its fields?', keep: 'cannot pay off' },
  { text: 'fewer than 64 elements?', keep: 'below the threshold', profile: true },
];

export default function ProfileGate() {
  const top = 10;
  const h = 34;
  const gap = 10;
  const yEnd = top + RUNGS.length * (h + gap);
  return (
    <Svg w={400} h={yEnd + 46} title="The planner's checks in order: unsafe uses, Python, numeric fields, loops, then size; the profile is read only at the size check, and any yes keeps the objects">
      {RUNGS.map((r, k) => {
        const y = top + k * (h + gap);
        return (
          <g key={k}>
            <Box x={8} y={y} w={210} h={h} fill={r.profile ? tok('brand', 0.14) : tok('panel')} stroke={r.profile ? tok('brand') : tok('line')}>
              <T x={18} y={y + h / 2} size={12}>{r.text}</T>
            </Box>
            <Arrow x1={218} y1={y + h / 2} x2={246} y2={y + h / 2} color={tok('warn')} />
            <T x={252} y={y + h / 2 - 7} size={11} weight={700} fill={tok('warn')}>yes: keep</T>
            <T x={252} y={y + h / 2 + 8} size={11} mono fill={tok('muted')}>{r.keep}</T>
            {k < RUNGS.length - 1 && <Arrow x1={60} y1={y + h} x2={60} y2={y + h + gap - 1} />}
            {k < RUNGS.length - 1 && <T x={68} y={y + h + gap / 2} size={11} fill={tok('muted')}>no</T>}
          </g>
        );
      })}
      <Arrow x1={60} y1={yEnd - gap} x2={60} y2={yEnd + 6} color={tok('safe')} />
      <Box x={8} y={yEnd + 8} w={210} h={30} fill={tok('safe', 0.12)} stroke={tok('safe')}>
        <T x={18} y={yEnd + 23} size={12} weight={700} fill={tok('safe')}>no: struct of arrays</T>
      </Box>
      <Box x={236} y={yEnd + 4} w={156} h={38} fill={tok('brand', 0.1)} stroke={tok('brand')} dash>
        <T x={246} y={yEnd + 16} size={11} fill={tok('brand')}>the profile's maxLength</T>
        <T x={246} y={yEnd + 32} size={11} fill={tok('brand')}>is read only at this rung</T>
      </Box>
      <Arrow x1={300} y1={yEnd + 4} x2={200} y2={top + 4 * (h + gap) + h} bend={0.3} color={tok('brand')} dash />
    </Svg>
  );
}
