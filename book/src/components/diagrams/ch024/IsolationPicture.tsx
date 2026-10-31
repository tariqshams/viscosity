import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

/** One shared process lets one layout's type feedback leak into another's
 *  measurement; one fresh process per case keeps each one clean. */
export default function IsolationPicture() {
  const shapes = [
    { label: 'object literal', c: 'f1' },
    { label: 'class P', c: 'f3' },
    { label: 'class K', c: 'f4' },
  ];
  return (
    <Svg w={400} h={250} title="Left: in one shared process, the function consume receives objects of three different shapes, one per layout, so its feedback is mixed. Right: in three separate processes, each copy of consume only ever sees one shape.">
      <T x={10} y={12} size={12} weight={700}>One shared process</T>
      <Box x={6} y={24} w={180} h={216} r={8} fill={tok('danger', 0.05)} stroke={tok('danger', 0.6)} dash>
        {shapes.map((sh, k) => (
          <g key={sh.label}>
            <Box x={16} y={38 + k * 38} w={104} h={28} r={4} fill={tok(sh.c, 0.15)} stroke={tok(sh.c)}>
              <T x={68} y={52 + k * 38} size={11} anchor="middle">{sh.label}</T>
            </Box>
            <Arrow x1={122} y1={52 + k * 38} x2={156 - k * 12} y2={174} width={1.3} color={tok(sh.c)} />
          </g>
        ))}
        <Box x={30} y={176} w={130} h={30} r={6} fill={tok('panel')} stroke={tok('danger')}>
          <T x={95} y={191} size={12} mono anchor="middle">consume(p)</T>
        </Box>
        <T x={95} y={224} size={11} anchor="middle" fill={tok('danger')}>sees 3 shapes: mixed</T>
      </Box>

      <T x={206} y={12} size={12} weight={700}>One process per case</T>
      {shapes.map((sh, k) => (
        <Box key={sh.label} x={202} y={24 + k * 74} w={192} h={66} r={8} fill={tok('safe', 0.05)} stroke={tok('safe', 0.7)}>
          <Box x={212} y={34 + k * 74} w={80} h={24} r={4} fill={tok(sh.c, 0.15)} stroke={tok(sh.c)}>
            <T x={252} y={46 + k * 74} size={10} anchor="middle">{sh.label}</T>
          </Box>
          <Arrow x1={292} y1={46 + k * 74} x2={306} y2={46 + k * 74} width={1.3} color={tok(sh.c)} />
          <T x={310} y={46 + k * 74} size={11} mono>consume(p)</T>
          <T x={212} y={74 + k * 74} size={10} fill={tok('safe')}>fresh process: 1 shape</T>
        </Box>
      ))}
    </Svg>
  );
}
