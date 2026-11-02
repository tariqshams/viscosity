// Chapter 370: Cargo's built-in profiles and the settings that matter for
// timing, from the Cargo book's "Profiles" page (doc/book/src/reference/
// profiles.md): dev has opt-level 0, debug-assertions and overflow-checks
// on, 256 codegen units; release has opt-level 3, both checks off, 16
// codegen units; bench inherits from release.
import { Box, Svg, T, tok } from '../../viz/svg';

const COLS = ['dev', 'release', 'bench'];
const ROWS: [string, string[]][] = [
  ['used by', ['build, run, test', '--release', 'cargo bench']],
  ['opt-level', ['0 (none)', '3 (all)', '3']],
  ['debug-assertions', ['on', 'off', 'off']],
  ['overflow-checks', ['on: panic', 'off: wrap', 'off']],
  ['codegen-units', ['256', '16', '16']],
];

export default function Profiles() {
  const x0 = 136;
  const cw = 86;
  const rh = 28;
  return (
    <Svg w={400} h={ROWS.length * rh + 40} title="A table of Cargo's dev, release and bench profiles and their main settings">
      {COLS.map((c, j) => (
        <T key={c} x={x0 + j * cw + cw / 2} y={14} size={12} weight={700} anchor="middle" fill={j === 0 ? tok('warn') : tok('safe')}>{c}</T>
      ))}
      {ROWS.map(([label, vals], k) => {
        const y = 26 + k * rh;
        return (
          <g key={label}>
            <Box x={4} y={y} w={392} h={rh - 4} r={3} fill={k % 2 ? 'transparent' : tok('panel')} stroke="transparent" />
            <T x={10} y={y + (rh - 4) / 2} size={11} mono fill={tok('ink')}>{label}</T>
            {vals.map((v, j) => (
              <T key={j} x={x0 + j * cw + cw / 2} y={y + (rh - 4) / 2} size={11} anchor="middle" fill={j === 0 ? tok('warn') : tok('ink')}>{v}</T>
            ))}
          </g>
        );
      })}
    </Svg>
  );
}
