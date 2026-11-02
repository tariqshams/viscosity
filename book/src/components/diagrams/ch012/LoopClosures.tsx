import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

/** let gives each pass of a loop its own i; var gives the whole loop one. */
export default function LoopClosures() {
  return (
    <Svg w={400} h={230} title="Top, with let: three functions, each with an arrow to its own pass's i, holding 0, 1 and 2. Bottom, with var: three functions all pointing at one shared i, which holds 3 by the time any of them is called.">
      <T x={6} y={12} size={11} weight={700} fill={tok('safe')}>for (let i = 0; i &lt; 3; i++) fs.push(() =&gt; i);</T>
      {[0, 1, 2].map((k) => (
        <g key={k}>
          <Box x={6 + k * 132} y={24} w={88} h={30} r={6} fill={tok('brand', 0.08)} stroke={tok('brand')}>
            <T x={16 + k * 132} y={39.5} size={13} mono>fs[{k}]</T>
          </Box>
          <Arrow x1={50 + k * 132} y1={54} x2={50 + k * 132} y2={74} color={tok('brand')} />
          <Box x={6 + k * 132} y={76} w={88} h={30} r={6} fill={tok('safe', 0.1)} stroke={tok('safe')}>
            <T x={16 + k * 132} y={91.5} size={13} mono>i = <tspan fontWeight={700}>{k}</tspan></T>
          </Box>
        </g>
      ))}
      <T x={6} y={122} size={12} fill={tok('muted')}>each pass has its own i: fs[0]() is 0, fs[2]() is 2</T>
      <T x={6} y={146} size={11} weight={700} fill={tok('danger')}>for (var i = 0; i &lt; 3; i++) fs.push(() =&gt; i);</T>
      {[0, 1, 2].map((k) => (
        <g key={k}>
          <Box x={6 + k * 132} y={156} w={88} h={30} r={6} fill={tok('brand', 0.08)} stroke={tok('brand')}>
            <T x={16 + k * 132} y={171.5} size={13} mono>fs[{k}]</T>
          </Box>
          <Arrow x1={50 + k * 132} y1={186} x2={182} y2={200} color={tok('danger')} />
        </g>
      ))}
      <Box x={150} y={200} w={100} h={26} r={6} fill={tok('danger', 0.1)} stroke={tok('danger')}>
        <T x={164} y={213.5} size={13} mono>i = <tspan fontWeight={700}>3</tspan></T>
      </Box>
      <T x={262} y={213} size={12} fill={tok('muted')}>one i, shared</T>
    </Svg>
  );
}
