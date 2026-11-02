import { Box, Svg, T, tok } from '../../viz/svg';

/** An array as a row of numbered boxes, with scores[2] picked out. */
export default function ArrayBoxes() {
  const values = [90, 72, 85, 64];
  return (
    <Svg w={400} h={170} title="The array scores holds 90, 72, 85 and 64 in slots numbered 0 to 3. Its length is 4. scores[2] is 85.">
      <T x={8} y={16} size={14} mono weight={700}>scores</T>
      <T x={392} y={16} size={12} anchor="end" fill={tok('muted')}>length: 4</T>
      {values.map((v, i) => {
        const x = 8 + i * 96;
        const hit = i === 2;
        return (
          <g key={i}>
            <Box x={x} y={34} w={88} h={56} fill={hit ? tok('brand', 0.16) : tok('panel')} stroke={hit ? tok('brand') : tok('ink', 0.45)}>
              <T x={x + 44} y={62} size={22} mono weight={600} anchor="middle">{v}</T>
            </Box>
            <T x={x + 44} y={106} size={13} mono anchor="middle" fill={hit ? tok('brand') : tok('muted')} weight={hit ? 700 : 400}>{i}</T>
          </g>
        );
      })}
      <T x={8} y={106} size={11} fill={tok('muted')}> </T>
      <T x={200} y={134} size={12} anchor="middle" fill={tok('muted')}>index (slot number): starts at 0</T>
      <T x={200} y={158} size={14} mono anchor="middle" fill={tok('brand')} weight={700}>scores[2] → 85</T>
    </Svg>
  );
}
