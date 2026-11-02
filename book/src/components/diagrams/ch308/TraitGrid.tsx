import { Box, Svg, T, tok } from '../../viz/svg';

// Which type can do what. A type gets a trait's methods only through an
// impl block: Rb has methods with the same names, but no impl, so it is
// not a Plugin.

const COLS = ['id', 'exts', 'handles'];
const ROWS: { t: string; cells: ('own' | 'default' | 'none')[]; note: string }[] = [
  { t: 'Js', cells: ['own', 'own', 'default'], note: 'impl Plugin for Js' },
  { t: 'Py', cells: ['own', 'own', 'default'], note: 'impl Plugin for Py' },
  { t: 'Rb', cells: ['none', 'none', 'none'], note: 'own id and exts, no impl' },
];

const LABEL = { own: 'written', default: 'default', none: 'not a Plugin' };
const COL = { own: 'safe', default: 'accent', none: 'danger' };

export default function TraitGrid() {
  return (
    <Svg w={400} h={180} title="A grid of three types and the three Plugin methods, showing which each type wrote, inherited, or lacks">
      {COLS.map((c, j) => <T key={c} x={86 + j * 78 + 36} y={14} size={11} mono weight={700} anchor="middle">{c}</T>)}
      {ROWS.map((r, i) => {
        const y = 26 + i * 50;
        return (
          <g key={r.t}>
            <T x={8} y={y + 16} size={13} mono weight={700}>{r.t}</T>
            {r.cells.map((c, j) => (
              <Box key={j} x={86 + j * 78} y={y} w={72} h={32} r={3} fill={tok(COL[c], 0.15)} stroke={tok(COL[c])}>
                <T x={86 + j * 78 + 36} y={y + 16} size={11} anchor="middle">{c === 'none' ? '✗' : LABEL[c]}</T>
              </Box>
            ))}
            <T x={86} y={y + 44} size={11} fill={tok('muted')}>{r.note}</T>
          </g>
        );
      })}
    </Svg>
  );
}
