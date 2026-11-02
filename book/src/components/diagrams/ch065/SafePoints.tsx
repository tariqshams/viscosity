import { Box, Svg, T, tok } from '../../viz/svg';

type Tk = { t: string; m: 'bad' | 'skip' | 'next' | 'plain' };

// Each row: the tokens around one error, and where synchronize() stops.
const ROWS: { title: string; toks: Tk[]; stop: number }[] = [
  {
    title: '1. just after a ;',
    toks: [{ t: 'y', m: 'plain' }, { t: '=', m: 'plain' }, { t: '2', m: 'plain' }, { t: '3', m: 'bad' }, { t: '+', m: 'skip' }, { t: '4', m: 'skip' }, { t: ';', m: 'skip' }, { t: 'y', m: 'next' }],
    stop: 7,
  },
  {
    title: '2. before a keyword that starts a statement',
    toks: [{ t: 'let', m: 'plain' }, { t: 'x', m: 'plain' }, { t: '=', m: 'plain' }, { t: '1', m: 'plain' }, { t: 'print', m: 'bad' }, { t: 'x', m: 'plain' }, { t: ';', m: 'plain' }],
    stop: 4,
  },
  {
    title: '3. at the } that closes the block',
    toks: [{ t: 'let', m: 'plain' }, { t: 'a', m: 'plain' }, { t: '=', m: 'plain' }, { t: 'w', m: 'plain' }, { t: '*', m: 'plain' }, { t: 'h', m: 'plain' }, { t: '}', m: 'bad' }],
    stop: 6,
  },
  {
    title: '4. braces opened while skipping: skipped whole',
    toks: [{ t: '2', m: 'plain' }, { t: '3', m: 'bad' }, { t: '{', m: 'skip' }, { t: 'print', m: 'skip' }, { t: '1', m: 'skip' }, { t: ';', m: 'skip' }, { t: '}', m: 'skip' }, { t: 'print', m: 'next' }],
    stop: 7,
  },
];

/** The places where Drip's synchronize() stops skipping. */
export default function SafePoints() {
  const RH = 62;
  return (
    <Svg w={400} h={ROWS.length * RH + 22} title="Four rows of tokens, each with a syntax error, showing where Drip stops skipping: just after a semicolon; before a keyword such as print; at the closing brace of the block it is in; and after a whole pair of braces it opened while skipping.">
      <T x={8} y={10} size={10.5} fill={tok('danger')} weight={700}>■ error noticed here</T>
      <T x={140} y={10} size={10.5} fill={tok('muted')} weight={700}>┄ skipped</T>
      <T x={222} y={10} size={10.5} fill={tok('brand')} weight={700}>│ parsing resumes</T>
      {ROWS.map((r, row) => {
        const y = 24 + row * RH;
        let x = 8;
        let stopX = 0;
        const boxes = r.toks.map((tk, k) => {
          const w = 14 + tk.t.length * 8;
          if (k === r.stop) stopX = x - 3;
          const fill = tk.m === 'bad' ? tok('danger', 0.18) : tk.m === 'skip' ? 'transparent' : tok('panel');
          const stroke = tk.m === 'bad' ? tok('danger') : tk.m === 'skip' ? tok('ink', 0.35) : tok('ink', 0.4);
          const g = (
            <g key={k} opacity={tk.m === 'skip' ? 0.55 : 1}>
              <Box x={x} y={y + 18} w={w} h={26} dash={tk.m === 'skip'} fill={fill} stroke={stroke}>
                <T x={x + w / 2} y={y + 31} size={13} mono anchor="middle">{tk.t}</T>
              </Box>
              {tk.m === 'skip' && <line x1={x + 3} y1={y + 31} x2={x + w - 3} y2={y + 31} stroke={tok('danger')} strokeWidth={1.4} />}
            </g>
          );
          x += w + 5;
          return g;
        });
        return (
          <g key={row}>
            <T x={8} y={y + 6} size={11.5} weight={700}>{r.title}</T>
            {boxes}
            <line x1={stopX} y1={y + 13} x2={stopX} y2={y + 49} stroke={tok('brand')} strokeWidth={3} />
          </g>
        );
      })}
    </Svg>
  );
}
