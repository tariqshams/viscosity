// Chapter 183: which V8 flag (Node v22 / V8 12.4) shows which part of the
// engine. Every flag here was run on this book's machine; help texts are
// in src/flags/flag-definitions.h. The last two are used in the next chapter.
import { Box, Svg, T, tok } from '../../viz/svg';

const ROWS = [
  { flag: '--print-bytecode', what: 'Ignition bytecode', next: false, c: tok('f2') },
  { flag: '--trace-opt', what: 'tiering up to TurboFan', next: false, c: tok('f3') },
  { flag: '--trace-deopt', what: 'failed guesses', next: false, c: tok('f6') },
  { flag: '--trace-gc', what: 'scavenges, mark-compacts', next: false, c: tok('f5') },
  { flag: '--trace-turbo-inlining', what: 'inlining decisions', next: false, c: tok('f1') },
  { flag: '--trace-generalization', what: 'fields getting general', next: true, c: tok('f4') },
  { flag: '--allow-natives-syntax', what: '%DebugPrint and friends', next: true, c: tok('f4') },
];

export default function FlagMap() {
  const rowH = 34;
  return (
    <Svg w={400} h={ROWS.length * rowH + 26} title="A map from V8 flags to what each one shows">
      <T x={6} y={10} size={11} weight={700} fill={tok('muted')}>FLAG</T>
      <T x={214} y={10} size={11} weight={700} fill={tok('muted')}>SHOWS</T>
      {ROWS.map((r, i) => {
        const y = 22 + i * rowH;
        return (
          <g key={r.flag}>
            <Box x={4} y={y} w={196} h={rowH - 8} stroke={r.c}>
              <T x={12} y={y + (rowH - 8) / 2} size={11} mono>{r.flag}</T>
            </Box>
            <line x1={200} y1={y + 13} x2={210} y2={y + 13} stroke={r.c} strokeWidth={2} />
            <T x={214} y={y + 13} size={11} fill={r.next ? tok('muted') : undefined}>{r.what}</T>
          </g>
        );
      })}
    </Svg>
  );
}
