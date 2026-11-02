// Chapter 316: which addresses a value of each type may start at. The
// alignments are what align_of printed with rustc 1.97.0 on x86-64 Linux
// (u8 1, u16 2, u32 4, f64 8); the Rust Reference says a value of
// alignment n must be stored at an address that is a multiple of n.
import { StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

type S = {
  ty: string;
  align: number;
  size: number;
  /** Where to draw one value of the type, if any. */
  at?: number[];
  /** Cells to draw as a gap (unused bytes). */
  gap?: number[];
  note: string;
};

const STATES: S[] = [
  { ty: 'u8', align: 1, size: 1, at: [5], note: 'Memory is one long row of numbered bytes. A u8 has alignment 1, and every address is a multiple of 1, so a u8 may sit anywhere: here it is at address 5.' },
  { ty: 'u16', align: 2, size: 2, at: [6], note: 'A u16 has alignment 2: it may only start at an even address. The bright cells are the allowed starts; this one sits at 6 and covers bytes 6 and 7.' },
  { ty: 'u32', align: 4, size: 4, at: [12], note: 'A u32 has alignment 4: it may start at 0, 4, 8, 12, 16 or 20. Starting at 13 is not allowed, even though four free bytes are there.' },
  { ty: 'f64', align: 8, size: 8, at: [8], note: 'An f64 has alignment 8, so only every eighth address will do. Every allowed start is also the start of a row here, which is why its eight bytes never straddle two rows of eight.' },
  { ty: '(u8, u32)', align: 4, size: 8, at: [0, 4], gap: [1, 2, 3], note: 'Now put a u8 and a u32 side by side. The u8 takes address 0; the u32 cannot start at 1, 2 or 3, so it starts at 4, and three bytes sit unused in between. That is why size_of::<(u8, u32)>() is 8, not 5; the next chapter is about those gaps.' },
];

export default function AlignSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const cw = 42;
  const x0 = 46;
  const cell = (i: number) => ({ x: x0 + (i % 8) * cw, y: 34 + Math.floor(i / 8) * 46 });
  // The bytes the drawn value (or values) cover.
  const used = new Map<number, string>();
  if (st.ty === '(u8, u32)') {
    used.set(0, 'u8');
    [4, 5, 6, 7].forEach((i) => used.set(i, 'u32'));
  } else {
    for (const a of st.at ?? []) for (let k = 0; k < st.size; k++) used.set(a + k, st.ty);
  }
  return (
    <StepFrame title="Where each type may start" steps={s} note={st.note}>
      <Svg w={400} h={186} title="Twenty-four numbered bytes; the addresses where the chosen type may start are highlighted, and one value of it is drawn">
        <T x={8} y={14} size={12} weight={700} fill={tok('brand')}>{st.ty}</T>
        <T x={392} y={14} size={12} anchor="end" fill={tok('muted')}>align {st.align}, size {st.size}</T>
        {[0, 1, 2].map((r) => (
          <T key={r} x={38} y={52 + r * 46} size={11} mono anchor="end" fill={tok('muted')}>{r * 8}</T>
        ))}
        {Array.from({ length: 24 }, (_, i) => {
          const { x, y } = cell(i);
          const allowed = i % st.align === 0;
          const v = used.get(i);
          const isGap = st.gap?.includes(i);
          const fill = v ? tok(v === 'u8' ? 'f1' : v === 'u32' ? 'f3' : 'brand', 0.3) : allowed ? tok('safe', 0.12) : 'transparent';
          const stroke = v ? tok(v === 'u8' ? 'f1' : v === 'u32' ? 'f3' : 'brand') : isGap ? tok('muted', 0.7) : allowed ? tok('safe') : tok('line', 0.6);
          return (
            <Box key={i} x={x + 1} y={y} w={cw - 2} h={36} r={2} fill={fill} stroke={stroke} dash={isGap || (!v && !allowed)}>
              <T x={x + cw / 2} y={y + 11} size={11} mono anchor="middle" fill={tok('muted')}>{i}</T>
              <T x={x + cw / 2} y={y + 26} size={11} mono anchor="middle" fill={tok('ink')}>
                {v && (st.ty === '(u8, u32)' ? (i === 0 || i === 4 ? v : '') : i === st.at?.[0] ? v : '')}
                {isGap ? 'gap' : ''}
              </T>
            </Box>
          );
        })}
        <Box x={8} y={172} w={12} h={10} r={2} fill={tok('safe', 0.12)} stroke={tok('safe')} />
        <T x={26} y={177} size={11} fill={tok('muted')}>an allowed start (address % {st.align} == 0)</T>
      </Svg>
    </StepFrame>
  );
}
