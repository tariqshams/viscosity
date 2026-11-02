import { StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// One line of code, split into pieces. kind 'type' = type syntax that
// tsc erases; 'fix' = the property name that is wrong, then fixed.
type Seg = [string, '' | 'type' | 'fix'];
const LINES: Seg[][] = [
  [['interface Particle {', 'type']],
  [['  x: number;', 'type']],
  [['  vx: number;', 'type']],
  [['}', 'type']],
  [['function step(p', ''], [': Particle', 'type'], [', dt', ''], [': number', 'type'], [') {', '']],
  [['  p.x = p.x + p.', ''], ['vX', 'fix'], [' * dt;', '']],
  [['}', '']],
];

type Stage = 'ts' | 'check' | 'js' | 'run';
type S = { stage: Stage; fixed: boolean; erase: 0 | 1 | 2; err?: boolean; out?: string; note: string };

const STATES: S[] = [
  { stage: 'ts', fixed: false, erase: 0, note: 'You write step.ts. The highlighted parts are type syntax: labels for the checker. Everything else is ordinary JavaScript.' },
  { stage: 'check', fixed: false, erase: 0, err: true, note: 'tsc reads the whole file before anything runs. It knows p is a Particle, and a Particle has no vX, so it reports the line. Nothing has run yet.' },
  { stage: 'check', fixed: true, erase: 0, note: 'You fix the typo to vx. Now every use of p matches the Particle label, and the checker has nothing to report.' },
  { stage: 'check', fixed: true, erase: 1, note: 'Next tsc erases the types: the whole interface and every ": label" are deleted. Nothing else in the code changes.' },
  { stage: 'js', fixed: true, erase: 2, note: 'What is left is plain JavaScript, step.js. This is the only file the engine ever sees.' },
  { stage: 'run', fixed: true, erase: 2, out: 'p.x is now 1', note: 'The engine runs step.js. No types exist any more. If bad data arrived now, nothing would check it: the checking all happened earlier.' },
];

const STAGES: { id: Stage; label: string; x: number }[] = [
  { id: 'ts', label: 'step.ts', x: 4 },
  { id: 'check', label: 'tsc', x: 104 },
  { id: 'js', label: 'step.js', x: 204 },
  { id: 'run', label: 'engine', x: 304 },
];

export default function EraseSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="From TypeScript to running JavaScript" steps={s} note={st.note}>
      <Svg w={400} h={54} title="The pipeline: step.ts goes through tsc, which checks and erases types, giving step.js, which the engine runs">
        {STAGES.map((g, k) => {
          const on = g.id === st.stage;
          return (
            <g key={g.id}>
              <Box x={g.x} y={8} w={88} h={36} fill={on ? tok('brand', 0.18) : tok('panel')} stroke={on ? tok('brand') : tok('ink', 0.35)}>
                <T x={g.x + 44} y={26.5} size={14} mono weight={on ? 700 : 400} anchor="middle">{g.label}</T>
              </Box>
              {k < 3 && <Arrow x1={g.x + 89} y1={26} x2={g.x + 103} y2={26} width={1.5} />}
            </g>
          );
        })}
      </Svg>
      <pre className="code-surface !my-2 font-mono">
        {LINES.map((line, k) => {
          if (st.erase === 2 && line.every(([, kind]) => kind === 'type')) return null;
          const errLine = st.err && line.some(([, kind]) => kind === 'fix');
          return (
            <div key={k} className={errLine ? '-mx-[0.85rem] bg-danger/15 px-[0.85rem] shadow-[inset_3px_0_0_rgb(var(--danger))]' : ''}>
              {line.map(([text, kind], j) => {
                if (kind === 'type') {
                  if (st.erase === 2) return null;
                  return (
                    <span key={j} style={{ color: tok('brand'), fontWeight: 700, textDecoration: st.erase === 1 ? 'line-through' : undefined, opacity: st.erase === 1 ? 0.45 : 1 }}>{text}</span>
                  );
                }
                if (kind === 'fix') {
                  return <span key={j} style={{ color: st.fixed ? tok('safe') : tok('danger'), fontWeight: 700 }}>{st.fixed ? 'vx' : 'vX'}</span>;
                }
                return <span key={j}>{text}</span>;
              })}
            </div>
          );
        })}
      </pre>
      <div className="min-h-[2.6em] font-mono text-[13px]">
        {st.err && <span style={{ color: tok('danger') }}>error: Property &apos;vX&apos; does not exist on type &apos;Particle&apos;. Did you mean &apos;vx&apos;?</span>}
        {st.out && <span className="text-muted">step({'{'} x: 0, vx: 2 {'}'}, 0.5) → {st.out}</span>}
      </div>
    </StepFrame>
  );
}
