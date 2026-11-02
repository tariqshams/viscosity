import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// Chapter 203: the same particle program in JavaScript and in Python,
// through two plugins and one shared core. The VIR lines and the verdicts
// are real engine output (printFunc and `viscosity explain`), trimmed.
const JS = `const ps = [];
for (let i = 0; i < 1000; i++)
  ps.push({ x: i, vx: 1 });
for (const p of ps)
  p.x += p.vx;`;

const PY = `ps = []
for i in range(1000):
    ps.append(P(float(i), 1.0))
for p in ps:
    p.x += p.vx`;

type Side = 'js' | 'py' | 'both';
type S = { code: 'js' | 'py'; line: number | null; lit: Side | 'core' | null; box: string[]; js?: string; py?: string; note: string };

const STATES: S[] = [
  { code: 'js', line: null, lit: null, box: [], note: 'Two programs that mean the same thing: a thousand particles, then one loop that moves them. (The Python one uses a dataclass P with fields x and vx.)' },
  { code: 'js', line: 2, lit: 'js', box: ['record {x, vx} %3, %7', 'push %6, %8'], note: 'The JavaScript plugin parses with acorn and lowers. The object literal becomes record.new, and ps.push becomes push.' },
  { code: 'py', line: 2, lit: 'py', box: ['record {x, vx} %9, %10', 'push %8, %11'], note: 'The Python plugin has its own tokenizer and parser. It knows that P(…) builds a dataclass, so it lowers it to the same record.new, and append to the same push.' },
  { code: 'py', line: 4, lit: 'core', box: ['collection ps {x, vx}', 'loop touches x, vx', 'no element escapes'], note: 'From here the core runs. It works on VIR, not syntax, so the same analyses find the same facts in both programs.' },
  { code: 'js', line: null, lit: 'core', box: ['module.language is a fact too'], js: 'struct of arrays', py: 'kept as objects', note: 'The planner reads one language fact: in CPython, columns were measured slower per element. So JavaScript gets struct of arrays, and Python keeps its objects and explains why.' },
  { code: 'py', line: null, lit: 'both', box: ['each plugin rewrites its own text'], js: 'ps.x[p] += ps.vx[p]', py: 'ps.x[p] += ps.vx[p]', note: 'With “# @viscosity soa” above the Python list, it opts in. Each plugin’s emit now rewrites its own syntax from the same kind of plan.' },
];

export default function TwoPlugins() {
  const s = useSteps(STATES);
  const st = s.state;
  const lit = (side: 'js' | 'py' | 'core') => st.lit === side || (st.lit === 'both' && side !== 'core');
  return (
    <StepFrame title="Two plugins, one core" steps={s} note={st.note}>
      <div className="mb-1 text-xs font-semibold text-muted">{st.code === 'js' ? 'JavaScript' : 'Python'}</div>
      <CodeTrace code={st.code === 'js' ? JS : PY} line={st.line} />
      <Svg w={400} h={260} title="A JavaScript plugin and a Python plugin feeding one shared core">
        <Box x={8} y={8} w={180} h={36} fill={lit('js') ? tok('f3', 0.18) : 'transparent'} stroke={lit('js') ? tok('f3') : tok('line')}>
          <T x={98} y={26} size={12} anchor="middle" weight={lit('js') ? 700 : 400}>JavaScript plugin</T>
        </Box>
        <Box x={212} y={8} w={180} h={36} fill={lit('py') ? tok('f4', 0.18) : 'transparent'} stroke={lit('py') ? tok('f4') : tok('line')}>
          <T x={302} y={26} size={12} anchor="middle" weight={lit('py') ? 700 : 400}>Python plugin</T>
        </Box>
        <Arrow x1={98} y1={44} x2={170} y2={72} />
        <Arrow x1={302} y1={44} x2={230} y2={72} />
        <Box x={60} y={72} w={280} h={110} fill={lit('core') ? tok('brand', 0.12) : 'transparent'} stroke={lit('core') ? tok('brand') : tok('line')}>
          <T x={200} y={88} size={11} anchor="middle" weight={700} fill={tok('brand')}>VIR · analyze · plan (shared)</T>
          {st.box.map((l, k) => <T key={k} x={200} y={112 + k * 22} size={11} mono anchor="middle">{l}</T>)}
        </Box>
        <Arrow x1={170} y1={182} x2={98} y2={210} />
        <Arrow x1={230} y1={182} x2={302} y2={210} />
        <Box x={8} y={210} w={180} h={40} stroke={st.js ? tok('f3') : tok('line')} dash={!st.js}>
          <T x={98} y={230} size={11} mono anchor="middle">{st.js ?? 'JS out'}</T>
        </Box>
        <Box x={212} y={210} w={180} h={40} stroke={st.py ? tok('f4') : tok('line')} dash={!st.py}>
          <T x={302} y={230} size={11} mono anchor="middle">{st.py ?? 'Python out'}</T>
        </Box>
      </Svg>
    </StepFrame>
  );
}
