import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const ROWS = [
  { arg: 'first([1, 2])', t: 'number' },
  { arg: "first(['x'])", t: 'string' },
  { arg: 'first(ps)', t: 'Particle' },
];

/** One generic signature, with the blank T filled in by three calls. */
export default function GenericFill() {
  return (
    <Svg w={400} h={208} title="The signature first of T, taking xs of type T array and returning T or undefined. Three calls fill T in: first of 1, 2 gives number or undefined; first of x gives string or undefined; first of ps gives Particle or undefined.">
      <Box x={6} y={6} w={388} h={36} r={8} fill={tok('brand', 0.08)} stroke={tok('brand')}>
        <T x={200} y={24} size={13} mono anchor="middle">
          first&lt;<tspan fill={tok('brand')} fontWeight={700}>T</tspan>&gt;(xs: <tspan fill={tok('brand')} fontWeight={700}>T</tspan>[]): <tspan fill={tok('brand')} fontWeight={700}>T</tspan> | undefined
        </T>
      </Box>
      <T x={8} y={62} size={11} weight={700} fill={tok('muted')}>THE CALL</T>
      <T x={146} y={62} size={11} weight={700} fill={tok('muted')}>T IS</T>
      <T x={392} y={62} size={11} weight={700} anchor="end" fill={tok('muted')}>THE RESULT IS</T>
      {ROWS.map((r, k) => {
        const y = 92 + k * 40;
        return (
          <g key={k}>
            <T x={8} y={y} size={12} mono>{r.arg}</T>
            <Arrow x1={104} y1={y} x2={138} y2={y} width={1.5} />
            <T x={146} y={y} size={12} mono weight={700} fill={tok('accent')}>{r.t}</T>
            <Arrow x1={212} y1={y} x2={238} y2={y} width={1.5} />
            <T x={392} y={y} size={12} mono anchor="end">
              <tspan fill={tok('accent')} fontWeight={700}>{r.t}</tspan> | undefined
            </T>
          </g>
        );
      })}
      <T x={200} y={200} size={11} anchor="middle" fill={tok('muted')}>one definition; each call fills the blank afresh</T>
    </Svg>
  );
}
