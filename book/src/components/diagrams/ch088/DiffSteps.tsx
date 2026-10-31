import { StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// Viscosity's differential test for one corpus program: compile, check the
// layout decision against the header, run both versions in fresh VM
// contexts, and compare everything they printed and threw. The outcomes are
// real (out_of_bounds.js, with the default --bounds check and with
// --bounds assume).
type Hi = 'src' | 'compile' | 'header' | 'runA' | 'runB' | 'cmp' | null;
type S = { hi: Hi; shown: number; bad: boolean; note: string };

const A = { out: ['4950', '7'], err: "TypeError: …reading 'a'" };
const B_OK = A;
const B_BAD = { out: ['4950', '7', '0'], err: 'null' };

const STATES: S[] = [
  { hi: 'src', shown: 0, bad: false, note: 'One corpus file, out_of_bounds.js. Its first line is a header saying what Viscosity should decide: // viscosity: ps=soa. Its last line reads ps[100].a, one past the end.' },
  { hi: 'compile', shown: 1, bad: false, note: 'Compile it. Viscosity produces new source, plus a plan: one layout per collection.' },
  { hi: 'header', shown: 2, bad: false, note: 'First check: the plan must match the header. ps should be soa, and it is. This catches a compiler that quietly stops optimizing, which behaviour checks alone never would.' },
  { hi: 'runA', shown: 3, bad: false, note: 'Run the original in a fresh, isolated VM context, recording every console.log line and the uncaught error, if any. It prints 4950 and 7, then throws a TypeError at ps[100].a.' },
  { hi: 'runB', shown: 4, bad: false, note: 'Run the compiled code in another fresh context. Its bounds check throws the same TypeError, with the same message.' },
  { hi: 'cmp', shown: 5, bad: false, note: 'Compare the two outcomes as a whole: output lines and error. Equal: pass. Nobody wrote down the expected output; the original program is the oracle.' },
  { hi: 'cmp', shown: 5, bad: true, note: 'Now compile with --bounds assume, which drops that check. The compiled code reads past the end of a Float64Array and prints 0 instead of throwing. The comparison fails, and the test prints the compiled code to debug.' },
];

const ORDER: Hi[] = ['src', 'compile', 'header', 'runA', 'runB', 'cmp'];

export default function DiffSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const B = st.bad ? B_BAD : B_OK;
  const on = (h: Hi) => st.hi === h;
  const vis = (h: Hi) => ORDER.indexOf(h) <= st.shown;
  const box = (h: Hi, bad = false) => ({
    fill: on(h) ? tok(bad ? 'danger' : 'brand', 0.14) : 'transparent',
    stroke: !vis(h) ? tok('line') : on(h) ? tok(bad ? 'danger' : 'brand') : tok('ink', 0.5),
    dash: !vis(h),
  });
  const same = !st.bad;
  return (
    <StepFrame title="The differential testing loop" steps={s} note={st.note}>
      <Svg w={400} h={330} title="A corpus program is compiled; the plan is checked against its header; original and compiled versions run in fresh contexts and their outcomes are compared">
        <Box x={120} y={6} w={160} h={34} {...box('src')}>
          <T x={200} y={23} size={12} mono anchor="middle">out_of_bounds.js</T>
        </Box>
        <Arrow x1={200} y1={40} x2={200} y2={58} />
        <Box x={120} y={60} w={160} h={34} {...box('compile')}>
          <T x={200} y={77} size={13} anchor="middle" weight={700}>compile</T>
        </Box>
        <Arrow x1={280} y1={77} x2={300} y2={77} />
        <Box x={302} y={60} w={94} h={34} {...box('header')}>
          <T x={349} y={72} size={10} anchor="middle" fill={tok('muted')}>plan vs header</T>
          <T x={349} y={86} size={11} mono anchor="middle" fill={vis('header') ? tok('safe') : tok('muted')}>{vis('header') ? 'soa = soa ✓' : '…'}</T>
        </Box>
        <Arrow x1={120} y1={23} x2={60} y2={118} dash />
        <T x={44} y={60} size={10} anchor="end" fill={tok('muted')}>original</T>
        <Arrow x1={200} y1={94} x2={290} y2={118} />
        <T x={252} y={102} size={10} fill={tok('muted')}>compiled</T>
        {[{ h: 'runA' as Hi, x: 6, r: A, t: 'fresh context A' }, { h: 'runB' as Hi, x: 206, r: B, t: 'fresh context B' }].map(({ h, x, r, t }) => (
          <Box key={t} x={x} y={120} w={188} h={110} {...box(h, h === 'runB' && st.bad)}>
            <T x={x + 10} y={136} size={10} weight={700} fill={tok('muted')}>{t.toUpperCase()}</T>
            {vis(h) ? (
              <g>
                <T x={x + 10} y={156} size={11} mono>out:</T>
                {r.out.map((o, k) => (
                  <T key={k} x={x + 46 + k * 40} y={156} size={11} mono fill={h === 'runB' && st.bad && k === 2 ? tok('danger') : undefined}>{o}</T>
                ))}
                <T x={x + 10} y={180} size={11} mono>error:</T>
                <T x={x + 10} y={200} size={11} mono fill={h === 'runB' && st.bad ? tok('danger') : undefined}>{r.err}</T>
              </g>
            ) : (
              <T x={x + 94} y={176} size={12} anchor="middle" fill={tok('muted')}>not run yet</T>
            )}
          </Box>
        ))}
        <Arrow x1={100} y1={230} x2={180} y2={262} />
        <Arrow x1={300} y1={230} x2={220} y2={262} />
        <Box x={110} y={264} w={180} h={50} {...box('cmp', st.bad)}>
          <T x={200} y={280} size={12} anchor="middle" mono>toEqual(before)</T>
          <T x={200} y={300} size={14} weight={700} anchor="middle" fill={!vis('cmp') ? tok('muted') : same ? tok('safe') : tok('danger')}>
            {!vis('cmp') ? '…' : same ? 'equal: pass' : 'different: FAIL'}
          </T>
        </Box>
      </Svg>
    </StepFrame>
  );
}
