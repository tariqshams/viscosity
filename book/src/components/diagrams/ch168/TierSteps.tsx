// Chapter 168: three engines' tier ladders, side by side. Only tiers named
// in each engine's own sources are shown: V8 (v8.dev Maglev post),
// JavaScriptCore (runtime/OptionsList.h), SpiderMonkey (jit/JitOptions.cpp).
// The "guess fails" step uses: V8 deoptimizes to interpreter frames (Maglev
// post), JSC's DFG exits "into baseline code" (dfg/DFGOSRExit.h), and
// SpiderMonkey's Ion bails out to the Baseline Interpreter (jit/Bailouts.h).
import { StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

type Kind = 'interp' | 'base' | 'opt';
type Engine = { name: string; sub: string; rungs: { label: string; kind: Kind }[] };

const ENGINES: Engine[] = [
  { name: 'V8', sub: 'Chrome, Node', rungs: [
    { label: 'Ignition', kind: 'interp' },
    { label: 'Sparkplug', kind: 'base' },
    { label: 'Maglev', kind: 'opt' },
    { label: 'TurboFan', kind: 'opt' },
  ] },
  { name: 'JavaScriptCore', sub: 'Safari', rungs: [
    { label: 'LLInt', kind: 'interp' },
    { label: 'Baseline JIT', kind: 'base' },
    { label: 'DFG JIT', kind: 'opt' },
    { label: 'FTL JIT', kind: 'opt' },
  ] },
  { name: 'SpiderMonkey', sub: 'Firefox', rungs: [
    { label: 'C++ interp.', kind: 'interp' },
    { label: 'Baseline Interp.', kind: 'interp' },
    { label: 'Baseline JIT', kind: 'base' },
    { label: 'Ion (Warp)', kind: 'opt' },
  ] },
];

type S = { on: number[][]; exit?: [number, number][]; note: string };

const STATES: S[] = [
  { on: [[0], [0], [0]], note: 'Cold code. All three engines start by interpreting bytecode. SpiderMonkey even has two interpreters: a C++ one, and a Baseline Interpreter that a function enters after 10 calls or loop iterations by default.' },
  { on: [[1], [1], [1, 2]], note: 'Warm code. Each engine has a quick, non-optimizing step up. SpiderMonkey’s Baseline JIT takes over at 100 by default. These tiers turn bytecode into machine code quickly, without heavy optimization.' },
  { on: [[2, 3], [2, 3], [3]], note: 'Hot code. V8 and JavaScriptCore each have two optimizing tiers, a quicker one and a stronger one. SpiderMonkey has one, Ion, whose front end Warp reads what the baseline inline caches saw.' },
  { on: [[3], [2], [3]], exit: [[3, 0], [2, 1], [3, 1]], note: 'A guess fails. All three throw the optimized frame away and rebuild a slower one, but they land on different rungs: V8 in the interpreter, JSC’s DFG in baseline code, SpiderMonkey in the Baseline Interpreter.' },
];

const fill = (k: Kind) => (k === 'interp' ? tok('f2') : k === 'base' ? tok('f3') : tok('brand'));

export default function TierSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const colW = 128;
  const rungH = 30;
  const top = 50;
  const yOf = (r: number) => top + (3 - r) * (rungH + 10);
  return (
    <StepFrame title="Three engines, three ladders" steps={s} note={st.note}>
      <Svg w={400} h={230} title="Tier ladders of V8, JavaScriptCore and SpiderMonkey, with the active tiers highlighted">
        {ENGINES.map((e, c) => {
          const x = 6 + c * (colW + 4);
          return (
            <g key={e.name}>
              <T x={x + colW / 2} y={12} size={12} weight={700} anchor="middle">{e.name}</T>
              <T x={x + colW / 2} y={28} size={11} anchor="middle" fill={tok('muted')}>{e.sub}</T>
              {e.rungs.map((r, i) => {
                const on = st.on[c].includes(i);
                return (
                  <Box key={r.label} x={x + 10} y={yOf(i)} w={colW - 20} h={rungH} fill={on ? fill(r.kind) : tok('panel')} stroke={fill(r.kind)} opacity={on ? 1 : 0.55}>
                    <T x={x + colW / 2} y={yOf(i) + rungH / 2} size={11} anchor="middle" weight={on ? 700 : 400} fill={on ? tok('paper') : tok('ink')}>{r.label}</T>
                  </Box>
                );
              })}
              {st.exit && (() => {
                const [from, to] = st.exit[c];
                return <Arrow x1={x + colW - 8} y1={yOf(from) + rungH / 2} x2={x + colW - 8} y2={yOf(to) + rungH / 2} bend={-1.2} color={tok('f6')} />;
              })()}
            </g>
          );
        })}
        <rect x={8} y={216} width={10} height={10} fill={tok('f2')} />
        <T x={22} y={221} size={11}>interpreter</T>
        <rect x={102} y={216} width={10} height={10} fill={tok('f3')} />
        <T x={116} y={221} size={11}>baseline JIT</T>
        <rect x={200} y={216} width={10} height={10} fill={tok('brand')} />
        <T x={214} y={221} size={11}>optimizing JIT</T>
      </Svg>
    </StepFrame>
  );
}
