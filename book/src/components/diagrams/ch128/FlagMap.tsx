// Chapter 128: which V8 flag (Node v22 / V8 12.4) shows which part of the
// engine, and which chapter explained that part. Every flag here was run
// for the chapter; help texts are in src/flags/flag-definitions.h.
import { Box, Svg, T, tok } from '../../viz/svg';

const ROWS = [
  { flag: '--print-bytecode', what: 'Ignition bytecode', ch: '61', c: tok('f2') },
  { flag: '--trace-opt', what: 'tiering up to TurboFan', ch: '61', c: tok('f3') },
  { flag: '--trace-deopt', what: 'failed guesses', ch: '66', c: tok('f6') },
  { flag: '--trace-generalization', what: 'field representations', ch: '22, 63', c: tok('f1') },
  { flag: '%DebugPrint(o)', what: 'map, fields, elements kind', ch: '63, 65', c: tok('f4') },
  { flag: '%HasFastProperties(o)', what: 'dictionary mode?', ch: '63', c: tok('f4') },
  { flag: '--trace-gc', what: 'scavenges, mark-compacts', ch: '68', c: tok('f5') },
];

export default function FlagMap() {
  const rowH = 34;
  return (
    <Svg w={400} h={ROWS.length * rowH + 26} title="A map from V8 flags and natives to what they show and the chapter that explains it">
      <T x={6} y={10} size={10} weight={700} fill={tok('muted')}>FLAG OR NATIVE</T>
      <T x={214} y={10} size={10} weight={700} fill={tok('muted')}>SHOWS</T>
      <T x={394} y={10} size={10} weight={700} anchor="end" fill={tok('muted')}>CH.</T>
      {ROWS.map((r, i) => {
        const y = 22 + i * rowH;
        return (
          <g key={r.flag}>
            <Box x={4} y={y} w={196} h={rowH - 8} stroke={r.c}>
              <T x={12} y={y + (rowH - 8) / 2} size={11} mono>{r.flag}</T>
            </Box>
            <line x1={200} y1={y + 13} x2={210} y2={y + 13} stroke={r.c} strokeWidth={2} />
            <T x={214} y={y + 13} size={11}>{r.what}</T>
            <T x={394} y={y + 13} size={11} anchor="end" fill={tok('muted')}>{r.ch}</T>
          </g>
        );
      })}
    </Svg>
  );
}
