// Incremental parsing: an edit inside the second of three statements.
// The first is reused as it is, the third is reused with its positions
// moved by the change in length, and only the second is parsed again.
import { Box, Svg, T, tok } from '../../viz/svg';

const BEFORE = [
  { text: 'let a = 1;', start: 0, end: 10 },
  { text: 'let b = 2;', start: 11, end: 21 },
  { text: 'let c = 3;', start: 22, end: 32 },
];
const AFTER = [
  { text: 'let a = 1;', start: 0, end: 10, kind: 'reused' },
  { text: 'let b = 200;', start: 11, end: 23, kind: 'parsed again' },
  { text: 'let c = 3;', start: 24, end: 34, kind: 'reused, moved +2' },
];

export default function ReuseFigure() {
  return (
    <Svg w={400} h={226} title="Three statements before and after typing 00 into the second; the first and third subtrees are reused">
      <T x={4} y={12} size={11} weight={700} fill={tok('muted')}>BEFORE</T>
      {BEFORE.map((n, k) => (
        <g key={k}>
          <Box x={4 + k * 132} y={22} w={124} h={44}>
            <T x={66 + k * 132} y={38} size={12} mono anchor="middle">{n.text}</T>
            <T x={66 + k * 132} y={56} size={11} mono anchor="middle" fill={tok('muted')}>{`${n.start}–${n.end}`}</T>
          </Box>
        </g>
      ))}
      <T x={200} y={88} size={12} anchor="middle" weight={700} fill={tok('accent')}>edit: at 20, remove 0, add 2 (“00”)</T>
      <T x={4} y={112} size={11} weight={700} fill={tok('muted')}>AFTER</T>
      {AFTER.map((n, k) => {
        const again = n.kind === 'parsed again';
        const c = again ? tok('danger') : tok('safe');
        return (
          <g key={k}>
            <Box x={4 + k * 132} y={122} w={124} h={44} fill={again ? tok('danger', 0.1) : tok('safe', 0.1)} stroke={c}>
              <T x={66 + k * 132} y={138} size={12} mono anchor="middle">{n.text}</T>
              <T x={66 + k * 132} y={156} size={11} mono anchor="middle" fill={tok('muted')}>{`${n.start}–${n.end}`}</T>
            </Box>
            <T x={66 + k * 132} y={182} size={11} anchor="middle" weight={700} fill={c}>{n.kind}</T>
          </g>
        );
      })}
      <T x={200} y={210} size={11} anchor="middle" fill={tok('muted')}>positions are offsets; an end is one past the last character</T>
    </Svg>
  );
}
