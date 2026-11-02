import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

// The call stack (left) grows a frame for each call and loses it on
// return; the heap (right) keeps the object for as long as something can
// still reach it.
const CODE = `function make(v) {
  const n = v * 2;
  const o = { x: n };
  return o;
}
const a = make(3);`;

type Frame = { name: string; vars: [string, string][] };
type S = { line: number; frames: Frame[]; obj: boolean; from: 'o' | 'a' | null; note: string };

const top = (a = ''): Frame => ({ name: 'top level', vars: [['a', a]] });

const STATES: S[] = [
  { line: 5, frames: [top()], obj: false, from: null, note: 'The program starts with one frame on the call stack, for the top level, holding a. Nothing has been given to a yet.' },
  { line: 0, frames: [top(), { name: 'make', vars: [['v', '3']] }], obj: false, from: null, note: 'Calling make(3) pushes a new frame on top of the stack, with the parameter v = 3 in it.' },
  { line: 1, frames: [top(), { name: 'make', vars: [['v', '3'], ['n', '6']] }], obj: false, from: null, note: 'The local variable n = 6 lives in make’s frame too. A plain number fits right there in the frame.' },
  { line: 2, frames: [top(), { name: 'make', vars: [['v', '3'], ['n', '6'], ['o', '•']] }], obj: true, from: 'o', note: 'The object { x: 6 } is put on the heap. The frame holds only o, a pointer to it.' },
  { line: 3, frames: [top(), { name: 'make', vars: [['v', '3'], ['n', '6'], ['o', '•']] }], obj: true, from: 'o', note: 'return o hands back what o holds: the address of the object, not a copy of it.' },
  { line: 5, frames: [top('•')], obj: true, from: 'a', note: 'make’s frame is gone, and v, n and o with it. The object is still on the heap, and a now holds its address. It stays as long as something can reach it; once nothing can, the engine is free to reuse its bytes.' },
];

export default function HeapSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const FH = 26;
  const frameH = (f: Frame) => 26 + f.vars.length * FH;
  let y = 196;
  const placed = st.frames.map((f) => {
    const h = frameH(f);
    y -= h + 6;
    return { f, y, h };
  });
  let ptrY = 0;
  return (
    <StepFrame title="Frames come and go; the heap stays" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={208} title="The call stack with a frame for each active call, and the heap holding an object that outlives the call that made it">
        <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>CALL STACK (grows up)</T>
        <T x={236} y={12} size={11} weight={700} fill={tok('muted')}>HEAP</T>
        <line x1={222} x2={222} y1={4} y2={204} stroke={tok('line')} strokeDasharray="4 4" />
        {placed.map(({ f, y: fy, h }, k) => (
          <Box key={f.name} x={8} y={fy} w={160} h={h} r={6} stroke={k === placed.length - 1 ? tok('brand') : tok('ink', 0.5)} fill={k === placed.length - 1 ? tok('brand', 0.08) : tok('panel')}>
            <T x={16} y={fy + 14} size={12} mono weight={700}>{f.name}</T>
            {f.vars.map(([n, v], j) => {
              const vy = fy + 24 + j * FH;
              if (v === '•') ptrY = vy + 11;
              return (
                <g key={n}>
                  <rect x={16} y={vy} width={144} height={22} rx={3} fill={tok('paper')} stroke={tok('line')} />
                  <T x={24} y={vy + 11} size={13} mono weight={700}>{n}</T>
                  {v === '•' ? <circle cx={150} cy={vy + 11} r={4} fill={tok('ink', 0.8)} /> : <T x={150} y={vy + 11} size={13} mono anchor="end">{v}</T>}
                </g>
              );
            })}
          </Box>
        ))}
        {st.obj && (
          <Box x={262} y={70} w={110} h={44} r={6} fill={tok('accent', 0.1)} stroke={tok('accent')}>
            <T x={317} y={92} size={14} mono anchor="middle">{'{ x: 6 }'}</T>
          </Box>
        )}
        {st.obj && st.from && <Arrow x1={154} y1={ptrY} x2={260} y2={92} bend={0.2} color={tok('accent')} />}
      </Svg>
    </StepFrame>
  );
}
