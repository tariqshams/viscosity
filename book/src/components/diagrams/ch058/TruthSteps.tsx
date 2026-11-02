import { StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

type V = { src: string; drip: boolean; js: boolean };
const VALUES: V[] = [
  { src: 'true', drip: true, js: true },
  { src: 'false', drip: false, js: false },
  { src: 'none', drip: false, js: false },
  { src: '0', drip: true, js: false },
  { src: '""', drip: true, js: false },
  { src: '"no"', drip: true, js: true },
];

const NOTES = [
  'An if needs to decide: run the then-branch or not? Each step feeds one value into an if and asks Drip and JavaScript the same question.',
  'true is true everywhere. Both languages run the then-branch.',
  'false is false everywhere. Both skip it.',
  'none is Drip’s “no value”. It counts as false, just as null does in JavaScript.',
  'Here the languages part ways. JavaScript treats 0 as false; Drip does not. 0 is a number, and only none and false are false in Drip.',
  'The empty string: false in JavaScript, true in Drip, for the same reason. It is a string, and strings are never false.',
  'A string that says no is still a string, so both treat it as true. The rule in Drip is short: none and false are false; everything else is true.',
];

export default function TruthSteps() {
  const s = useSteps(NOTES.map((note, i) => ({ note, i })));
  const k = s.state.i - 1;
  const v = k >= 0 ? VALUES[k] : null;
  return (
    <StepFrame title="Which values count as true?" steps={s} note={s.state.note}>
      <Svg w={400} h={176} title="Six values; for the current one, whether Drip and JavaScript treat it as true in an if.">
        {VALUES.map((x, j) => {
          const on = j === k;
          const seen = j <= k;
          return (
            <Box key={x.src} x={6 + j * 65} y={8} w={58} h={32} r={6} fill={on ? tok('brand', 0.2) : tok('panel')} stroke={on ? tok('brand') : tok('ink', seen ? 0.5 : 0.25)}>
              <T x={35 + j * 65} y={24} size={14} mono weight={700} anchor="middle" fill={seen ? undefined : tok('muted')}>{x.src}</T>
            </Box>
          );
        })}
        <T x={200} y={64} size={14} mono anchor="middle">if {v ? v.src : 'v'} {'{'} … {'}'}</T>
        {(['Drip', 'JavaScript'] as const).map((lang, j) => {
          const val = v ? (lang === 'Drip' ? v.drip : v.js) : null;
          const col = val === null ? 'line' : val ? 'safe' : 'danger';
          const x = 20 + j * 190;
          return (
            <Box key={lang} x={x} y={86} w={170} h={66} r={8} fill={val === null ? tok('panel') : tok(col, 0.12)} stroke={tok(col)}>
              <T x={x + 85} y={106} size={12} weight={700} anchor="middle">{lang}</T>
              <T x={x + 85} y={132} size={14} weight={700} anchor="middle" fill={val === null ? tok('muted') : tok(col)}>{val === null ? '?' : val ? 'true: runs it' : 'false: skips it'}</T>
            </Box>
          );
        })}
        <T x={200} y={168} size={11} anchor="middle" fill={tok('muted')}>Drip: only none and false are false</T>
      </Svg>
    </StepFrame>
  );
}
