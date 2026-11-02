// Chapter 418: three ways to hold "a plugin" in engine/rust, with the
// errors rustc 1.97 really gave for the first two (compiled against the
// real viscosity-core, viscosity-frontend-js and viscosity-frontend-python
// crates), and the branch the port uses instead (crates/wasm/src/lib.rs,
// run_language; crates/cli/src/main.rs does the same by file extension).
import { StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

type S = {
  slot: string[];
  js: 'none' | 'ok' | 'bad';
  py: 'none' | 'ok' | 'bad';
  err?: string[];
  good?: boolean;
  note: string;
};

const STATES: S[] = [
  { slot: ['trait LanguagePlugin {', '  type Extra;', '  fn lower(..) -> ..<Extra>', '  fn emit(.., &..<Extra>)', '}'], js: 'none', py: 'none', note: 'The trait has an associated type, Extra: whatever the plugin carries from lower to emit. JsPlugin says type Extra = JsExtra; PyPlugin says type Extra = PyExtra. Two plugins, two different Extras.' },
  { slot: ['Vec<&dyn LanguagePlugin>'], js: 'bad', py: 'bad', err: ['error[E0191]: the value of the', 'associated type `Extra` in', '`LanguagePlugin` must be specified'], note: 'First try: a list of trait objects, as the chapter Trait objects and dyn did with &dyn Plugin. rustc refuses to even name the type. A trait object must say what every associated type is.' },
  { slot: ['Vec<&dyn LanguagePlugin<', '    Extra = JsExtra>>'], js: 'ok', py: 'bad', err: ['error[E0271]: type mismatch', 'resolving `<PyPlugin as', 'LanguagePlugin>::Extra == JsExtra`'], note: 'Say it, then. Now the type exists and JsPlugin fits, so the trait is dyn compatible. But PyPlugin’s Extra is PyExtra, so it is a different trait-object type. No single dyn type covers both.' },
  { slot: ['if py {', '  compile(&src, &PyPlugin, o)', '} else {', '  compile(&src, &JsPlugin, o)', '}'], js: 'ok', py: 'ok', good: true, note: 'The port branches before it calls compile. Each arm calls its own monomorphized copy, compile::<PyPlugin> or compile::<JsPlugin>, and Extra never leaves it.' },
  { slot: ['-> Result<CompileResult,', '           CompileError>'], js: 'ok', py: 'ok', good: true, note: 'Both arms return the same type: CompileResult holds code, plan, analysis and explain, and none of them mentions Extra. So the if has one type, and the caller never learns which plugin ran.' },
];

const fillFor = (v: S['js']) => (v === 'ok' ? tok('safe', 0.15) : v === 'bad' ? tok('danger', 0.12) : tok('panel'));
const strokeFor = (v: S['js']) => (v === 'ok' ? tok('safe') : v === 'bad' ? tok('danger') : tok('line'));

export default function DispatchSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="Holding any plugin" steps={s} note={st.note}>
      <Svg w={400} h={270} title="Two plugins with different Extra types, and three attempts to treat them as one">
        <Box x={10} y={14} w={140} h={46} r={5} fill={fillFor(st.js)} stroke={strokeFor(st.js)}>
          <T x={20} y={30} size={11} mono weight={700}>JsPlugin</T>
          <T x={20} y={48} size={11} mono>Extra = JsExtra</T>
        </Box>
        <Box x={10} y={74} w={140} h={46} r={5} fill={fillFor(st.py)} stroke={strokeFor(st.py)}>
          <T x={20} y={90} size={11} mono weight={700}>PyPlugin</T>
          <T x={20} y={108} size={11} mono>Extra = PyExtra</T>
        </Box>
        <Arrow x1={152} y1={37} x2={176} y2={60} color={strokeFor(st.js)} width={1.6} />
        <Arrow x1={152} y1={97} x2={176} y2={76} color={strokeFor(st.py)} width={1.6} />
        <Box x={180} y={14} w={212} h={106} r={5} fill={st.good ? tok('safe', 0.08) : tok('panel')} stroke={st.good ? tok('safe') : tok('brand')}>
          {st.slot.map((l, k) => (
            <T key={k} x={188} y={30 + k * 18} size={11} mono>{l}</T>
          ))}
        </Box>
        {st.err && (
          <Box x={10} y={140} w={382} h={70} r={5} fill={tok('danger', 0.08)} stroke={tok('danger')}>
            {st.err.map((l, k) => (
              <T key={k} x={20} y={158 + k * 17} size={11} mono fill={tok('danger')}>{l}</T>
            ))}
          </Box>
        )}
        {st.good && (
          <Box x={10} y={140} w={382} h={70} r={5} fill={tok('safe', 0.1)} stroke={tok('safe')}>
            <T x={20} y={160} size={11} mono>compile::&lt;JsPlugin&gt; · compile::&lt;PyPlugin&gt;</T>
            <T x={20} y={182} size={11}>one copy per plugin; Extra stays inside each</T>
          </Box>
        )}
        <T x={200} y={240} size={11} anchor="middle" fill={tok('muted')}>errors: rustc 1.97 on the real crates (trimmed)</T>
      </Svg>
    </StepFrame>
  );
}
