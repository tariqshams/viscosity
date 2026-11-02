import { StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

// Chapter 448b: one position counted three ways, on the line
// `const s = "🎉"; [;` (oxc reports the error at the last `;`). Bytes are
// UTF-8 (what oxc's spans and Rust's str indexes count), characters are
// Unicode code points (what Rust's chars() yields and what the code
// frames count), UTF-16 units are what JavaScript strings, and so acorn's
// columns, count. 🎉 is U+1F389: 4 bytes, 1 code point, 2 UTF-16 units.
// Checked with the CLIs: both print `Unexpected token (1:17)`.
const CH = ['c', 'o', 'n', 's', 't', ' ', 's', ' ', '=', ' ', '"', '🎉', '"', ';', ' ', '[', ';'];
const b8 = (c: string) => new TextEncoder().encode(c).length;
const u16 = (c: string) => c.length;

type S = { upto: number; note: string };
const STATES: S[] = [
  { upto: 0, note: 'The error is at the last ;. To print acorn’s column we count from the start of the line to it. Three counters, all at 0.' },
  { upto: 11, note: 'const s = " is eleven plain ASCII characters. Each is one byte, one character and one UTF-16 unit, so all three counters say 11.' },
  { upto: 12, note: '🎉 (U+1F389) is outside the first 65,536 code points: UTF-8 needs 4 bytes for it, it is 1 character, and UTF-16 needs 2 units (a surrogate pair). The counters split: 15, 12, 13.' },
  { upto: 16, note: 'Four more ASCII characters ( "; [ ) add 4 to each. We have reached the ;: byte 19, character 16, UTF-16 unit 17.' },
  { upto: 16, note: 'oxc’s span says byte 19. acorn, and so both CLIs, print (1:17): the UTF-16 count. Rust’s chars() would give 16, which is what the code frames count. Same place, three numbers.' },
];

export default function ColumnSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const done = CH.slice(0, st.upto);
  const nB = done.reduce((n, c) => n + b8(c), 0);
  const nC = done.length;
  const nU = done.reduce((n, c) => n + u16(c), 0);
  const W = 22;
  return (
    <StepFrame title="One place, three counts" steps={s} note={st.note}>
      <Svg w={400} h={196} title="Counting the position of a character in bytes, characters and UTF-16 units">
        {CH.map((c, k) => {
          const x = 13 + k * W;
          const passed = k < st.upto;
          const target = k === CH.length - 1;
          return (
            <Box key={k} x={x} y={14} w={W - 2} h={30} r={3}
              fill={target ? tok('danger', 0.15) : passed ? tok('brand', 0.15) : tok('panel')}
              stroke={target ? tok('danger') : passed ? tok('brand') : tok('line')}>
              <T x={x + (W - 2) / 2} y={30} size={13} mono anchor="middle">{c === ' ' ? '·' : c}</T>
            </Box>
          );
        })}
        <T x={13} y={60} size={11} fill={tok('muted')}>· is a space; the red box is the ; that oxc complains about</T>
        {[
          ['bytes (UTF-8)', nB, 'oxc spans, Rust str'],
          ['characters', nC, 'Rust chars(), frames'],
          ['UTF-16 units', nU, 'JavaScript, acorn'],
        ].map(([label, n, who], k) => (
          <g key={String(label)}>
            <T x={13} y={90 + k * 34} size={13}>{label}</T>
            <Box x={140} y={76 + k * 34} w={50} h={26} r={4} fill={tok('accent', 0.12)} stroke={tok('accent')}>
              <T x={165} y={89 + k * 34} size={14} mono anchor="middle">{n}</T>
            </Box>
            <T x={204} y={90 + k * 34} size={12} fill={tok('muted')}>{who}</T>
          </g>
        ))}
      </Svg>
    </StepFrame>
  );
}
