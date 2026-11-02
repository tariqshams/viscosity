import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// Chapter 230: one generic `total` becomes one copy per layout type, each
// calling one known `slot`; `total_dyn` stays one copy and calls through a
// vtable. The function names are the ones `nm -C` listed for the chapter's
// program (rustc 1.97, -C symbol-mangling-version=v0).
const CODE = `total(&Aos { nf: 2 }, &b, n, 1);
total(&Soa { n: 3 }, &b, n, 1);
total_dyn(&Aos { nf: 2 }, &b, n, 1);
total_dyn(&Soa { n: 3 }, &b, n, 1);`;

type S = { line: number | null; aos?: boolean; soa?: boolean; dyn?: boolean; hot?: 'aos' | 'soa' | 'dyn'; note: string };

const STATES: S[] = [
  { line: null, note: 'The source has one generic function, fn total<L: Layout>, and one dyn function, total_dyn(l: &dyn Layout). Four calls use them.' },
  { line: 0, aos: true, hot: 'aos', note: 'The first call has L = Aos. The compiler makes an ordinary copy, total::<Aos>, with Aos written in for L. Its l.slot call can only mean Aos::slot: a direct call.' },
  { line: 1, aos: true, soa: true, hot: 'soa', note: 'The second call has L = Soa, so a second copy appears: total::<Soa>, calling Soa::slot directly. That is monomorphization: one copy per type used.' },
  { line: 2, aos: true, soa: true, dyn: true, hot: 'dyn', note: 'total_dyn gets one copy only. Its call to slot loads a function pointer from whatever vtable comes with l, so its target is known only at run time.' },
  { line: 3, aos: true, soa: true, dyn: true, note: 'Each generic copy is a call site that is monomorphic by construction, with no guard needed. total_dyn is like a polymorphic site: one place in the code, many possible targets.' },
];

export default function MonoSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const fn = (x: number, y: number, w: number, label: string, on: boolean, col: string, hot: boolean) => (
    <Box x={x} y={y} w={w} h={30} r={4} fill={hot ? tok(col, 0.22) : on ? tok(col, 0.08) : 'transparent'} stroke={on ? tok(col) : tok('line')} dash={!on} opacity={on ? 1 : 0.5}>
      <T x={x + w / 2} y={y + 15} size={10} mono anchor="middle">{label}</T>
    </Box>
  );
  return (
    <StepFrame title="One copy per type, or one copy and a vtable" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={262} title="Monomorphized copies calling slot directly, and a dyn function calling through vtables">
        <T x={8} y={14} size={11} weight={700} fill={tok('brand')}>source</T>
        <Box x={8} y={24} w={170} h={30} r={4} stroke={tok('brand')}>
          <T x={93} y={39} size={10} mono anchor="middle">fn total&lt;L: Layout&gt;</T>
        </Box>
        <Box x={222} y={24} w={170} h={30} r={4} stroke={tok('brand')}>
          <T x={307} y={39} size={10} mono anchor="middle">fn total_dyn(&amp;dyn Layout)</T>
        </Box>
        <T x={8} y={76} size={11} weight={700} fill={tok('brand')}>compiled</T>
        {fn(8, 88, 110, 'total::<Aos>', !!st.aos, 'f3', st.hot === 'aos')}
        {fn(124, 88, 110, 'total::<Soa>', !!st.soa, 'f4', st.hot === 'soa')}
        {fn(262, 88, 130, 'total_dyn', !!st.dyn, 'f5', st.hot === 'dyn')}
        {st.aos && <Arrow x1={60} y1={54} x2={60} y2={86} color={tok('ink', 0.5)} />}
        {st.soa && <Arrow x1={120} y1={54} x2={178} y2={86} color={tok('ink', 0.5)} />}
        {st.dyn && <Arrow x1={327} y1={54} x2={327} y2={86} color={tok('ink', 0.5)} />}
        {st.dyn && (
          <Box x={272} y={146} w={110} h={28} r={4} stroke={tok('f5')}>
            <T x={327} y={160} size={10} mono anchor="middle">vtable of l</T>
          </Box>
        )}
        {st.dyn && <Arrow x1={327} y1={118} x2={327} y2={144} color={tok('f5')} />}
        {fn(8, 206, 150, 'Aos::slot', !!st.aos, 'f3', false)}
        {fn(170, 206, 150, 'Soa::slot', !!st.soa, 'f4', false)}
        {st.aos && <Arrow x1={60} y1={118} x2={60} y2={204} color={tok('f3')} width={2.5} />}
        {st.soa && <Arrow x1={180} y1={118} x2={230} y2={204} color={tok('f4')} width={2.5} />}
        {st.dyn && <Arrow x1={290} y1={174} x2={140} y2={204} color={tok('f5')} dash bend={0.2} />}
        {st.dyn && <Arrow x1={320} y1={174} x2={290} y2={204} color={tok('f5')} dash />}
        <T x={8} y={252} size={9} fill={tok('muted')}>solid: direct call · dashed: chosen at run time</T>
      </Svg>
    </StepFrame>
  );
}
