import { Box, Svg, T, tok } from '../../viz/svg';

// Chapter 448: the parts of a diagnostic. Top: what rustc 1.97 printed
// for `let n: i32 = "6";` in e.rs (trimmed: the secondary label "expected
// due to this" under `i32` is left out). Bottom: what the Rust Viscosity
// CLI printed for `explain --frames k.js` (the chapter's six-line program,
// the line starts with a tab, drawn here as ⇥). The labels name the parts
// rustc's dev guide lists: level, code, message, primary span, label.
const nb = (t: string) => t.replace(/ /g, ' ');

export default function DiagnosticParts() {
  const muted = tok('muted');
  const brand = tok('brand');
  return (
    <Svg w={400} h={300} title="The parts of a rustc diagnostic, and the parts a Viscosity code frame has">
      <T x={10} y={14} size={12} weight={700} fill={muted}>rustc</T>
      <Box x={10} y={24} w={380} h={92} r={4} fill={tok('panel')} stroke={tok('line')}>
        <T x={20} y={42} size={11} mono>{nb('error[E0308]: mismatched types')}</T>
        <T x={20} y={60} size={11} mono>{nb(' --> e.rs:2:18')}</T>
        <T x={20} y={78} size={11} mono>{nb('2 |     let n: i32 = "6";')}</T>
        <T x={20} y={96} size={11} mono fill={tok('danger')}>{nb('  |                  ^^^ expected `i32`')}</T>
      </Box>
      <T x={20} y={128} size={11} fill={brand}>level · code · message</T>
      <T x={200} y={128} size={11} fill={brand}>file:line:column · span · label</T>
      <T x={10} y={160} size={12} weight={700} fill={muted}>viscosity explain --frames</T>
      <Box x={10} y={170} w={380} h={74} r={4} fill={tok('panel')} stroke={tok('line')}>
        <T x={20} y={188} size={11} mono>{nb('· unsafe: line 6: an element is used by push')}</T>
        <T x={20} y={206} size={11} mono>{nb('  6 | ⇥if (ps[i].x > 3) keep.push(ps[i]);')}</T>
        <T x={20} y={224} size={11} mono fill={tok('danger')}>{nb('    | ⇥' + ' '.repeat(27) + '^^^^^')}</T>
      </Box>
      <T x={20} y={258} size={11} fill={brand}>has: message · line · the code · span</T>
      <T x={20} y={276} size={11} fill={muted}>missing: level · code · file name · column</T>
      <T x={20} y={294} size={11} fill={muted}>⇥ is a tab, copied into the caret line</T>
    </Svg>
  );
}
