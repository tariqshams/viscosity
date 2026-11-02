import { StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// Chapter 265: a Vec<f64> growing. The stack part is (ptr, len, cap), as
// in the std docs' picture of a Vec. The capacities 0, 4, 8 are what
// rustc 1.97 printed on this book's machine; Vec guarantees no particular
// growth strategy.
type S = {
  len: number; cap: number;
  oldCap?: number; oldFreed?: boolean;
  first?: 'old' | 'none';
  code: string; note: string;
};

const STATES: S[] = [
  { len: 0, cap: 0, code: 'let mut v: Vec<f64> = Vec::new();', note: 'An empty Vec allocates nothing yet. The value on the stack is three words: a pointer, a length (0) and a capacity (0).' },
  { len: 1, cap: 4, code: 'v.push(1.0);', note: 'The first push allocates a heap buffer. Here it had room for 4 f64s; one slot is in use, so len is 1 and cap is 4.' },
  { len: 4, cap: 4, code: 'v.push(2.0); v.push(3.0); v.push(4.0);', note: 'Three more pushes fill the buffer without allocating: len catches up with cap. The four numbers sit side by side, 8 bytes each.' },
  { len: 4, cap: 4, first: 'old', code: 'let first = &v[0];   // suppose…', note: 'Suppose we borrow the first element. first is a pointer straight into the heap buffer.' },
  { len: 5, cap: 8, oldCap: 4, oldFreed: true, first: 'old', code: 'v.push(5.0);   // len == cap', note: 'The buffer is full, so push allocates a bigger one, moves the four elements across and frees the old one. first now points at freed memory.' },
  { len: 5, cap: 8, oldCap: 4, oldFreed: true, first: 'none', code: 'error[E0502]: cannot borrow `v` as mutable', note: 'That is exactly the program the borrow checker rejects: a push (a mutable borrow) while first (a shared borrow) is still in use. Remove the later use of first and it compiles.' },
];

const CELL = 34;

function Buffer({ x, y, cap, len, freed, label }: { x: number; y: number; cap: number; len: number; freed?: boolean; label: string }) {
  return (
    <g opacity={freed ? 0.55 : 1}>
      <T x={x} y={y - 10} size={10} fill={tok('muted')}>{label}</T>
      {Array.from({ length: cap }, (_, k) => (
        <Box key={k} x={x + k * CELL} y={y} w={CELL - 2} h={28} r={3}
          fill={k < len && !freed ? tok('f1', 0.22) : 'transparent'}
          stroke={freed ? tok('danger') : k < len ? tok('f1') : tok('line')} dash={freed || k >= len}>
          <T x={x + k * CELL + 16} y={y + 14} size={10} mono anchor="middle">{k < len ? `${k + 1}.0` : ''}</T>
        </Box>
      ))}
    </g>
  );
}

export default function VecSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="A Vec grows" steps={s} note={st.note}>
      <pre className="code-surface !my-0 !border-line font-mono">{st.code}</pre>
      <Svg w={400} h={230} title="A Vec's pointer, length and capacity on the stack, and its buffer on the heap">
        <T x={8} y={14} size={11} weight={700} fill={tok('brand')}>stack: v</T>
        {['ptr', 'len', 'cap'].map((f, k) => (
          <Box key={f} x={8 + k * 62} y={24} w={58} h={34} r={3} fill={tok('panel')} stroke={tok('ink', 0.5)}>
            <T x={37 + k * 62} y={34} size={9} anchor="middle" fill={tok('muted')}>{f}</T>
            <T x={37 + k * 62} y={49} size={12} mono anchor="middle">{f === 'ptr' ? (st.cap ? '●' : '–') : f === 'len' ? st.len : st.cap}</T>
          </Box>
        ))}
        {st.first && (
          <g>
            <Box x={210} y={24} w={70} h={34} r={3} stroke={st.first === 'old' && st.oldFreed ? tok('danger') : tok('ink', 0.5)} dash={st.first === 'none'}>
              <T x={245} y={34} size={9} anchor="middle" fill={tok('muted')}>first</T>
              <T x={245} y={49} size={12} mono anchor="middle">{st.first === 'none' ? '✕' : '●'}</T>
            </Box>
            {st.first === 'old' && <Arrow x1={245} y1={58} x2={st.oldFreed ? 300 : 24} y2={st.oldFreed ? 162 : 98} color={st.oldFreed ? tok('danger') : tok('ink', 0.7)} bend={st.oldFreed ? 0 : -0.3} />}
          </g>
        )}
        {st.cap > 0 && <T x={392} y={86} size={11} weight={700} anchor="end" fill={tok('brand')}>heap</T>}
        {st.oldCap && <Buffer x={256} y={164} cap={st.oldCap} len={4} freed={st.oldFreed} label="old buffer (freed)" />}
        {st.cap > 0 && <Arrow x1={20} y1={58} x2={20} y2={98} />}
        {st.cap > 0 && <Buffer x={8} y={100} cap={st.cap} len={st.len} label={st.oldCap ? 'new buffer' : ''} />}
      </Svg>
    </StepFrame>
  );
}
