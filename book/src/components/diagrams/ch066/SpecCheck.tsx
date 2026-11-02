import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const TEST = ['if (0) print 0;', '// expect: 0', 'if ("") print "e";', '// expect: e'];

/** One test program, two implementations, one verdict each. */
export default function SpecCheck() {
  return (
    <Svg w={400} h={250} title="A test program with expect comments is run on the tree-walker and on the VM; each output is compared with the expected lines, and both match, so both pass.">
      <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>TEST PROGRAM (truth.drip, shortened)</T>
      <Box x={6} y={22} w={170} h={92} r={6} fill={tok('panel')} stroke={tok('ink', 0.45)}>
        {TEST.map((l, k) => (
          <T key={k} x={14} y={38 + k * 20} size={12} mono fill={l.startsWith('//') ? tok('brand') : undefined} weight={l.startsWith('//') ? 700 : 400}>{l}</T>
        ))}
      </Box>
      <Arrow x1={178} y1={50} x2={226} y2={40} width={1.5} />
      <Arrow x1={178} y1={86} x2={226} y2={98} width={1.5} />
      {[['tree-walker', 20], ['VM', 78]].map(([name, y]) => (
        <g key={name as string}>
          <Box x={228} y={y as number} w={78} h={40} r={6} fill={tok('accent', 0.12)} stroke={tok('accent')}>
            <T x={267} y={(y as number) + 20} size={12} weight={700} anchor="middle">{name}</T>
          </Box>
          <Arrow x1={308} y1={(y as number) + 20} x2={326} y2={(y as number) + 20} width={1.5} />
          <Box x={328} y={y as number} w={64} h={40} r={6} fill={tok('panel')} stroke={tok('ink', 0.4)}>
            <T x={340} y={(y as number) + 13} size={12} mono>0</T>
            <T x={340} y={(y as number) + 29} size={12} mono>e</T>
          </Box>
        </g>
      ))}
      <Box x={6} y={140} w={386} h={96} r={8} fill={tok('safe', 0.08)} stroke={tok('safe')}>
        <T x={20} y={160} size={12} weight={700}>Compare, line by line, with the expect comments</T>
        <T x={20} y={182} size={12} mono>expected  0, e</T>
        <T x={20} y={200} size={12} mono>got       0, e   (both)</T>
        <T x={20} y={222} size={12} weight={700} fill={tok('safe')}>Both pass. Any difference, even a space, fails.</T>
      </Box>
    </Svg>
  );
}
