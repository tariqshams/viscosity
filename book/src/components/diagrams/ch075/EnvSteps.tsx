import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const CODE = `let a = "global";
let b = "also";
{
  let a = "outer";
  {
    let a = "inner";
    print a;
    print b;
  }
  print a;
}
print a;`;

/** One environment: its name/value pairs, and whether it is still in use. */
type Env = { title: string; vars: [string, string][]; gone?: boolean };
type S = {
  line: number;
  envs: Env[]; // envs[k]'s parent is envs[k - 1]
  cur: number; // which environment the interpreter is using
  checked?: number[]; // environments a lookup looked in
  found?: [number, string]; // where the lookup succeeded
  out: string[];
  note: string;
};

const G = (b = true): Env => ({ title: 'globals', vars: b ? [['a', '"global"'], ['b', '"also"']] : [['a', '"global"']] });
const E1 = (gone = false): Env => ({ title: 'block 1', vars: [['a', '"outer"']], gone });
const E2 = (gone = false): Env => ({ title: 'block 2', vars: [['a', '"inner"']], gone });

const STATES: S[] = [
  { line: 0, envs: [G(false)], cur: 0, out: [], note: 'The program starts with one environment: the globals. It has no parent. let a defines a in it.' },
  { line: 1, envs: [G()], cur: 0, out: [], note: 'let b defines b in the same table. So far this is exactly the single global table from the last chapter.' },
  { line: 2, envs: [G(), { title: 'block 1', vars: [] }], cur: 1, out: [], note: 'A { starts a block. The interpreter makes a NEW, empty environment whose parent arrow points at the current one, and switches to it.' },
  { line: 3, envs: [G(), E1()], cur: 1, out: [], note: 'let a defines a in the CURRENT environment only. The global a is untouched. Two variables are now called a.' },
  { line: 4, envs: [G(), E1(), { title: 'block 2', vars: [] }], cur: 2, out: [], note: 'Another block, another environment. Its parent is block 1, whose parent is the globals: a chain.' },
  { line: 5, envs: [G(), E1(), E2()], cur: 2, out: [], note: 'A third a, in block 2. Three tables, three variables, one name.' },
  { line: 6, envs: [G(), E1(), E2()], cur: 2, checked: [2], found: [2, 'a'], out: ['inner'], note: 'Looking up a starts in the current environment, and finds it straight away. The search stops at the first match, so the outer two a’s are hidden.' },
  { line: 7, envs: [G(), E1(), E2()], cur: 2, checked: [2, 1, 0], found: [0, 'b'], out: ['inner', 'also'], note: 'b is not in block 2. Follow the parent arrow: not in block 1 either. Follow it again: found in the globals.' },
  { line: 8, envs: [G(), E1(), E2(true)], cur: 1, out: ['inner', 'also'], note: 'The inner block ends. The interpreter switches back to the environment it saved before the block, block 1. Nothing points at block 2 any more.' },
  { line: 9, envs: [G(), E1(), E2(true)], cur: 1, checked: [1], found: [1, 'a'], out: ['inner', 'also', 'outer'], note: 'Now a is found in block 1. The "inner" a is gone along with its table.' },
  { line: 10, envs: [G(), E1(true), E2(true)], cur: 0, out: ['inner', 'also', 'outer'], note: 'The outer block ends too. The current environment is the globals again.' },
  { line: 11, envs: [G(), E1(true), E2(true)], cur: 0, checked: [0], found: [0, 'a'], out: ['inner', 'also', 'outer', 'global'], note: 'And a means the global a once more. Shadowing lasted exactly as long as each block.' },
];

const BW = 200;
const BH = 52;
const pos = (k: number) => ({ x: 8 + k * 40, y: 26 + k * 66 });

export default function EnvSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="The environment chain, block by block" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={226} title="Environments as boxes. Each block's environment has an arrow to its parent. A lookup checks the current box, then follows the arrows.">
        <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>ENVIRONMENTS (arrow = parent)</T>
        {st.envs.map((e, k) => {
          const { x, y } = pos(k);
          const cur = k === st.cur;
          const checked = st.checked?.includes(k);
          return (
            <g key={k} opacity={e.gone ? 0.4 : 1}>
              {k > 0 && <Arrow x1={x + 24} y1={y} x2={pos(k - 1).x + 24} y2={pos(k - 1).y + BH} color={checked && st.checked?.includes(k - 1) ? tok('warn') : tok('ink', 0.5)} />}
              <Box x={x} y={y} w={BW} h={BH} dash={e.gone} fill={cur ? tok('brand', 0.12) : tok('panel')} stroke={cur ? tok('brand') : checked ? tok('warn') : tok('ink', 0.4)}>
                <T x={x + 12} y={y + 13} size={11} weight={700} fill={cur ? tok('brand') : tok('muted')}>
                  {e.title}{cur ? ' (current)' : ''}{e.gone ? ' (discarded)' : ''}
                </T>
                {e.vars.length === 0 && <T x={x + 12} y={y + 34} size={12} fill={tok('muted')}>(empty)</T>}
                {e.vars.map(([n, v], j) => {
                  const hit = st.found && st.found[0] === k && st.found[1] === n;
                  return (
                    <T key={n} x={x + 12 + j * 104} y={y + 35} size={12} mono weight={hit ? 700 : 400} fill={hit ? tok('safe') : undefined}>
                      {n} = {v}
                    </T>
                  );
                })}
              </Box>
            </g>
          );
        })}
        <Box x={296} y={26} w={96} h={190} fill="transparent" stroke={tok('line')}>
          <T x={306} y={40} size={11} weight={700} fill={tok('muted')}>OUTPUT</T>
          {st.out.map((l, j) => (
            <T key={j} x={306} y={62 + j * 20} size={13} mono>{l}</T>
          ))}
        </Box>
      </Svg>
    </StepFrame>
  );
}
