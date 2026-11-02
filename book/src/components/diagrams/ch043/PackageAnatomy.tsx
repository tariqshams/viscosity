import { Svg, T, tok } from '../../viz/svg';

// Each line of a small package.json, with a note on what it is for.
const LINES: [string, string | null, string?][] = [
  ['{', null],
  ['  "name": "drip",', 'who the package is', 'f1'],
  ['  "version": "0.1.0",', 'major.minor.patch', 'f1'],
  ['  "type": "module",', 'its .js files are modules', 'f2'],
  ['  "scripts": {', null],
  ['    "check": "tsc --noEmit",', 'npm run check', 'f3'],
  ['    "test": "vitest run"', 'npm test', 'f3'],
  ['  },', null],
  ['  "devDependencies": {', 'tools to work on it', 'f4'],
  ['    "typescript": "^5.9.3"', 'from 5.9.3, below 6.0.0', 'f4'],
  ['  }', null],
  ['}', null],
];

/** A package.json, line by line, with what each part is for. */
export default function PackageAnatomy() {
  const top = 26;
  const gap = 17;
  return (
    <Svg w={400} h={244} title="A package.json for the Drip project: its name and version, type module, two scripts (check and test), and a devDependency on typescript at version ^5.9.3, each annotated with what it is for.">
      <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>package.json</T>
      <T x={392} y={12} size={11} weight={700} anchor="end" fill={tok('muted')}>WHAT IT IS FOR</T>
      {LINES.map(([code, note, colour], k) => {
        const y = top + k * gap;
        return (
          <g key={k}>
            {colour && <rect x={4} y={y - 8} width={3} height={16} fill={tok(colour)} />}
            <T x={12} y={y} size={11} mono>{code}</T>
            {note && <T x={392} y={y} size={11} anchor="end" fill={tok(colour ?? 'muted')}>{note}</T>}
          </g>
        );
      })}
      <T x={8} y={top + LINES.length * gap + 4} size={11} fill={tok('muted')}>npm install writes node_modules/ and package-lock.json.</T>
    </Svg>
  );
}
