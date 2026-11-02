import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

type Line = { text: string; kind: 'export' | 'import' | 'private' };
type File = { name: string; lines: Line[] };

const FILES: File[] = [
  { name: 'scanner.js', lines: [
    { text: 'isDigit', kind: 'private' },
    { text: 'pos', kind: 'private' },
    { text: 'export scan', kind: 'export' },
  ] },
  { name: 'parser.js', lines: [
    { text: 'import scan', kind: 'import' },
    { text: 'peek', kind: 'private' },
    { text: 'export parse', kind: 'export' },
  ] },
  { name: 'main.js', lines: [
    { text: 'import parse', kind: 'import' },
    { text: 'source', kind: 'private' },
  ] },
];

/** Three files. Each keeps most names private and exports a few. */
export default function ModuleFiles() {
  const W = 120;
  return (
    <Svg w={400} h={190} title="Three modules. scanner.js keeps isDigit and pos private and exports scan. parser.js imports scan, keeps peek private and exports parse. main.js imports parse.">
      {FILES.map((f, k) => {
        const x = 4 + k * 138;
        return (
          <g key={f.name}>
            <Box x={x} y={8} w={W} h={150} r={6} stroke={tok('ink', 0.45)}>
              <T x={x + 10} y={26} size={12.5} mono weight={700}>{f.name}</T>
              <line x1={x} y1={40} x2={x + W} y2={40} stroke={tok('line')} strokeWidth={1.5} />
              {f.lines.map((l, j) => {
                const y = 52 + j * 34;
                const color = l.kind === 'export' ? tok('brand') : l.kind === 'import' ? tok('accent') : tok('muted');
                return (
                  <Box key={l.text} x={x + 8} y={y} w={W - 16} h={26} r={4} dash={l.kind === 'private'}
                    fill={l.kind === 'private' ? 'transparent' : l.kind === 'export' ? tok('brand', 0.12) : tok('accent', 0.12)} stroke={color}>
                    <T x={x + 16} y={y + 13} size={11.5} mono fill={l.kind === 'private' ? tok('muted') : undefined}>{l.text}</T>
                  </Box>
                );
              })}
            </Box>
          </g>
        );
      })}
      <Arrow x1={116} y1={133} x2={146} y2={65} color={tok('brand')} />
      <Arrow x1={254} y1={133} x2={284} y2={65} color={tok('brand')} />
      <T x={8} y={176} size={11} fill={tok('muted')}>dashed: private to its file</T>
      <T x={392} y={176} size={11} anchor="end" fill={tok('brand')}>arrows: export → import</T>
    </Svg>
  );
}
