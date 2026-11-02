import { StepFrame, useSteps } from '../../viz/stepper';
import { Svg, T, tok } from '../../viz/svg';

// 32 bytes of memory, addresses 1000-1031, drawn as one row of small
// cells. Above them, the elements of a typed array that starts at 1000:
// 4 elements of 8 bytes (Float64Array) or 8 of 4 bytes (Int32Array).
// Each step picks one index and works out its address.
const BASE = 1000;
const X0 = 16;
const CW = 11;
const NB = 32;

type S = { size: 8 | 4; i: number; note: string };

const STATES: S[] = [
  { size: 8, i: 0, note: 'A Float64Array of 4 elements starts at address 1000. Each element takes 8 bytes, so the four of them cover bytes 1000 to 1031, with no gaps. Element 0 starts right at the beginning: 1000 + 0 × 8 = 1000.' },
  { size: 8, i: 1, note: 'Element 1 is one element along: 1000 + 1 × 8 = 1008. It does not matter what is stored in element 0; only its size does.' },
  { size: 8, i: 2, note: 'Element 2: 1000 + 2 × 8 = 1016. Each step to the right adds the same 8 bytes.' },
  { size: 8, i: 3, note: 'Element 3: 1000 + 3 × 8 = 1024, whose 8 bytes run to 1031. For element 999,999 the sum is just as short, which is the whole point.' },
  { size: 4, i: 5, note: 'The same 32 bytes seen as an Int32Array: 4 bytes per element, so 8 elements. Element 5 is at 1000 + 5 × 4 = 1020. Only the step size changed.' },
];

export default function ElementAddress() {
  const s = useSteps(STATES);
  const st = s.state;
  const n = NB / st.size;
  const ew = st.size * CW;
  const addr = BASE + st.i * st.size;
  return (
    <StepFrame title="Finding element i with a sum" steps={s} note={st.note}>
      <Svg w={400} h={176} title="Bytes 1000 to 1031 in a row, grouped into typed array elements, with the chosen element highlighted and its address worked out">
        <T x={X0} y={12} size={11} weight={700} fill={tok('muted')}>
          {st.size === 8 ? 'FLOAT64ARRAY: 8 BYTES PER ELEMENT' : 'INT32ARRAY: 4 BYTES PER ELEMENT'}
        </T>
        {Array.from({ length: n }, (_, k) => {
          const x = X0 + k * ew;
          const on = k === st.i;
          return (
            <g key={k}>
              <rect x={x + 1} y={24} width={ew - 2} height={30} rx={3}
                fill={on ? tok('brand', 0.85) : tok('brand', 0.18)} stroke={tok('brand')} />
              <T x={x + ew / 2} y={39} size={11} mono weight={700} anchor="middle" fill={on ? tok('panel') : tok('ink')}>
                {st.size === 8 ? `xs[${k}]` : k}
              </T>
            </g>
          );
        })}
        {Array.from({ length: NB }, (_, b) => {
          const inside = b >= st.i * st.size && b < (st.i + 1) * st.size;
          return (
            <rect key={b} x={X0 + b * CW + 1} y={62} width={CW - 2} height={16} rx={1.5}
              fill={inside ? tok('warn', 0.7) : tok('paper')} stroke={tok('line')} />
          );
        })}
        <T x={X0} y={92} size={11} mono fill={tok('muted')}>1000</T>
        <T x={X0 + NB * CW} y={92} size={11} mono anchor="end" fill={tok('muted')}>1031</T>
        <T x={X0 + (st.i * st.size + st.size / 2) * CW} y={92} size={11} mono weight={700} anchor="middle">{addr}</T>
        <T x={X0} y={112} size={11} fill={tok('muted')}>each small box is one byte</T>
        <T x={X0} y={140} size={15} mono weight={700}>
          {`${BASE} + ${st.i} × ${st.size} = ${addr}`}
        </T>
        <T x={X0} y={162} size={12} fill={tok('muted')}>start + index × element size</T>
      </Svg>
    </StepFrame>
  );
}
