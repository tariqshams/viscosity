import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const CODE = `const p = { x: 3, y: 4 };
const key = 'y';
p.x;     // 3
p[key];  // 4
p.key;   // undefined
p['x'];  // 3`;

type S = { line: number; keyVar?: boolean; work?: string; want?: string; hit?: 'x' | 'y' | 'none'; note: string };

const STATES: S[] = [
  { line: 0, note: 'The curly braces make an object with two properties. Each one is a key (a name, stored as a string) and a value.' },
  { line: 1, keyVar: true, note: 'An ordinary variable, key, holding the string \'y\'. It is not part of p; it lives outside it.' },
  { line: 2, keyVar: true, want: 'x', hit: 'x', note: 'p.x: after a dot, the name is the key, exactly as written. JavaScript looks for the key \'x\', finds it, and reads 3.' },
  { line: 3, keyVar: true, work: 'key → \'y\'', note: 'p[key]: brackets hold an expression, which is worked out first. The variable key holds \'y\'…' },
  { line: 3, keyVar: true, work: 'key → \'y\'', want: 'y', hit: 'y', note: '…so the key looked for is \'y\', and the result is 4. The word "key" itself never reached the object.' },
  { line: 4, keyVar: true, want: 'key', hit: 'none', note: 'p.key: after a dot, the word is taken literally, so JavaScript looks for a property named \'key\'. There is none: undefined, with no error.' },
  { line: 5, keyVar: true, want: 'x', hit: 'x', note: 'p[\'x\']: brackets holding a written-out string. Working it out gives \'x\', so this is the same lookup as p.x: 3.' },
];

const ROWS: { k: 'x' | 'y'; v: number; c: string }[] = [{ k: 'x', v: 3, c: 'f1' }, { k: 'y', v: 4, c: 'f2' }];

export default function LookupSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="How a property is looked up" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={170} title="The object p with keys x and y on the left; on the right, the key being looked for and the value found">
        <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>THE OBJECT p</T>
        <Box x={8} y={22} w={170} h={96} r={8} stroke={tok('ink', 0.5)}>
          {ROWS.map((r, i) => {
            const on = st.hit === r.k;
            return (
              <g key={r.k}>
                <Box x={18} y={32 + i * 42} w={150} h={34} fill={on ? tok(r.c, 0.22) : tok(r.c, 0.08)} stroke={on ? tok(r.c) : tok(r.c, 0.5)}>
                  <T x={30} y={49.5 + i * 42} size={15} mono weight={700} fill={tok(r.c)}>{`'${r.k}'`}</T>
                  <T x={84} y={49.5 + i * 42} size={14} fill={tok('muted')}>:</T>
                  <T x={128} y={49.5 + i * 42} size={16} mono anchor="middle">{r.v}</T>
                </Box>
              </g>
            );
          })}
        </Box>
        {st.keyVar && (
          <g>
            <T x={8} y={136} size={11} weight={700} fill={tok('muted')}>A VARIABLE</T>
            <Box x={8} y={144} w={170} h={24} stroke={tok('ink', 0.4)}>
              <T x={18} y={156.5} size={13} mono>key = 'y'</T>
            </Box>
          </g>
        )}
        <T x={212} y={12} size={11} weight={700} fill={tok('muted')}>WORK OUT THE KEY</T>
        <Box x={212} y={22} w={180} h={30} dash={!st.work} fill="transparent" stroke={st.work ? tok('accent') : tok('line')}>
          <T x={222} y={37.5} size={13} mono fill={st.work ? tok('accent') : tok('muted')}>{st.work ?? 'nothing to work out'}</T>
        </Box>
        <T x={212} y={68} size={11} weight={700} fill={tok('muted')}>LOOKING FOR</T>
        <Box x={212} y={78} w={180} h={30} dash={!st.want} fill={st.want ? tok('brand', 0.1) : 'transparent'} stroke={st.want ? tok('brand') : tok('line')}>
          <T x={222} y={93.5} size={14} mono weight={700}>{st.want ? `'${st.want}'` : ''}</T>
        </Box>
        {st.hit && st.hit !== 'none' && <Arrow x1={210} y1={93} x2={172} y2={st.hit === 'x' ? 49 : 91} color={tok('brand')} />}
        <T x={212} y={124} size={11} weight={700} fill={tok('muted')}>RESULT</T>
        <Box x={212} y={134} w={180} h={30} dash={!st.hit} fill="transparent" stroke={st.hit === 'none' ? tok('danger') : st.hit ? tok('safe') : tok('line')}>
          <T x={222} y={149.5} size={14} mono fill={st.hit === 'none' ? tok('danger') : undefined}>
            {st.hit === 'none' ? 'undefined (no such key)' : st.hit ? String(ROWS.find((r) => r.k === st.hit)!.v) : ''}
          </T>
        </Box>
      </Svg>
    </StepFrame>
  );
}
