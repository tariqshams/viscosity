// The V8 flags used in the deep dive into real JavaScript engines, and
// what each one shows. Every flag here was run on Node v22.23.4
// (V8 12.4.254.21); help texts are in src/flags/flag-definitions.h.
import { Box, Svg, T, tok } from '../../viz/svg';

const ROWS = [
  { flag: '--print-bytecode', what: 'Ignition bytecode, per function', c: tok('f2') },
  { flag: '--log-function-events', what: 'preparse, parse, compile, first run', c: tok('f2') },
  { flag: '--trace-baseline-batch-compilation', what: 'Sparkplug batches', c: tok('f3') },
  { flag: '--trace-opt', what: 'tiering up to TurboFan', c: tok('f3') },
  { flag: '--trace-osr', what: 'entering optimised code mid-loop', c: tok('f3') },
  { flag: '--log-ic', what: 'inline-cache state changes', c: tok('f1') },
  { flag: '--trace-turbo-inlining', what: 'inlining decisions', c: tok('f1') },
  { flag: '--trace-deopt(-verbose)', what: 'failed guesses, rebuilt frames', c: tok('f6') },
  { flag: '--trace-generalization', what: 'fields getting more general', c: tok('f4') },
  { flag: '--trace-gc', what: 'scavenges and mark-compacts', c: tok('f5') },
  { flag: '--allow-natives-syntax', what: '%DebugPrint and friends', c: tok('f4') },
];

export default function FlagMap() {
  const rowH = 30;
  return (
    <Svg w={400} h={ROWS.length * rowH + 26} title="A map from eleven V8 flags to what each one shows, from bytecode and parsing at the top, through tiering, inline caches and deoptimisation, to fields, garbage collection and natives syntax at the bottom.">
      <T x={6} y={10} size={11} weight={700} fill={tok('muted')}>FLAG</T>
      <T x={230} y={10} size={11} weight={700} fill={tok('muted')}>SHOWS</T>
      {ROWS.map((r, i) => {
        const y = 20 + i * rowH;
        return (
          <g key={r.flag}>
            <Box x={4} y={y} w={216} h={rowH - 6} stroke={r.c}>
              <T x={10} y={y + (rowH - 6) / 2} size={10} mono>{r.flag}</T>
            </Box>
            <line x1={220} y1={y + 12} x2={228} y2={y + 12} stroke={r.c} strokeWidth={2} />
            <T x={230} y={y + 12} size={10}>{r.what}</T>
          </g>
        );
      })}
    </Svg>
  );
}
