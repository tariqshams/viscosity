import { StepFrame, useSteps } from '../../viz/stepper';
import { Svg, T, tok } from '../../viz/svg';
import { EDGES, Edge, NODES, Node } from './graph';

// Chapter 307b: a depth-first walk of the module graph from main. A module
// is finished (and can be compiled) only after everything it imports is
// finished, so the finishing order is a build order. The last step adds
// an import from c back to a, and the walk finds the cycle.
type S = { grey: string[]; done: string[]; hot?: [string, string]; cycle?: boolean; note: string };

const STATES: S[] = [
  { grey: [], done: [], note: 'An arrow points from a module to one it imports. We start a depth-first walk at main, the program’s entry point.' },
  { grey: ['main'], done: [], hot: ['main', 'a'], note: 'main is in progress (on the stack). Its first import is a, so we go there before doing anything else.' },
  { grey: ['main', 'a'], done: [], hot: ['a', 'c'], note: 'a is in progress too; its only import is c.' },
  { grey: ['main', 'a'], done: ['c'], note: 'c imports nothing, so it is finished at once: c is first in the build order.' },
  { grey: ['main'], done: ['c', 'a'], note: 'Everything a imports is finished, so a is finished: second.' },
  { grey: ['main', 'b'], done: ['c', 'a'], hot: ['b', 'c'], note: 'Back in main, the next import is b. b imports c, but c is already finished, so we skip it: each module is visited once.' },
  { grey: ['main', 'b'], done: ['c', 'a', 'd'], hot: ['b', 'd'], note: 'b’s other import, d, has no imports of its own: finished, third.' },
  { grey: ['main'], done: ['c', 'a', 'd', 'b'], note: 'b is finished, fourth.' },
  { grey: [], done: ['c', 'a', 'd', 'b', 'main'], note: 'main is finished last. The order c, a, d, b, main compiles (or runs) every module after everything it imports.' },
  { grey: ['main', 'a', 'c'], done: [], hot: ['c', 'a'], cycle: true, note: 'Now suppose c also imported a. Walking main, a, c, the walk meets a while a is still in progress: that is a cycle, a → c → a, and no order puts each before the other.' },
];

export default function OrderSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const fill = (id: string) => st.done.includes(id) ? tok('f3', 0.18) : st.grey.includes(id) ? tok('brand', 0.15) : tok('panel');
  const stroke = (id: string) => st.done.includes(id) ? tok('f3') : st.grey.includes(id) ? tok('brand') : tok('line');
  const hot = (a: string, b: string) => !!st.hot && st.hot[0] === a && st.hot[1] === b;
  return (
    <StepFrame title="A build order from a depth-first walk" steps={s} note={st.note}>
      <Svg w={400} h={236} title="Modules main, a, b, c and d, coloured as the walk reaches and finishes them, with the build order below">
        {EDGES.map(([a, b]) => <Edge key={a + b} from={a} to={b} hot={hot(a, b)} />)}
        {st.cycle && <Edge from="c" to="a" hot bend={2.2} />}
        {Object.keys(NODES).map((id) => <Node key={id} id={id} fill={fill(id)} stroke={stroke(id)} />)}
        <T x={8} y={200} size={11} weight={700} fill={tok('muted')}>IN PROGRESS</T>
        <T x={104} y={200} size={12} mono>{st.grey.join(' › ') || '(none)'}</T>
        <T x={8} y={222} size={11} weight={700} fill={tok('muted')}>BUILD ORDER</T>
        <T x={104} y={222} size={12} mono fill={st.cycle ? tok('muted') : undefined}>{st.cycle ? 'none: a cycle' : st.done.join(', ') || '(empty)'}</T>
      </Svg>
    </StepFrame>
  );
}
