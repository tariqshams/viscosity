import { StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

// Chapter 249: trying to ship @viscosity/cli, step by step. Every terminal
// line is real output from the author's experiment on 2026-10-31 (npm pack,
// a scratch install with Node v22.23.4, and npm view), shortened to fit.
// The fixes it led to are in the repository now (bin/, dist/, build.mjs).
const STAGES = ['pack', 'install', 'run', 'publish'];

type State = { stage: number; ok: boolean[]; term: string[]; note: string };

const STATES: State[] = [
  { stage: -1, ok: [false, false, false, false], term: ['# four stages between a repo and', '# `npm install` working for a stranger'], note: 'Shipping a package means four things must work: packing it into a tarball, installing that tarball somewhere else, running the command, and publishing it to the registry. Step through what happened with the CLI as it first was, and how it was fixed.' },
  { stage: 0, ok: [true, false, false, false], term: ['$ npm pack --dry-run', 'package: @viscosity/cli@0.0.1', '231B  package.json', '4.5kB src/cli.ts', '2.0kB src/profile.ts', 'total files: 3'], note: 'Packing works. With no "files" field, npm packs everything in the package folder: the package.json and two TypeScript sources. Nothing is compiled.' },
  { stage: 1, ok: [true, true, false, false], term: ['$ npm install ./viscosity-cli-0.0.1.tgz', 'added 1 package', '$ ls node_modules/@viscosity', 'cli'], note: 'Installing works too, but only one package arrives. The CLI imports the core and the front-ends by relative paths into the repo, not as dependencies, so npm has no idea it needs them.' },
  { stage: 2, ok: [true, true, false, false], term: ['$ npx viscosity explain a.js', 'Error [ERR_UNSUPPORTED_NODE_MODULES', '_TYPE_STRIPPING]: Stripping types is', 'currently unsupported for files under', 'node_modules'], note: 'Running fails at once. Node runs .ts files in the repo, but refuses to strip types from files under node_modules, on purpose: packages are expected to ship JavaScript.' },
  { stage: 2, ok: [true, true, false, false], term: ['$ node build.mjs   # esbuild', '  dist/viscosity.mjs  1.0mb', '"bin": { "viscosity":', '  "bin/viscosity.mjs" }', '"files": ["bin", "dist"]'], note: 'The fix for both problems: a build step. Bundling compiles the TypeScript and pulls in the core, the front-ends, acorn, acorn-walk and sucrase, so the package has one JavaScript file, no runtime dependencies and no missing pieces.' },
  { stage: 2, ok: [true, true, false, false], term: ['$ npx viscosity explain a.js', '$ echo $?', '0', '# nothing printed at all'], note: 'Now it runs and prints nothing, successfully. cli.ts only calls main() when import.meta.url equals the script path in process.argv[1]. Through npm’s bin link, argv[1] is the link, not the real file, so the check fails silently.' },
  { stage: 2, ok: [true, true, true, false], term: ['// bin/viscosity.mjs', "import { main } from", "  '../dist/viscosity.mjs';", 'process.exit(', '  main(process.argv.slice(2)));', '$ npx viscosity explain a.js', 'ps (line 1) {x, vx} → struct of arrays'], note: 'A tiny entry file that always calls main() fixes it. The installed command now gives the same report as the repo’s. Three bugs, none visible from inside the repository.' },
  { stage: 3, ok: [true, true, true, false], term: ['$ npm view viscosity description', "'A sass library for fluid containers", "that handle aspect ratios across", "device sizes'", '$ npm view @viscosity/cli', '404 Not Found'], note: 'On 2026-10-31, publishing hadn’t happened. The plain name viscosity already belongs to an unrelated Sass library, and no @viscosity package existed. A scoped package needs a matching npm organization and --access public. (Both were set up, and @viscosity/cli 0.0.1 was published on 2026-11-02.)' },
];

export default function ShipSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const bw = 90;
  return (
    <StepFrame title="Shipping the CLI" steps={s} note={st.note}>
      <Svg w={400} h={226} title="Four stages, pack, install, run and publish, each marked as working or not, above a terminal showing the real output for the current step">
        {STAGES.map((name, k) => {
          const x = 6 + k * (bw + 8);
          const on = k === st.stage;
          const ok = st.ok[k];
          const col = ok ? tok('safe') : on ? tok('danger') : tok('line');
          return (
            <g key={name}>
              <Box x={x} y={6} w={bw} h={40} r={6} fill={on ? tok('brand', 0.12) : ok ? tok('safe', 0.12) : tok('panel')} stroke={on ? tok('brand') : col}>
                <T x={x + bw / 2} y={20} size={12} weight={700} anchor="middle">{name}</T>
                <T x={x + bw / 2} y={36} size={10} anchor="middle" fill={ok ? tok('safe') : on ? tok('danger') : tok('muted')}>{ok ? 'works' : on ? 'broken' : 'not yet'}</T>
              </Box>
            </g>
          );
        })}
        <Box x={4} y={56} w={392} h={164} r={6} fill={tok('ink', 0.06)} stroke={tok('line')}>
          {st.term.map((l, j) => (
            <T key={j} x={14} y={72 + j * 17} size={11} mono fill={l.startsWith('$') ? tok('brand') : l.startsWith('#') || l.startsWith('//') ? tok('muted') : undefined}>{l}</T>
          ))}
        </Box>
      </Svg>
    </StepFrame>
  );
}
