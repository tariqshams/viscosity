import { StepFrame, useSteps } from '../../viz/stepper';
import { Svg, T, tok } from '../../viz/svg';

// Eight 64-byte cache lines (two rows of four), each drawn as eight 8-byte
// slots. Each step reads 8 values with a different stride and counts the
// lines touched.
type S = { stride: number; start: number; label: string; note: string };
const STATES: S[] = [
  { stride: 8, start: 0, label: 'Float64Array of masses: stride 8 bytes', note: 'Stride 8: the masses sit side by side. Eight reads touch one line, and every byte fetched is used.' },
  { stride: 48, start: 32, label: 'packed buffer, 6 fields each: stride 48 bytes', note: 'Stride 48: reading only mass from a packed buffer of 6-field particles. Each read skips the other five fields, so eight reads touch six lines and use only 64 of the 384 bytes fetched.' },
  { stride: 64, start: 40, label: 'one object per line (toy): stride 64 bytes', note: 'Stride 64 or more: every read lands in a new line. Eight reads, eight lines, 64 useful bytes out of 512. Objects behind pointers are often at least this bad, and they need not even be in order.' },
];

const CELL = 10.5;
const LINE = 8 * CELL;
const GAP = 8;

export default function StrideSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const addrs = Array.from({ length: 8 }, (_, k) => st.start + k * st.stride);
  const lines = new Set(addrs.map((a) => Math.floor(a / 64)));
  const pos = (line: number) => ({ x: 14 + (line % 4) * (LINE + GAP), y: 40 + Math.floor(line / 4) * 54 });
  return (
    <StepFrame title="Stride: the gap between reads" steps={s} note={st.note}>
      <Svg w={400} h={186} title="Eight cache lines of 64 bytes, with dots where eight reads land for strides of 8, 48 and 64 bytes">
        <T x={14} y={14} size={12} weight={700}>{st.label}</T>
        {Array.from({ length: 8 }, (_, line) => {
          const { x, y } = pos(line);
          const touched = lines.has(line);
          return (
            <g key={line}>
              <rect x={x} y={y} width={LINE} height={24} rx={3} fill={touched ? tok('brand', 0.15) : tok('paper')} stroke={touched ? tok('brand') : tok('line')} strokeWidth={touched ? 2 : 1} />
              {Array.from({ length: 7 }, (_, k) => (
                <line key={k} x1={x + (k + 1) * CELL} x2={x + (k + 1) * CELL} y1={y + 3} y2={y + 21} stroke={tok('line')} />
              ))}
              <T x={x + LINE / 2} y={y + 34} size={10} mono anchor="middle" fill={tok('muted')}>line {line}</T>
            </g>
          );
        })}
        {addrs.map((a, k) => {
          const line = Math.floor(a / 64);
          if (line > 7) return null;
          const { x, y } = pos(line);
          const slot = (a % 64) / 8;
          return <rect key={k} x={x + slot * CELL + 1.5} y={y + 4} width={CELL - 3} height={16} rx={2} fill={tok('f5', 0.95)} />;
        })}
        <rect x={14} y={152} width={372} height={28} rx={5} fill={tok('panel')} stroke={tok('line')} />
        <T x={24} y={166} size={13}>8 reads → <tspan fontWeight={700}>{lines.size}</tspan> line{lines.size > 1 ? 's' : ''} → <tspan fontWeight={700}>{lines.size * 64}</tspan> bytes fetched for 64 used</T>
      </Svg>
    </StepFrame>
  );
}
