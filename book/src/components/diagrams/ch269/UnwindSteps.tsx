import { StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// Chapter 269: a throw in parse, a cleanup in load and a catch in main,
// handled in two phases (search, then cleanup), as the Itanium C++ ABI
// describes. Each frame shows the one row of its function's table that
// covers the place where it is stopped.
type Frame = { fn: string; row: string };
type S = { frames: number; look?: number; found?: number; pad?: number; out?: string; phase: string; note: string };

const FRAMES: Frame[] = [
  { fn: 'main', row: 'catch → pad M' },
  { fn: 'load', row: 'cleanup → pad L' },
  { fn: 'parse', row: '(no row)' },
];

const STATES: S[] = [
  { frames: 3, phase: 'normal', note: 'main called load, which opened a file and called parse. Three frames are on the stack, with parse on top. Nothing has gone wrong yet, and no table has been read.' },
  { frames: 3, look: 2, phase: 'search', note: 'parse throws. The unwinder starts the search phase: it reads parse’s table at the place parse stopped. There is no row, so parse cannot handle the error.' },
  { frames: 3, look: 1, phase: 'search', note: 'One frame down, load’s table has a cleanup row (close the file), but a cleanup does not handle the error, so the search keeps going. Nothing is run yet.' },
  { frames: 3, look: 0, found: 0, phase: 'search', note: 'main’s table has a catch row that covers its call to load. A handler exists, so the search phase ends successfully. Only now does anything change.' },
  { frames: 2, phase: 'cleanup', note: 'The cleanup phase begins. parse has nothing to clean up, so its frame is simply discarded: the stack pointer moves past it.' },
  { frames: 2, pad: 1, out: 'close', phase: 'cleanup', note: 'load’s landing pad runs: it closes the file, then resumes the unwinding instead of returning.' },
  { frames: 1, pad: 0, out: 'close, caught', phase: 'cleanup', note: 'load’s frame is discarded and control jumps into main’s landing pad, the catch block. The error is handled and main carries on as normal code.' },
];

export default function UnwindSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="Unwinding a throw, in two phases" steps={s} note={st.note}>
      <Svg w={400} h={210} title="Three stack frames, main at the bottom, load and parse above it, each with the table row that covers it">
        <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>THE STACK (top first)</T>
        <T x={392} y={12} size={11} weight={700} anchor="end" fill={st.phase === 'normal' ? tok('muted') : tok('brand')}>phase: {st.phase}</T>
        {FRAMES.map((f, k) => {
          const y = 150 - k * 52;
          const alive = k < st.frames;
          const look = st.look === k;
          const pad = st.pad === k;
          return (
            <g key={f.fn} opacity={alive ? 1 : 0.22}>
              <Box x={8} y={y} w={150} h={42} dash={!alive} fill={pad ? tok('safe', 0.2) : look ? tok('brand', 0.15) : tok('panel')} stroke={pad ? tok('safe') : look ? tok('brand') : tok('line')}>
                <T x={20} y={y + 21} size={14} mono weight={700}>{f.fn}</T>
                {!alive && <T x={146} y={y + 21} size={11} anchor="end" fill={tok('muted')}>discarded</T>}
              </Box>
              <Box x={196} y={y + 6} w={196} h={30} fill={st.found === k ? tok('brand', 0.15) : 'transparent'} stroke={look ? tok('brand') : tok('line')}>
                <T x={204} y={y + 21} size={12} mono>{f.row}</T>
              </Box>
              {look && <Arrow x1={158} y1={y + 21} x2={194} y2={y + 21} color={tok('brand')} />}
            </g>
          );
        })}
        <T x={8} y={203} size={12} mono fill={tok('muted')}>{st.out ? `printed: ${st.out}` : 'printed: (nothing yet)'}</T>
        <T x={392} y={203} size={11} anchor="end" fill={tok('muted')}>each frame’s table row</T>
      </Svg>
    </StepFrame>
  );
}
