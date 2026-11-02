import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const LEFT = ['for i in a..b {', '  body', '}'];

/** [text, which trap it shows (or null)] */
const RIGHT: [string, string | null][] = [
  ['{', null],
  ['  let end = b;', 'once'],
  ['  let k = a;', 'hidden'],
  ['  while k < end {', null],
  ['    let i = k;', 'fresh'],
  ['    { body }', null],
  ['    k += 1;', 'skip'],
  ['  }', null],
  ['}', null],
];

const NOTES: Record<string, [string, string]> = {
  once: ['b read once', 'brand'],
  hidden: ['must not clash', 'muted'],
  fresh: ['fresh i each time', 'safe'],
  skip: ['continue skips!', 'danger'],
};

export default function DesugarFor() {
  const lh = 19;
  const ry = 40;
  return (
    <Svg w={400} h={214} title="A for loop over a range on the left, and the while loop it seems to stand for on the right, with notes: the end is evaluated once, the hidden names must not clash with the program's, each time round has a fresh i, and a continue in the body would skip the k += 1 step.">
      <T x={8} y={14} size={11} weight={700} fill={tok('muted')}>WRITTEN</T>
      <Box x={8} y={26} w={128} h={70} fill={tok('panel')} stroke={tok('ink', 0.4)}>
        {LEFT.map((l, i) => (
          <T key={i} x={16} y={42 + i * lh} size={12} mono>{l}</T>
        ))}
      </Box>
      <Arrow x1={140} y1={60} x2={160} y2={60} color={tok('ink', 0.5)} />
      <T x={166} y={14} size={11} weight={700} fill={tok('muted')}>REWRITTEN (NOT SAFE)</T>
      <Box x={164} y={26} w={130} h={RIGHT.length * lh + 14} fill={tok('panel')} stroke={tok('ink', 0.4)} dash>
        {RIGHT.map(([l], i) => (
          <T key={i} x={170} y={ry + i * lh} size={11.5} mono>{l}</T>
        ))}
      </Box>
      {RIGHT.map(([, k], i) => {
        if (!k) return null;
        const [text, c] = NOTES[k];
        return (
          <g key={i}>
            <line x1={296} y1={ry + i * lh} x2={302} y2={ry + i * lh} stroke={tok(c)} strokeWidth={2} />
            <T x={305} y={ry + i * lh} size={11} fill={tok(c)} weight={k === 'skip' ? 700 : 400}>{text}</T>
          </g>
        );
      })}
    </Svg>
  );
}
