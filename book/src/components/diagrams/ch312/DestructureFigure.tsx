import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// Chapter 311b: the pattern const { x, y = 1, pos: { lat } } = o, and the
// plain reads it stands for, one per name the pattern binds.
const ROWS = [
  { pat: 'x', read: 'const x = o.x;', c: 'f1' },
  { pat: 'y = 1', read: 'const t = o.y;', read2: 'const y = t === undefined ? 1 : t;', c: 'f2' },
  { pat: 'pos: { lat }', read: 'const lat = o.pos.lat;', c: 'f3' },
];

export default function DestructureFigure() {
  return (
    <Svg w={400} h={214} title="Each part of the pattern becomes a plain read from o: x from o.x, y from o.y with a default, lat from o.pos.lat">
      <T x={200} y={14} size={13} mono anchor="middle">{'const { x, y = 1, pos: { lat } } = o'}</T>
      {ROWS.map((r, k) => {
        const y = 40 + k * 58;
        return (
          <g key={r.pat}>
            <Box x={6} y={y} w={100} h={40} fill={tok(r.c, 0.14)} stroke={tok(r.c)}>
              <T x={56} y={y + 20} size={12} mono anchor="middle">{r.pat}</T>
            </Box>
            <Arrow x1={108} y1={y + 20} x2={128} y2={y + 20} />
            <Box x={130} y={y} w={264} h={40}>
              <T x={138} y={r.read2 ? y + 13 : y + 20} size={11} mono>{r.read}</T>
              {r.read2 && <T x={138} y={y + 29} size={11} mono>{r.read2}</T>}
            </Box>
          </g>
        );
      })}
      <T x={200} y={210} size={11} anchor="middle" fill={tok('muted')}>A default is used only when the value read is undefined.</T>
    </Svg>
  );
}
