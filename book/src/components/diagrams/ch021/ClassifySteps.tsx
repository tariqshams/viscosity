import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

const SRC = 'x = 42;';

const CODE = `const src = 'x = 42;';
for (let i = 0; i < src.length; i++) {
  const c = src.charCodeAt(i);
  // 97..122: a letter
  // 48..57:  a digit
  // 32:      a space
}`;

function kind(c: number) {
  if (c >= 97 && c <= 122) return 'letter';
  if (c >= 48 && c <= 57) return 'digit';
  if (c === 32) return 'space';
  return 'other';
}

const KIND_TOK: Record<string, string> = { letter: 'f1', digit: 'brand', space: 'muted', other: 'accent' };

type S = { line: number; i: number | null; note: string };

const STATES: S[] = [
  { line: 0, i: null, note: "src is 7 characters long: indexes 0 to 6. The loop's finger i will visit each one, read its char code, and decide what kind of character it is, just by comparing numbers." },
  ...[...SRC].map((ch, i): S => {
    const c = ch.charCodeAt(0);
    const k = kind(c);
    const why =
      k === 'letter' ? `${c} is between 97 and 122, so it is a lowercase letter.` :
      k === 'digit' ? `${c} is between 48 and 57, so it is a digit. Its value is ${c} - 48 = ${c - 48}.` :
      k === 'space' ? 'Code 32 is the space: invisible on screen, but a character like any other.' :
      `${c} is in none of those ranges, so it is some other symbol.`;
    return { line: 2, i, note: `i = ${i}: src[${i}] is '${ch}', and src.charCodeAt(${i}) is ${c}. ${why}` };
  }),
  { line: 1, i: null, note: 'i = 7 is not less than src.length (7), so the loop stops. Every character was sorted by a few number comparisons: the first job of a scanner.' },
];

export default function ClassifySteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="What kind of character is this?" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={150} title="The characters of 'x = 42;' with their indexes, char codes and kinds, the current one highlighted">
        <T x={4} y={30} size={11} weight={700} fill={tok('muted')}>src[i]</T>
        <T x={4} y={68} size={11} weight={700} fill={tok('muted')}>i</T>
        <T x={4} y={94} size={11} weight={700} fill={tok('muted')}>code</T>
        <T x={4} y={124} size={11} weight={700} fill={tok('muted')}>kind</T>
        {[...SRC].map((ch, k) => {
          const x = 46 + k * 50;
          const hot = st.i === k;
          const seen = st.i === null ? st.line === 1 : k <= st.i;
          const c = ch.charCodeAt(0);
          const kd = kind(c);
          return (
            <g key={k}>
              <Box x={x} y={12} w={44} h={36} fill={hot ? tok('brand', 0.18) : tok('panel')} stroke={hot ? tok('brand') : tok('ink', 0.4)}>
                <T x={x + 22} y={30} size={17} mono anchor="middle">{ch === ' ' ? '␣' : ch}</T>
              </Box>
              <T x={x + 22} y={68} size={12} mono anchor="middle" fill={hot ? tok('brand') : tok('muted')}>{k}</T>
              {seen && <T x={x + 22} y={94} size={13} mono anchor="middle" weight={hot ? 700 : 400}>{c}</T>}
              {seen && <T x={x + 22} y={124} size={11} anchor="middle" weight={700} fill={tok(KIND_TOK[kd])}>{kd}</T>}
            </g>
          );
        })}
      </Svg>
    </StepFrame>
  );
}
