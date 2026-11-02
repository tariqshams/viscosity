import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// Chapter 162 (second half): the three ways out of one version, by the
// rules of Semantic Versioning 2.0.0: bump one part, reset the parts to its
// right to 0.
const ROWS = [
  { kind: 'PATCH', why: 'a backward compatible fix', to: '1.9.4', c: 'f3' },
  { kind: 'MINOR', why: 'a backward compatible feature', to: '1.10.0', c: 'f1' },
  { kind: 'MAJOR', why: 'a change that breaks the API', to: '2.0.0', c: 'f6' },
];

export default function BumpTree() {
  return (
    <Svg w={400} h={200} title="From version 1.9.3, a fix leads to 1.9.4, a new feature to 1.10.0 with the patch reset, and a breaking change to 2.0.0 with minor and patch reset.">
      <Box x={6} y={78} w={80} h={36} fill={tok('panel')}>
        <T x={46} y={96} size={14} mono anchor="middle" weight={700}>1.9.3</T>
      </Box>
      {ROWS.map((r, k) => {
        const y = 14 + k * 64;
        return (
          <g key={r.kind}>
            <Arrow x1={86} y1={96} x2={300} y2={y + 18} color={tok(r.c)} />
            <T x={104} y={[72, 85, 116][k]} size={11} weight={700} fill={tok(r.c)}>{r.kind}</T>
            <Box x={302} y={y} w={92} h={36} fill={tok(r.c, 0.15)} stroke={tok(r.c)}>
              <T x={348} y={y + 18} size={14} mono anchor="middle" weight={700}>{r.to}</T>
            </Box>
            <T x={394} y={y + 48} size={11} anchor="end" fill={tok('muted')}>{r.why}</T>
          </g>
        );
      })}
    </Svg>
  );
}
