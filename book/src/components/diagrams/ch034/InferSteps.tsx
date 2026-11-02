import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

const CODE = `function map<A, B>(
  xs: A[],
  f: (x: A) => B,
): B[] { ... }

map([1, 2, 3], (n) => String(n));`;

type S = { line: number; a?: string; b?: string; n?: string; out?: string; note: string };

const STATES: S[] = [
  { line: 5, note: 'The call writes no type arguments: there is no map<number, string> anywhere. The checker has two blanks to fill, A and B, and it fills them from what the call hands over.' },
  { line: 1, a: 'number', note: 'First clue: the argument [1, 2, 3] is a number[], and it goes into the parameter xs, labelled A[]. Lining up number[] with A[] leaves only one answer: A is number.' },
  { line: 2, a: 'number', n: 'number', note: 'With A known, the callback’s parameter x is labelled A, so the n you wrote (with no label) is a number. This is why you rarely label callback parameters.' },
  { line: 2, a: 'number', n: 'number', b: 'string', note: 'Second clue: the callback returns String(n), a string, and it is labelled as returning B. So B is string.' },
  { line: 3, a: 'number', n: 'number', b: 'string', out: 'string[]', note: 'Both blanks are filled, so the return type B[] becomes string[]. Every later use of the result is checked against string[].' },
  { line: 5, a: 'number', n: 'number', b: 'string', out: 'string[]', note: 'All of this happened before the program ran, and all of it is erased: the JavaScript that runs is map([1, 2, 3], (n) => String(n)), with no A or B anywhere.' },
];

export default function InferSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="How the checker fills in A and B" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={92} title="The type blanks A and B, the callback parameter n and the result, as the checker fills them">
        <T x={8} y={14} size={11} weight={700} fill={tok('muted')}>WHAT THE CHECKER HAS WORKED OUT</T>
        <Slot x={4} label="A" value={st.a} />
        <Slot x={104} label="B" value={st.b} />
        <Slot x={204} label="n" value={st.n} />
        <Slot x={304} label="result" value={st.out} />
      </Svg>
    </StepFrame>
  );
}

function Slot({ x, label, value }: { x: number; label: string; value?: string }) {
  const on = value !== undefined;
  return (
    <g>
      <T x={x + 4} y={36} size={12} mono weight={700}>{label}</T>
      <Box x={x} y={48} w={92} h={32} dash={!on} fill={on ? tok('brand', 0.1) : 'transparent'} stroke={on ? tok('brand') : tok('line')}>
        <T x={x + 46} y={64.5} size={13} mono anchor="middle" fill={on ? tok('ink') : tok('muted')}>{on ? value : '?'}</T>
      </Box>
    </g>
  );
}
