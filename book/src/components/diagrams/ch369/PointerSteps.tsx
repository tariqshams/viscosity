import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// Chapter 368-b (Raw pointers): who checks a read. Safe indexing compares the index with
// the length first (and panics); a raw-pointer read checks nothing, so
// the programmer's SAFETY argument is the only check. Reading past the
// end through a raw pointer is undefined behaviour (Rust Reference,
// "Behavior considered undefined"); the "?" slot is illustrative.
const CODE = `let xs = [1.5, 2.5, 4.0];
xs[2]
xs[3]
unsafe { *p.add(2) }
unsafe { *p.add(3) }`;

type Who = 'rust' | 'you' | 'nobody' | 'forbid';
type S = { line: number | null; i: number | null; check: string | null; ok: boolean | null; who: Who; out: string; note: string };

const STATES: S[] = [
  { line: 0, i: null, check: null, ok: null, who: 'rust', out: '', note: 'Three f64s, 8 bytes each, side by side. p = xs.as_ptr() points at the first. The slot after the end belongs to something else, or to nothing.' },
  { line: 1, i: 2, check: '2 < 3', ok: true, who: 'rust', out: '4', note: 'Safe indexing compares the index with the length first. 2 < 3, so the read happens.' },
  { line: 2, i: 3, check: '3 < 3', ok: false, who: 'rust', out: 'panic', note: 'Here the check fails, so Rust panics before touching memory. Loud, but nothing was read or corrupted.' },
  { line: 3, i: 2, check: null, ok: true, who: 'you', out: '4', note: 'Through a raw pointer there is no check at all. The read is right only because you made sure 2 < 3 before writing it: that promise goes in a SAFETY comment.' },
  { line: 4, i: 3, check: null, ok: false, who: 'nobody', out: '??', note: 'Break the promise and the read goes past the end. This is undefined behaviour: it may print junk, crash, or be “optimised” into something else. No panic warns you.' },
  { line: null, i: null, check: null, ok: null, who: 'forbid', out: '', note: 'With #![forbid(unsafe_code)] the last two lines do not compile at all, which is why drip-rs has no raw pointers anywhere.' },
];

const VALS = ['1.5', '2.5', '4.0', '?'];
const WHO: Record<Who, string> = {
  rust: 'checked by: Rust, at run time',
  you: 'checked by: you (SAFETY comment)',
  nobody: 'checked by: nobody',
  forbid: 'unsafe lines rejected at compile time',
};

export default function PointerSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const bad = st.ok === false;
  return (
    <StepFrame title="Who checks the read?" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={190} title="A three-element array and the slot after it, read with and without a bounds check">
        <T x={10} y={16} size={11} weight={700} fill={tok('brand')}>xs (len 3)</T>
        {VALS.map((v, k) => {
          const x = 10 + k * 90;
          const past = k === 3;
          const hit = st.i === k;
          const col = hit ? (bad ? 'danger' : 'safe') : null;
          return (
            <g key={k}>
              <Box x={x} y={30} w={84} h={40} r={3} dash={past}
                fill={col ? tok(col, 0.18) : past ? 'transparent' : tok('panel')}
                stroke={col ? tok(col) : tok('line')}>
                <T x={x + 42} y={50} size={13} mono anchor="middle" fill={past ? tok('muted') : undefined}>{v}</T>
              </Box>
              <T x={x + 42} y={82} size={11} mono anchor="middle" fill={tok('muted')}>{past ? 'past the end' : `[${k}]`}</T>
            </g>
          );
        })}
        {st.i !== null && (
          <Arrow x1={10 + st.i * 90 + 42} y1={118} x2={10 + st.i * 90 + 42} y2={92} color={bad ? tok('danger') : tok('ink', 0.7)} />
        )}
        {st.check && (
          <Box x={10} y={124} w={120} h={26} r={3} fill={tok(st.ok ? 'safe' : 'danger', 0.15)} stroke={tok(st.ok ? 'safe' : 'danger')}>
            <T x={70} y={137} size={11} mono anchor="middle">{st.check} {st.ok ? '✓' : '✗'}</T>
          </Box>
        )}
        <T x={10} y={168} size={11} fill={st.who === 'nobody' ? tok('danger') : st.who === 'forbid' ? tok('brand') : tok('ink')}>{WHO[st.who]}</T>
        {st.out && <T x={390} y={168} size={12} mono anchor="end" fill={bad ? tok('danger') : tok('ink')}>result: {st.out}</T>}
      </Svg>
    </StepFrame>
  );
}
