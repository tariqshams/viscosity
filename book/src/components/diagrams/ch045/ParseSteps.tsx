import { StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

const TOKS = ['[', '1', ',', '[', '2', ',', '3', ']', ']', 'end'];

type Frame = { fn: string; out?: string; ret?: string };
type S = { i: number; frames: Frame[]; note: string };

const STATES: S[] = [
  { i: 0, frames: [{ fn: 'parseValue(toks, 0)' }], note: 'parse calls parseValue at token 0. It looks only at that token: a [ means an array, so it hands over to parseArray.' },
  { i: 1, frames: [{ fn: 'parseValue(toks, 0)' }, { fn: 'parseArray', out: '[]' }], note: 'parseArray steps past the [ and starts an empty out. Token 1 is not ], so there is at least one element.' },
  { i: 1, frames: [{ fn: 'parseValue(toks, 0)' }, { fn: 'parseArray', out: '[]' }, { fn: 'parseValue(toks, 1)', ret: 'returns 1, next 2' }], note: 'Each element is any value at all, so parseArray calls parseValue. Token 1 is a number: the base case, returned at once.' },
  { i: 3, frames: [{ fn: 'parseValue(toks, 0)' }, { fn: 'parseArray', out: '[1]' }], note: 'The 1 is pushed. Token 2 is a comma, so another element must follow: step past it to token 3.' },
  { i: 4, frames: [{ fn: 'parseValue(toks, 0)' }, { fn: 'parseArray', out: '[1]' }, { fn: 'parseValue(toks, 3)' }, { fn: 'parseArray', out: '[]' }], note: 'Token 3 is [ again, so this element is itself an array: parseValue calls parseArray, which is now running twice, one call on top of the other, each with its own out.' },
  { i: 7, frames: [{ fn: 'parseValue(toks, 0)' }, { fn: 'parseArray', out: '[1]' }, { fn: 'parseValue(toks, 3)' }, { fn: 'parseArray', out: '[2, 3]' }], note: 'The inner call reads 2, a comma, and 3, in exactly the same way, and arrives at the ] at token 7.' },
  { i: 8, frames: [{ fn: 'parseValue(toks, 0)' }, { fn: 'parseArray', out: '[1, [2, 3]]' }], note: 'The inner call returns [2, 3] with next 8, and its frame is gone. The outer call pushes the whole inner array as its second element.' },
  { i: 9, frames: [{ fn: 'parseValue(toks, 0)', ret: 'returns [1, [2, 3]], next 9' }], note: 'Token 8 is ], so the outer array is finished too. The value comes back with next 9; parse then checks that token 9 is the end token, and it is.' },
];

export default function ParseSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="Parsing [1, [2, 3]]" steps={s} note={st.note}>
      <Svg w={400} h={222} title={`Tokens 0 to 9 with the cursor at token ${st.i}, and the stack of calls: ${st.frames.map((f) => f.fn + (f.out ? ' with out ' + f.out : '') + (f.ret ? ', ' + f.ret : '')).join('; ')}`}>
        {TOKS.map((t, k) => {
          const x = 4 + k * 39.5;
          const on = k === st.i;
          return (
            <g key={k}>
              <Box x={x} y={6} w={36} h={28} fill={on ? tok('brand', 0.18) : tok('panel')} stroke={on ? tok('brand') : tok('line')}>
                <T x={x + 18} y={20.5} size={t === 'end' ? 11 : 14} mono anchor="middle">{t}</T>
              </Box>
              <T x={x + 18} y={44} size={11} mono anchor="middle" fill={tok('muted')}>{k}</T>
            </g>
          );
        })}
        <T x={6} y={66} size={11} weight={700} fill={tok('muted')}>CALLS (newest on top)</T>
        {st.frames.map((f, k) => {
          const depth = st.frames.length - 1 - k;
          const y = 76 + depth * 36;
          const top = depth === 0;
          return (
            <Box key={k} x={4 + k * 6} y={y} w={392 - k * 12} h={30} fill={top ? tok('brand', 0.1) : tok('panel')} stroke={top ? tok('brand') : tok('line')}>
              <T x={14 + k * 6} y={y + 15.5} size={12} mono weight={700}>{f.fn}</T>
              {f.out && <T x={384 - k * 6} y={y + 15.5} size={12} mono anchor="end">out = {f.out}</T>}
              {f.ret && <T x={384 - k * 6} y={y + 15.5} size={11} mono anchor="end" fill={tok('safe')}>{f.ret}</T>}
            </Box>
          );
        })}
      </Svg>
    </StepFrame>
  );
}
