import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

const CONFIG = `{
  "compilerOptions": {
    "target": "es2022",
    "module": "nodenext",
    "strict": true,
    "outDir": "dist"
  },
  "include": ["src"]
}`;

// lit: which rows of the folder picture are highlighted.
type Row = 'config' | 'pkg' | 'main' | 'scan' | 'dist' | 'mainjs' | 'scanjs';
type S = { line: number | null; lit: Row[]; dist: boolean; note: string };

const STATES: S[] = [
  { line: null, lit: [], dist: false, note: 'In the folder drip/, you type npx tsc, with no file names. Nothing on the command line says which files to check, or how.' },
  { line: 0, lit: ['config'], dist: false, note: 'So tsc looks for a tsconfig.json, first in the current folder, then in each parent folder in turn. It finds this one.' },
  { line: 1, lit: ['config'], dist: false, note: 'It reads compilerOptions: the settings you would otherwise type as flags (--target, --module, --strict, --outDir) on every run.' },
  { line: 7, lit: ['main', 'scan'], dist: false, note: 'include says which files belong to the project: everything TypeScript can read under src/. A new file there is picked up without editing the config.' },
  { line: 4, lit: ['main', 'scan'], dist: false, note: 'It checks all the files together, with the strict checks on, so a call from main.ts into scanner.ts is checked against scanner.ts’s real types.' },
  { line: 3, lit: ['pkg'], dist: false, note: 'module: nodenext means “follow Node’s rules”; one of them is that package.json’s "type" field decides whether the output uses import or require.' },
  { line: 5, lit: ['mainjs', 'scanjs'], dist: true, note: 'Last, tsc erases the types and writes plain es2022 JavaScript into dist/, one .js file per .ts file. (Unless told otherwise, it writes them even when it found errors.)' },
];

const ROWS: { id: Row | 'src'; y: number; depth: number; name: string; outDir?: boolean }[] = [
  { id: 'config', y: 32, depth: 1, name: 'tsconfig.json' },
  { id: 'pkg', y: 52, depth: 1, name: 'package.json' },
  { id: 'src', y: 72, depth: 1, name: 'src/' },
  { id: 'main', y: 92, depth: 2, name: 'main.ts' },
  { id: 'scan', y: 112, depth: 2, name: 'scanner.ts' },
  { id: 'dist', y: 132, depth: 1, name: 'dist/', outDir: true },
  { id: 'mainjs', y: 152, depth: 2, name: 'main.js', outDir: true },
  { id: 'scanjs', y: 172, depth: 2, name: 'scanner.js', outDir: true },
];

export default function TscSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="What npx tsc does in a project" steps={s} note={st.note}>
      <CodeTrace code={CONFIG} line={st.line} />
      <Svg w={400} h={188} title="The project folder: tsconfig.json, package.json, a src folder with two .ts files, and a dist folder that tsc fills with .js files">
        <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>THE FOLDER drip/</T>
        {ROWS.map((r) => {
          const hide = r.outDir === true && !st.dist;
          const lit = r.id !== 'src' && st.lit.includes(r.id);
          return (
            <g key={r.id} opacity={hide ? 0.35 : 1}>
              <Box x={r.depth * 16} y={r.y - 9} w={150} h={18} r={3} fill={lit ? tok('brand', 0.14) : 'transparent'} stroke={lit ? tok('brand') : 'transparent'}>
                <T x={8 + r.depth * 16} y={r.y} size={12} mono>{r.name}</T>
              </Box>
            </g>
          );
        })}
        <T x={214} y={92} size={11} fill={tok('muted')}>you write .ts files here</T>
        <T x={214} y={152} size={11} fill={tok('muted')}>{st.dist ? 'tsc wrote these .js files' : 'not written yet'}</T>
      </Svg>
    </StepFrame>
  );
}
