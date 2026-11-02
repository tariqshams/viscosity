import { StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

// The vm.Script experiment of 'Bytecode caches', step by step. Every
// number and true/false is from real runs on Node v22.23.4 (V8 12.4):
// 528 and 672 bytes, accepted for the same source, rejected for one
// extra space, and (the surprise) accepted for a same-length edit.
type S = { src: string; cache: string; check: string; ok: boolean | null; fns: string; note: string };

const STATES: S[] = [
  { src: 'add, sub, add(1, 2)', cache: '(none)', check: '', ok: null, fns: 'add: lazy · sub: lazy', note: 'new vm.Script(src) parses and compiles the top level. add and sub are only preparsed: lazy, with no bytecode yet.' },
  { src: 'add, sub, add(1, 2)', cache: '528 bytes', check: '', ok: null, fns: 'add: lazy · sub: lazy', note: 'createCachedData() serializes what has been compiled so far into bytes: the top level only, 528 bytes.' },
  { src: 'add, sub, add(1, 2)', cache: '672 bytes', check: '', ok: null, fns: 'add: bytecode · sub: lazy', note: 'Run the script: add(1, 2) compiles add. A second createCachedData() now includes add’s bytecode, 672 bytes. sub was never called, so it is still not in the cache.' },
  { src: 'same source', cache: '672 bytes', check: 'same length', ok: true, fns: 'nothing to compile', note: 'A new vm.Script for the same source, given the 672 bytes: cachedDataRejected is false. V8 rebuilds the compiled code from the bytes instead of parsing and compiling.' },
  { src: 'source + one space', cache: '672 bytes', check: 'length differs', ok: false, fns: 'compile from scratch', note: 'One extra space: cachedDataRejected is true. The cache does not match, so V8 ignores it and compiles the source the ordinary way.' },
  { src: 'a + b → a - b', cache: '672 bytes', check: 'same length', ok: true, fns: 'old bytecode runs!', note: 'The surprise: change a + b to a - b, which keeps the length, and V8 12.4 accepts the cache, and the old a + b code runs. V8’s own check is coarse; making sure a cache belongs to exactly this file is the embedder’s job (Chrome, or Node’s compile cache).' },
];

export default function CacheCheckSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const col = st.ok === null ? tok('line') : st.ok ? tok('safe') : tok('danger');
  return (
    <StepFrame title="Making a cache, then offering it back" steps={s} note={st.note}>
      <Svg w={400} h={150} title="Three boxes: the source being loaded, the cached data offered with it, and V8's check, which is accepted or rejected. A line below says what was compiled.">
        <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>SOURCE</T>
        <Box x={8} y={22} w={150} h={34} fill={tok('panel')}>
          <T x={83} y={39} size={12} mono anchor="middle">{st.src}</T>
        </Box>
        <T x={170} y={12} size={11} weight={700} fill={tok('muted')}>CACHED DATA</T>
        <Box x={170} y={22} w={96} h={34} fill={st.cache === '(none)' ? tok('panel') : tok('accent', 0.15)} stroke={st.cache === '(none)' ? tok('line') : tok('accent')} dash={st.cache === '(none)'}>
          <T x={218} y={39} size={12} mono anchor="middle">{st.cache}</T>
        </Box>
        <T x={278} y={12} size={11} weight={700} fill={tok('muted')}>V8'S CHECK</T>
        <Box x={278} y={22} w={114} h={34} fill={st.ok === null ? tok('panel') : st.ok ? tok('safe', 0.15) : tok('danger', 0.15)} stroke={col} dash={st.ok === null}>
          <T x={335} y={32} size={11} anchor="middle" fill={tok('muted')}>{st.check || 'not asked yet'}</T>
          <T x={335} y={47} size={12} weight={700} anchor="middle" fill={col}>{st.ok === null ? '' : st.ok ? 'accepted' : 'rejected'}</T>
        </Box>
        <T x={8} y={84} size={11} weight={700} fill={tok('muted')}>COMPILED CODE</T>
        <Box x={8} y={94} w={384} h={34} fill={st.fns.includes('!') ? tok('warn', 0.15) : tok('panel')} stroke={st.fns.includes('!') ? tok('warn') : tok('line')}>
          <T x={200} y={111} size={12} mono anchor="middle">{st.fns}</T>
        </Box>
      </Svg>
    </StepFrame>
  );
}
