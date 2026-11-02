// Chapter 373-b: the conversions `?` can make, each one an `impl From`.
// The first two are the chapter's CliError example (as in the standard
// library's From documentation); `&str -> String` is std's own impl; the
// last is engine/rust's CLI (crates/cli/src/main.rs: impl From<String>
// for CliError, wrapping it as CliError::Other).
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const ROWS: { from: string; to: string; via: string; c: string }[] = [
  { from: 'io::Error', to: 'CliError::Io(e)', via: 'our impl', c: 'f3' },
  { from: 'ParseIntError', to: 'CliError::Num(e)', via: 'our impl', c: 'f2' },
  { from: '&str', to: 'String', via: 'std', c: 'f5' },
  { from: 'String', to: 'CliError::Other(e)', via: 'engine/rust’s CLI', c: 'f4' },
];

export default function ConversionMap() {
  const rh = 46;
  return (
    <Svg w={400} h={ROWS.length * rh + 30} title="Four source types, each with an arrow labelled impl From to the type it converts into">
      <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>Err(e) of this type</T>
      <T x={392} y={12} size={11} weight={700} anchor="end" fill={tok('muted')}>becomes, through From::from</T>
      {ROWS.map((r, k) => {
        const y = 24 + k * rh;
        return (
          <g key={k}>
            <Box x={8} y={y} w={124} h={32} r={4} fill={tok(r.c, 0.15)} stroke={tok(r.c)}>
              <T x={70} y={y + 16} size={11} mono anchor="middle" fill={tok('ink')}>{r.from}</T>
            </Box>
            <Arrow x1={134} y1={y + 16} x2={236} y2={y + 16} color={tok(r.c)} />
            <T x={185} y={y + 7} size={11} anchor="middle" fill={tok('muted')}>{r.via}</T>
            <Box x={238} y={y} w={154} h={32} r={4} fill={tok('panel')} stroke={tok(r.c)}>
              <T x={315} y={y + 16} size={11} mono anchor="middle" fill={tok('ink')}>{r.to}</T>
            </Box>
          </g>
        );
      })}
    </Svg>
  );
}
