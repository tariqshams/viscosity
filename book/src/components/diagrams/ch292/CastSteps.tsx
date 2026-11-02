import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

// Chapter 292: a downcast checked at run time, the way the C++ runtime
// does it, in outline, for single inheritance: follow the object to its typeinfo, then
// walk base pointers looking for the target type.
const CODE = `struct Shape { virtual ~Shape() {} };
struct Circle : Shape { double r; };
struct Ring : Circle { double w; };

Shape* s = new Ring;
dynamic_cast<Circle*>(s); // ?
dynamic_cast<Ring*>(new Circle);`;

type S = { line: number | null; chain: string[]; at: number; target: string; verdict?: string; ok?: boolean; note: string };

const STATES: S[] = [
  { line: 4, chain: ['Ring', 'Circle', 'Shape'], at: -1, target: 'Circle', note: 's has the static type Shape*, but the object is a Ring. The compiler cannot know which; only the object knows, through its vptr.' },
  { line: 5, chain: ['Ring', 'Circle', 'Shape'], at: 0, target: 'Circle', note: 'dynamic_cast loads the vptr, reads the typeinfo slot of the vtable and finds the object\'s real type: Ring. Ring is not Circle...' },
  { line: 5, chain: ['Ring', 'Circle', 'Shape'], at: 1, target: 'Circle', verdict: 'Circle*', ok: true, note: '...so it follows Ring\'s base pointer to Circle\'s typeinfo. Found: a Ring is a Circle, and the cast returns the pointer.' },
  { line: 6, chain: ['Circle', 'Shape'], at: 0, target: 'Ring', note: 'Now the opposite: the object is a plain Circle and we ask for a Ring. The walk starts at Circle\'s typeinfo...' },
  { line: 6, chain: ['Circle', 'Shape'], at: 1, target: 'Ring', note: '...goes up to Shape...' },
  { line: 6, chain: ['Circle', 'Shape'], at: 2, target: 'Ring', verdict: 'nullptr', ok: false, note: '...and runs out of bases without meeting Ring. A Circle is not a Ring, so the cast gives nullptr. Every step was a load and a comparison of typeinfo, all data the compiler had to keep for run time.' },
];

export default function CastSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="dynamic_cast walking the typeinfo chain" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={104} title="The chain of typeinfo records from the object's real type up through its bases, with the one being checked highlighted, and the result">
        <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>{`LOOKING FOR typeinfo(${st.target})`}</T>
        {st.chain.map((n, i) => {
          const hit = i === st.at;
          const found = hit && n === st.target;
          return (
            <g key={n}>
              <Box x={8 + i * 112} y={24} w={96} h={34} fill={found ? tok('safe', 0.2) : hit ? tok('brand', 0.15) : tok('panel')} stroke={found ? tok('safe') : hit ? tok('brand') : tok('line')}>
                <T x={56 + i * 112} y={41} size={13} mono anchor="middle">{n}</T>
              </Box>
              {i < st.chain.length - 1 && <T x={108 + i * 112} y={41} size={12} anchor="middle" fill={tok('muted')}>→</T>}
            </g>
          );
        })}
        <T x={8} y={78} size={11} fill={tok('muted')}>each arrow is a base pointer</T>
        {st.verdict && (
          <Box x={240} y={68} w={152} h={28} fill={st.ok ? tok('safe', 0.15) : tok('danger', 0.12)} stroke={st.ok ? tok('safe') : tok('danger')}>
            <T x={316} y={82} size={12} mono anchor="middle">{`result: ${st.verdict}`}</T>
          </Box>
        )}
      </Svg>
    </StepFrame>
  );
}
