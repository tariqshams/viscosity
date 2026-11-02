// Chapter 60: the resolver walks the tree once, before the program runs,
// keeping a stack of scopes and recording how far up each local lives.
import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

const CODE = `let x = "global";
{
  fn show() { print x; }
  show();
  let x = "block";
  show();
}`;

type Entry = { name: string; ready: boolean };
type Scope = { label: string; entries: Entry[] };
type S = { line: number; scopes: Scope[]; table: string[]; miss?: boolean; hit?: string; note: string };

const blk = (...e: Entry[]): Scope => ({ label: 'block', entries: e });
const show = { name: 'show', ready: true };

const STATES: S[] = [
  { line: 0, scopes: [], table: [], note: 'Top level. The scope stack is empty: the resolver doesn’t track globals at all. Nothing is recorded.' },
  { line: 1, scopes: [blk()], table: [], note: 'A block begins, so the resolver pushes an empty scope. Scopes hold only names, never values: nothing is running.' },
  { line: 2, scopes: [blk(show), { label: 'show’s body', entries: [] }], table: [], note: 'fn show puts show in the block’s scope. Then the resolver walks show’s body straight away, inside a new scope for it.' },
  { line: 2, scopes: [blk(show), { label: 'show’s body', entries: [] }], table: [], miss: true, note: 'print x: search the scopes from the innermost out. x is in neither, so it must be a global. Record nothing. This decision is now final.' },
  { line: 3, scopes: [blk(show)], table: ['show (line 4) → 0'], hit: 'show', note: 'show’s scope is popped. show() looks up show: found in the innermost scope, 0 scopes out. The resolver records 0 for this variable node.' },
  { line: 4, scopes: [blk(show, { name: 'x', ready: false })], table: ['show (line 4) → 0'], note: 'let x: first declare x as “not ready”. If its initializer used x, that would be an error.' },
  { line: 4, scopes: [blk(show, { name: 'x', ready: true })], table: ['show (line 4) → 0'], note: 'The initializer is just a string, so x is defined: ready. Too late for show, though: show’s x was already resolved as a global.' },
  { line: 5, scopes: [blk(show, { name: 'x', ready: true })], table: ['show (line 4) → 0', 'show (line 6) → 0'], hit: 'show', note: 'show() again: 0 scopes out. Then the block ends and its scope is popped. When the program runs, both calls print global.' },
];

export default function ResolveSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="The resolver walks the scopes" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={206} title="The resolver's stack of scopes on the left, innermost on top, and the table of recorded distances on the right">
        <T x={6} y={10} size={11} weight={700} fill={tok('muted')}>SCOPE STACK (innermost on top)</T>
        <T x={236} y={10} size={11} weight={700} fill={tok('muted')}>RECORDED DISTANCES</T>
        {st.scopes.length === 0 && <T x={10} y={44} size={13} fill={tok('muted')}>(empty: at top level)</T>}
        {[...st.scopes].reverse().map((sc, k) => {
          const y = 24 + k * 62;
          const inner = k === 0;
          return (
            <Box key={sc.label} x={6} y={y} w={210} h={54} fill={inner ? tok('accent', 0.1) : tok('panel')} stroke={inner ? tok('accent') : tok('line')}>
              <T x={14} y={y + 13} size={11} weight={700} fill={inner ? tok('accent') : tok('muted')}>{sc.label}</T>
              {sc.entries.length === 0 && <T x={14} y={y + 36} size={12} fill={tok('muted')}>(no names yet)</T>}
              {sc.entries.map((e, j) => (
                <T key={e.name} x={14 + j * 100} y={y + 36} size={13} mono weight={st.hit === e.name ? 700 : 400} fill={st.hit === e.name ? tok('brand') : undefined}>
                  {e.name}: {e.ready ? 'ready' : 'not ready'}
                </T>
              ))}
            </Box>
          );
        })}
        {st.miss && (
          <Box x={6} y={150} w={210} h={30} fill={tok('warn', 0.12)} stroke={tok('warn')}>
            <T x={14} y={165} size={12}>x not found → treat as global</T>
          </Box>
        )}
        <Box x={236} y={24} w={158} h={88}>
          {st.table.length === 0 && <T x={244} y={44} size={12} fill={tok('muted')}>(nothing yet)</T>}
          {st.table.map((r, k) => <T key={r} x={244} y={42 + k * 22} size={12} mono>{r}</T>)}
        </Box>
        <T x={236} y={130} size={11} fill={tok('muted')}>Globals get no entry:</T>
        <T x={236} y={146} size={11} fill={tok('muted')}>the interpreter looks</T>
        <T x={236} y={162} size={11} fill={tok('muted')}>them up in the globals.</T>
      </Svg>
    </StepFrame>
  );
}
