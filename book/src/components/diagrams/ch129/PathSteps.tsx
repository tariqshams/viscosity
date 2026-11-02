import { StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// Chapter 129: following a path through drip-rs's module tree (src/lib.rs
// declares the modules; scanner.rs holds an inline `mod tests`). Only part
// of the tree is drawn. The failing case is real rustc 1.97 output (E0432).
type Id = 'crate' | 'chunk' | 'compiler' | 'gc' | 'scanner' | 'tests' | 'vm';
type S = { from: Id | null; path: string; visit: Id[]; found?: string; bad?: boolean; note: string };

const POS: Record<Id, { x: number; y: number }> = {
  crate: { x: 160, y: 10 },
  chunk: { x: 6, y: 80 },
  compiler: { x: 84, y: 80 },
  gc: { x: 162, y: 80 },
  scanner: { x: 240, y: 80 },
  vm: { x: 318, y: 80 },
  tests: { x: 240, y: 150 },
};
const W = 76;
const H = 30;
const PARENT: Partial<Record<Id, Id>> = { chunk: 'crate', compiler: 'crate', gc: 'crate', scanner: 'crate', vm: 'crate', tests: 'scanner' };

const STATES: S[] = [
  { from: null, path: '', visit: [], note: 'drip-rs’s library is a tree of modules rooted at crate (the file src/lib.rs). scanner has a child module of its own, tests, written inline in scanner.rs.' },
  { from: 'compiler', path: 'crate::scanner::Token', visit: ['crate'], note: 'Code in compiler.rs writes use crate::scanner::Token. A path that starts with crate:: starts at the root, like / at the start of a file path.' },
  { from: 'compiler', path: 'crate::scanner::Token', visit: ['crate', 'scanner'], found: 'Token', note: 'Then down into scanner, where Token is defined. From now on, compiler.rs can write plain Token.' },
  { from: 'tests', path: 'super::*', visit: ['scanner'], found: 'everything in scanner', note: 'Inside scanner’s tests module, use super::* means: go up to the parent (scanner) and bring in every name defined there. That is how a test reaches the code it tests.' },
  { from: 'vm', path: 'self::Options', visit: ['vm'], found: 'Options', note: 'self:: starts in the current module. In vm.rs, self::Options and plain Options name the same struct.' },
  { from: 'compiler', path: 'scanner::Token', visit: ['compiler'], bad: true, note: 'Without crate::, a use path starts in the current module. compiler has no child called scanner, so rustc 1.97 reports E0432, unresolved import, and suggests crate::scanner.' },
];

export default function PathSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="Following a path through the module tree" steps={s} note={st.note}>
      <Svg w={400} h={236} title="drip-rs's module tree, with the modules a path visits highlighted">
        {(Object.keys(PARENT) as Id[]).map((id) => {
          const p = POS[id];
          const q = POS[PARENT[id]!];
          return <line key={id} x1={q.x + W / 2} y1={q.y + H} x2={p.x + W / 2} y2={p.y} stroke={tok('line')} strokeWidth={1.5} />;
        })}
        {(Object.keys(POS) as Id[]).map((id) => {
          const p = POS[id];
          const lit = st.visit.includes(id);
          const isFrom = st.from === id;
          const col = st.bad && lit ? 'danger' : lit ? 'brand' : isFrom ? 'accent' : 'line';
          return (
            <Box key={id} x={p.x} y={p.y} w={W} h={H} r={5} fill={lit ? tok(col, 0.18) : tok('panel')} stroke={tok(col)}>
              <T x={p.x + W / 2} y={p.y + H / 2} size={12} mono anchor="middle">{id}</T>
            </Box>
          );
        })}
        {st.from && (
          <T x={POS[st.from].x + W / 2} y={POS[st.from].y + H + 12} size={11} anchor="middle" fill={tok('accent')}>you are here</T>
        )}
        {st.from === 'tests' && <Arrow x1={278} y1={148} x2={278} y2={114} color={tok('brand')} />}
        {st.path && (
          <T x={8} y={210} size={13} mono weight={700} fill={st.bad ? tok('danger') : undefined}>use {st.path};</T>
        )}
        {st.found && <T x={8} y={228} size={11} fill={tok('safe')}>found: {st.found}</T>}
        {st.bad && <T x={8} y={228} size={11} fill={tok('danger')}>error[E0432]: unresolved import `scanner`</T>}
      </Svg>
    </StepFrame>
  );
}
