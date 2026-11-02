// Chapter 117: a call, checked before it runs and then run. rustc first
// compares each argument with its parameter's type (a call that does not
// fit is rejected while compiling, never at run time); then the call
// gets a fresh frame of typed slots, the body runs, and return hands one
// value of the promised type back. The errors are real rustc 1.97 output.
import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

const CODE = `fn area(w: i32, h: i32) -> i32 {
    let a = w * h;
    return a;
}

fn main() {
    let r = area(3, 4);
    println!("{r}");
}`;

type Check = { arg: string; param: string; ok: boolean };
type S = { line: number; phase: 'compile' | 'run'; checks?: Check[]; frame?: { w?: number; h?: number; a?: number; ret?: boolean }; r?: number; out?: string; note: string };

const STATES: S[] = [
  { line: 6, phase: 'compile', checks: [], note: 'Before anything runs, rustc reads the call area(3, 4) and lines it up with the signature: two arguments for two parameters.' },
  { line: 0, phase: 'compile', checks: [{ arg: '3', param: 'w: i32', ok: true }, { arg: '4', param: 'h: i32', ok: true }], note: 'Each argument must fit its parameter’s type. 3 and 4 are whole numbers, so they can be i32s. Had you written area(3, 2.5), compiling would stop here with “expected `i32`, found floating-point number”; area(3) would stop with E0061, “this function takes 2 arguments but 1 argument was supplied”.' },
  { line: 6, phase: 'run', frame: { w: 3, h: 4 }, note: 'Now the program runs. The call gets a fresh frame, and the parameters are slots in it of exactly the declared type: w = 3, h = 4, four bytes each.' },
  { line: 1, phase: 'run', frame: { w: 3, h: 4, a: 12 }, note: 'The body runs in that frame. let a = w * h makes a local, 12, whose type (i32) rustc worked out from w and h.' },
  { line: 2, phase: 'run', frame: { w: 3, h: 4, a: 12, ret: true }, note: 'return a hands back one value, and rustc already checked that a is an i32, as the arrow promised. The function stops here.' },
  { line: 6, phase: 'run', r: 12, note: 'The frame is gone, with w, h and a in it. The call area(3, 4) has become the value 12, and let binds it to r.' },
  { line: 7, phase: 'run', r: 12, out: '12', note: 'println! prints 12. Every type in this run was settled before it started, so nothing about types is checked while it runs.' },
];

export default function TypedCallSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="A call: checked, then run" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={128} title="The type check of the call, then the call's frame">
        <T x={8} y={12} size={11} weight={700} fill={st.phase === 'compile' ? tok('brand') : tok('muted')}>WHILE COMPILING</T>
        <T x={208} y={12} size={11} weight={700} fill={st.phase === 'run' ? tok('brand') : tok('muted')}>WHILE RUNNING</T>
        <line x1={198} y1={4} x2={198} y2={124} stroke={tok('line')} strokeDasharray="4 4" />
        {(st.checks ?? []).map((c, k) => (
          <g key={k}>
            <Box x={8} y={26 + k * 44} w={40} h={32} fill={tok('panel')} stroke={tok('ink', 0.5)}>
              <T x={28} y={42 + k * 44} size={14} mono anchor="middle">{c.arg}</T>
            </Box>
            <T x={64} y={42 + k * 44} size={14} anchor="middle" fill={c.ok ? tok('safe') : tok('danger')} weight={700}>{c.ok ? '✓' : '✕'}</T>
            <T x={80} y={42 + k * 44} size={12} mono>{c.param}</T>
          </g>
        ))}
        {st.phase === 'compile' && (st.checks ?? []).length === 0 && <T x={98} y={70} size={12} anchor="middle" mono>area(3, 4) ?</T>}
        {st.frame && (
          <Box x={208} y={24} w={186} h={96} fill={tok('brand', 0.08)} stroke={tok('brand')}>
            <T x={216} y={38} size={11} fill={tok('muted')}>area’s frame</T>
            {(['w', 'h', 'a'] as const).map((n, k) => (
              <g key={n}>
                <T x={238 + k * 58} y={58} size={13} mono weight={700} anchor="middle">{n}</T>
                <Box x={216 + k * 58} y={66} w={44} h={26} fill={st.frame![n] === undefined ? 'transparent' : tok('panel')} stroke={tok('ink', 0.4)} dash={st.frame![n] === undefined}>
                  <T x={238 + k * 58} y={79} size={14} mono anchor="middle">{st.frame![n] ?? ''}</T>
                </Box>
              </g>
            ))}
            {st.frame.ret && <T x={216} y={108} size={12} weight={700} fill={tok('brand')}>returning 12: i32</T>}
          </Box>
        )}
        {st.r !== undefined && (
          <g>
            <T x={216} y={44} size={13} mono weight={700}>r</T>
            <Box x={234} y={30} w={50} h={28} fill={tok('panel')} stroke={tok('ink', 0.5)}>
              <T x={259} y={44} size={14} mono anchor="middle">{st.r}</T>
            </Box>
            {st.out && <T x={216} y={90} size={13} mono>prints: {st.out}</T>}
          </g>
        )}
      </Svg>
    </StepFrame>
  );
}
