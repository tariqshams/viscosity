import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const CODE = `const xs = ['a', 'b'];
for (const x of xs) {
  console.log(x);
}`;

// pos: which slot the iterator will hand out next (2 = past the end).
type S = { line: number; it: boolean; pos: number; result?: string; out: string[]; note: string };

const STATES: S[] = [
  { line: 1, it: false, pos: 0, out: [], note: 'for...of does not read xs[0] itself. First it asks xs for an iterator, by calling the method stored under the key Symbol.iterator.' },
  { line: 1, it: true, pos: 0, out: [], note: 'The array hands back a fresh iterator: a small object that remembers where it has got to (slot 0) and has a next() method.' },
  { line: 1, it: true, pos: 1, result: "{ value: 'a', done: false }", out: [], note: 'The loop calls next(). The answer is an object: value is \'a\', and done: false means "there was a value". The loop puts value into x.' },
  { line: 2, it: true, pos: 1, result: "{ value: 'a', done: false }", out: ['a'], note: 'The body runs once with x = \'a\' and prints it.' },
  { line: 1, it: true, pos: 2, result: "{ value: 'b', done: false }", out: ['a'], note: 'Back at the top, next() again: value \'b\', done: false. The iterator has moved past slot 1.' },
  { line: 2, it: true, pos: 2, result: "{ value: 'b', done: false }", out: ['a', 'b'], note: 'The body prints b.' },
  { line: 3, it: true, pos: 2, result: '{ value: undefined, done: true }', out: ['a', 'b'], note: 'next() once more: there is nothing left, so done is true. The loop stops without running the body. That is the whole protocol: call next() until done.' },
];

export default function NextSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="What for...of really does" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={178} title="The array, its iterator's position, the last result of next(), and the output">
        <T x={8} y={14} size={11} weight={700} fill={tok('muted')}>xs</T>
        {['a', 'b'].map((v, i) => (
          <g key={v}>
            <Box x={8 + i * 52} y={24} w={48} h={30} fill={tok('panel')} stroke={tok('ink', 0.5)}>
              <T x={32 + i * 52} y={39.5} size={14} mono anchor="middle">{`'${v}'`}</T>
            </Box>
            <T x={32 + i * 52} y={64} size={11} mono anchor="middle" fill={tok('muted')}>{i}</T>
          </g>
        ))}
        <T x={150} y={14} size={11} weight={700} fill={tok('muted')}>ITERATOR</T>
        <Box x={146} y={24} w={130} h={30} dash={!st.it} fill={st.it ? tok('brand', 0.1) : 'transparent'} stroke={st.it ? tok('brand') : tok('line')}>
          <T x={211} y={39.5} size={12} mono anchor="middle" fill={st.it ? tok('ink') : tok('muted')}>{st.it ? `next slot: ${st.pos}` : 'not made yet'}</T>
        </Box>
        {st.it && st.pos < 2 && <Arrow x1={146} y1={39} x2={34 + st.pos * 52} y2={56} color={tok('brand')} bend={-0.4} />}
        <T x={8} y={92} size={11} weight={700} fill={tok('muted')}>LAST RESULT OF next()</T>
        <Box x={4} y={102} w={272} h={30} dash={!st.result} fill={st.result ? tok('accent', 0.1) : 'transparent'} stroke={st.result ? tok('accent') : tok('line')}>
          <T x={14} y={117.5} size={12} mono fill={st.result ? tok('ink') : tok('muted')}>{st.result ?? 'none yet'}</T>
        </Box>
        <T x={292} y={92} size={11} weight={700} fill={tok('muted')}>PRINTED</T>
        {st.out.map((o, i) => (
          <T key={i} x={292} y={117 + i * 20} size={14} mono>{o}</T>
        ))}
      </Svg>
    </StepFrame>
  );
}
