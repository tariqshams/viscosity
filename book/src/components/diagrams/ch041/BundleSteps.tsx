import { StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

type Mod = 'main' | 'scanner' | 'chars';
type S = { seen: Mod[]; at: Mod | null; out: string[]; note: string };

// The three source modules, and the lines of the bundle as it grows.
const MODS: { id: Mod; file: string; lines: string[]; y: number }[] = [
  { id: 'main', file: 'main.ts', lines: ["import { scan } from", "  './scanner.ts';", "console.log(scan('12'));"], y: 22 },
  { id: 'scanner', file: 'scanner.ts', lines: ["import { isDigit } from", "  './chars.ts';", 'export function scan…', 'export function unused…'], y: 100 },
  { id: 'chars', file: 'chars.ts', lines: ['export function', '  isDigit(c: string)…'], y: 192 },
];

const STATES: S[] = [
  { seen: ['main'], at: 'main', out: [], note: 'The bundler starts at the entry module you name, main.ts. It reads the file without running any of it.' },
  { seen: ['main', 'scanner'], at: 'scanner', out: [], note: 'main.ts imports scanner.ts, so the bundler follows that import and reads scanner.ts too.' },
  { seen: ['main', 'scanner', 'chars'], at: 'chars', out: [], note: 'scanner.ts imports chars.ts; follow it. chars.ts imports nothing, so the walk stops here: every module the program needs has been found.' },
  { seen: ['main', 'scanner', 'chars'], at: 'chars', out: ['// chars.ts', 'function isDigit(c) {…}'], note: 'Now it writes the bundle, each module after the ones it imports (the load order from the program-structure chapter): chars.ts first, with its types erased.' },
  { seen: ['main', 'scanner', 'chars'], at: 'scanner', out: ['// chars.ts', 'function isDigit(c) {…}', '// scanner.ts', 'function scan(src) {…}'], note: 'Then scanner.ts. Nothing ever imports unused, so it is left out: that is tree shaking. The import and export lines go too, since everything now lives in one file.' },
  { seen: ['main', 'scanner', 'chars'], at: 'main', out: ['// chars.ts', 'function isDigit(c) {…}', '// scanner.ts', 'function scan(src) {…}', '// main.ts', "console.log(scan('12'));"], note: 'Last, main.ts. The result is one file, dist/app.js, that a browser can load in one go. No type was checked along the way.' },
];

export default function BundleSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="How a bundler builds one file" steps={s} note={st.note}>
      <Svg w={400} h={250} title="Three modules, main.ts, scanner.ts and chars.ts, connected by imports, and the single bundled file built from them">
        <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>SOURCE MODULES</T>
        {MODS.map((m) => {
          const seen = st.seen.includes(m.id);
          const here = st.at === m.id;
          const h = 22 + m.lines.length * 14;
          return (
            <g key={m.id} opacity={seen ? 1 : 0.35}>
              <Box x={4} y={m.y} w={186} h={h} stroke={here ? tok('brand') : tok('line')} fill={here ? tok('brand', 0.1) : tok('panel')}>
                <T x={12} y={m.y + 11} size={11} mono weight={700}>{m.file}</T>
                {m.lines.map((l, k) => {
                  const dropped = l.startsWith('export function unused') && st.out.length >= 4;
                  return (
                    <T key={k} x={12} y={m.y + 26 + k * 14} size={11} mono fill={dropped ? tok('danger') : tok('ink', 0.8)} opacity={dropped ? 0.6 : 1}>
                      {dropped ? 'unused: dropped' : l}
                    </T>
                  );
                })}
              </Box>
            </g>
          );
        })}
        <Arrow x1={60} y1={88} x2={60} y2={98} width={1.5} color={tok(st.seen.includes('scanner') ? 'brand' : 'line')} />
        <Arrow x1={60} y1={180} x2={60} y2={190} width={1.5} color={tok(st.seen.includes('chars') ? 'brand' : 'line')} />
        <T x={210} y={12} size={11} weight={700} fill={tok('muted')}>dist/app.js</T>
        <Box x={206} y={22} w={190} h={110} dash={!st.out.length} fill={st.out.length ? tok('safe', 0.08) : 'transparent'} stroke={st.out.length ? tok('safe') : tok('line')}>
          {st.out.length === 0 && <T x={216} y={40} size={11} fill={tok('muted')}>not written yet</T>}
          {st.out.map((l, k) => (
            <T key={k} x={214} y={36 + k * 16} size={11} mono fill={l.startsWith('//') ? tok('muted') : tok('ink')}>{l}</T>
          ))}
        </Box>
      </Svg>
    </StepFrame>
  );
}
