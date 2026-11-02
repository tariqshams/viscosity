import { Box, Svg, T, tok } from '../../viz/svg';

// Chapter 313-b: the parts of a failing assert_eq! in cargo test's output
// (rustc 1.97; thread number trimmed). Each line of the real output, with
// what it tells you beside it.
const ROWS: { text: string; what: string; col: string }[] = [
  { text: "---- tests::slot_formula stdout ----", what: 'which test', col: 'brand' },
  { text: "thread '…' panicked at t.rs:11:5:", what: 'file:line:column', col: 'accent' },
  { text: 'assertion `left == right` failed:', what: 'which macro', col: 'muted' },
  { text: '  element 3, field 1', what: 'your message', col: 'warn' },
  { text: '  left: 5', what: 'first argument', col: 'f1' },
  { text: ' right: 7', what: 'second argument', col: 'f2' },
];

export default function FailureAnatomy() {
  return (
    <Svg w={400} h={186} title="A failing assert_eq in cargo test output, with each line labelled">
      <Box x={4} y={4} w={270} h={178} fill={tok('panel')} stroke={tok('ink', 0.4)} />
      {ROWS.map((r, k) => (
        <g key={k}>
          <T x={12} y={22 + k * 28} size={11} mono>{r.text.replace(/^ +/, (m) => ' '.repeat(m.length))}</T>
          <line x1={278} y1={22 + k * 28} x2={290} y2={22 + k * 28} stroke={tok(r.col)} strokeWidth={2} />
          <T x={294} y={22 + k * 28} size={11} fill={tok(r.col === 'muted' ? 'muted' : r.col)}>{r.what}</T>
        </g>
      ))}
    </Svg>
  );
}
