import { StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// Chapter 160: viscosity profile and --profile in the Rust CLI
// (engine/rust/crates/cli/src/profile.rs and read_profile in main.rs),
// on the chapter's spawn.js. Which boxes run Rust and which run node.
type K = 'src' | 'inst' | 'file' | 'node' | 'json' | 'read' | 'plan';
type S = { hi: K[]; line?: string; note: string };

const STATES: S[] = [
  { hi: ['src'], line: 'const ps = [];', note: 'The input is the original spawn.js. Nothing about it changes on disk; the profile run uses a copy.' },
  { hi: ['inst'], line: 'const ps = __vsc_track("ps", []);', note: 'Rust: instrument() lowers the source with JsPlugin, runs analyze(), and wraps each collection’s initialiser. Edits go last-first, so earlier byte offsets stay valid.' },
  { hi: ['file'], line: 'PRELUDE + instrumented source', note: 'Rust writes instrumented.cjs to a temporary directory: the JavaScript prelude (copied from the TS CLI) followed by the edited program.' },
  { hi: ['node'], line: 'Command::new("node")', note: 'node runs it, with VSC_PROFILE_OUT in its environment, stdin empty and stdout thrown away. Rust waits for the exit status: non-zero is an error. The temporary directory is removed either way.' },
  { hi: ['json'], line: '{ "ps": { "maxLength": 20 } }', note: 'At exit the hook reads each tracked array’s length and writes JSON.stringify(p, null, 2). Node wrote it, as in the TS CLI, so the bytes are the same.' },
  { hi: ['read'], line: 'HashMap { "ps": 20.0 }', note: 'Later, --profile p.json: read_profile parses it with serde_json and checks every entry: an object with a non-negative maxLength, keyed by name. Anything else is an error, worded as in the TS CLI.' },
  { hi: ['plan'], line: 'measured.or(c.size_estimate)', note: 'plan_one looks up the collection’s name. 20 is below the 64-element threshold, so ps is kept as objects: “about 20 elements (measured)”.' },
];

const B: Record<K, { x: number; y: number; w: number; label: string; who: 'rust' | 'node' | 'file' }> = {
  src: { x: 10, y: 14, w: 110, label: 'spawn.js', who: 'file' },
  inst: { x: 145, y: 14, w: 110, label: 'instrument()', who: 'rust' },
  file: { x: 280, y: 14, w: 110, label: 'instrumented.cjs', who: 'file' },
  node: { x: 280, y: 84, w: 110, label: 'node', who: 'node' },
  json: { x: 145, y: 84, w: 110, label: 'profile.json', who: 'file' },
  read: { x: 10, y: 84, w: 110, label: 'read_profile', who: 'rust' },
  plan: { x: 10, y: 154, w: 110, label: 'plan_one', who: 'rust' },
};

export default function ProfileSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const fill = (k: K) => {
    const on = st.hi.includes(k);
    const base = B[k].who === 'rust' ? 'brand' : B[k].who === 'node' ? 'f3' : 'line';
    return on ? tok(base, 0.25) : tok('panel');
  };
  return (
    <StepFrame title="Profiling, from Rust through node and back" steps={s} note={st.note}>
      <Svg w={400} h={240} title="Rust instruments the program, node runs it and writes JSON, Rust reads the JSON into the planner">
        <Arrow x1={120} y1={29} x2={143} y2={29} color={tok('ink', 0.4)} width={1.5} />
        <Arrow x1={255} y1={29} x2={278} y2={29} color={tok('ink', 0.4)} width={1.5} />
        <Arrow x1={335} y1={44} x2={335} y2={82} color={tok('ink', 0.4)} width={1.5} />
        <Arrow x1={280} y1={99} x2={257} y2={99} color={tok('ink', 0.4)} width={1.5} />
        <Arrow x1={145} y1={99} x2={122} y2={99} color={tok('ink', 0.4)} width={1.5} />
        <Arrow x1={65} y1={114} x2={65} y2={152} color={tok('ink', 0.4)} width={1.5} />
        {(Object.keys(B) as K[]).map((k) => (
          <Box key={k} x={B[k].x} y={B[k].y} w={B[k].w} h={30} r={4} fill={fill(k)}
            stroke={st.hi.includes(k) ? tok('ink', 0.8) : tok('line')}>
            <T x={B[k].x + B[k].w / 2} y={B[k].y + 15} size={11} mono anchor="middle">{B[k].label}</T>
          </Box>
        ))}
        <Box x={145} y={158} w={14} h={10} r={2} fill={tok('brand', 0.25)} />
        <T x={164} y={163} size={11} fill={tok('muted')}>Rust</T>
        <Box x={200} y={158} w={14} h={10} r={2} fill={tok('f3', 0.25)} />
        <T x={219} y={163} size={11} fill={tok('muted')}>node</T>
        <Box x={255} y={158} w={14} h={10} r={2} fill={tok('panel')} stroke={tok('line')} />
        <T x={274} y={163} size={11} fill={tok('muted')}>a file</T>
        {st.line && (
          <T x={200} y={214} size={11} mono anchor="middle" fill={tok('ink')}>{st.line}</T>
        )}
      </Svg>
    </StepFrame>
  );
}
