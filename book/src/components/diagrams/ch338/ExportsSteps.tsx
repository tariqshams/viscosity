import { StepFrame, useSteps } from '../../viz/stepper';
import { Svg, T, tok } from '../../viz/svg';
import pkg from '../../../../../engine/rust/packages/wasm/package.json';

// Chapter 338: how "@viscosity/wasm" resolves for different importers.
// The exports map is read from engine/rust/packages/wasm/package.json, and
// resolve() follows Node's rules for conditional exports: keys in object
// order, the first one whose condition is active wins, "default" always
// matches, and a nested object that matches nothing falls through to the
// parent's next key (nodejs.org/api/packages.html, Conditional exports).
type Target = string | { [cond: string]: Target };
const root = (pkg.exports as unknown as Record<string, Target>)['.'];

function resolve(t: Target, conds: string[], path: string[] = []): { file: string; path: string[] } | null {
  if (typeof t === 'string') return { file: t, path };
  for (const [k, v] of Object.entries(t)) {
    if (k !== 'default' && !conds.includes(k)) continue;
    const r = resolve(v, conds, [...path, k]);
    if (r) return r;
  }
  return null;
}

// Flatten the map into display rows: [depth, key, file?, path].
type Row = { depth: number; key: string; file?: string; path: string[] };
const rows: Row[] = [];
const walk = (t: Target, depth: number, path: string[]) => {
  for (const [k, v] of Object.entries(t as Record<string, Target>)) {
    const p = [...path, k];
    if (typeof v === 'string') rows.push({ depth, key: k, file: v, path: p });
    else { rows.push({ depth, key: k, path: p }); walk(v, depth + 1, p); }
  }
};
walk(root, 0, []);

type S = { who: string; conds: string[]; note: string };
const STATES: S[] = [
  { who: 'require() in Node', conds: ['node', 'require'], note: 'Node tries the keys of "." in order. "node" is active, so it goes in. "types" is not a condition Node sets, so it is skipped; "default" always matches. Result: the nodejs glue, CommonJS.' },
  { who: 'import in Node', conds: ['node', 'import'], note: 'An ES import sets "import" instead of "require", but this map never asks. Same file. dist/node holds a one-line package.json, {"type": "commonjs"}, so Node reads it as CommonJS even though the package says "module".' },
  { who: 'a bundler, for a browser', conds: ['browser', 'import'], note: 'A bundler building for the web uses the "browser" condition. "node" is skipped, "browser" matches, and the bundle gets the web glue, which needs await init().' },
  { who: 'TypeScript, nodenext', conds: ['types', 'node', 'import'], note: 'TypeScript always matches "types", and with nodenext also "node". Keys are still tried in order, so it takes "node" first, then "types" inside it: the .d.ts written for the nodejs glue.' },
  { who: 'a runtime that sets neither', conds: ['import'], note: 'Neither environment key matches, nor does "types". "default" catches everything else: the web glue, the more portable of the two, because it only needs fetch or bytes.' },
  { who: 'order matters', conds: ['node', 'require'], note: 'Earlier keys win, so the general "default" must come last. If it came first, Node would never look at "node": every Node user would get the web glue, which does nothing until someone calls init().' },
];

export default function ExportsSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const flip = s.i === STATES.length - 1;
  const r = resolve(root, st.conds);
  const hit = (row: Row) => r !== null && row.path.length <= r.path.length && row.path.every((k, i) => k === r.path[i]);
  const tried = (row: Row) => row.path.every((k) => k === 'default' || st.conds.includes(k));
  const top = 46;
  const lh = 19;
  return (
    <StepFrame title="Which file does @viscosity/wasm give you?" steps={s} note={st.note}>
      <Svg w={400} h={top + rows.length * lh + 34} title="The conditional exports of @viscosity/wasm, and the file each kind of importer resolves to">
        <T x={8} y={12} size={11} weight={700}>{st.who}</T>
        <T x={8} y={30} size={10} mono fill={tok('muted')}>{`conditions: ${[...st.conds, 'default'].join(', ')}`}</T>
        {rows.map((row, i) => {
          const y = top + i * lh;
          const on = !flip && hit(row);
          const dim = !flip && !on && !tried(row);
          const x = 14 + row.depth * 16;
          return (
            <g key={row.path.join('/')} opacity={dim ? 0.35 : 1}>
              {on && <rect x={x - 4} y={y - 8} width={388 - x} height={16} rx={3} fill={tok('brand', 0.15)} />}
              <T x={x} y={y} size={10} mono weight={on ? 700 : undefined} fill={on ? tok('brand') : undefined}>{`"${row.key}"${row.file ? ':' : ': {'}`}</T>
              {row.file && <T x={x + 70} y={y} size={10} mono fill={on ? tok('brand') : tok('ink', 0.8)}>{row.file.replace('./dist/', 'dist/').replace('viscosity_wasm', 'v…')}</T>}
            </g>
          );
        })}
        {flip ? (
          <T x={8} y={top + rows.length * lh + 14} size={11} mono fill={tok('danger')}>{'{ "default": …, "node": … }  → node is never reached'}</T>
        ) : (
          <T x={8} y={top + rows.length * lh + 14} size={11} mono fill={tok('safe')}>{`→ ${r ? r.file : 'nothing'}`}</T>
        )}
      </Svg>
    </StepFrame>
  );
}
