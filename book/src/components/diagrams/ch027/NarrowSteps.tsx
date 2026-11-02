import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

const CODE = `function show(id: number | string) {
  if (typeof id === 'string') {
    return id.toUpperCase();
  }
  return id.toFixed(2);
}`;

type Kind = 'number' | 'string';
type S = { line: number; may: Kind[]; ok?: string; note: string };

const STATES: S[] = [
  { line: 0, may: ['number', 'string'], note: 'At the top, id is labelled number | string: it could be either. The checker only allows what is safe for both, so id.toUpperCase() would be an error here.' },
  { line: 1, may: ['number', 'string'], note: 'The if asks, at runtime, which kind of value id holds. The checker reads the very same test and plans for both answers.' },
  { line: 2, may: ['string'], ok: 'toUpperCase() is allowed', note: 'Inside the if, only a string can have got this far. So here the checker narrows id to string, and string methods are allowed.' },
  { line: 4, may: ['number'], ok: 'toFixed(2) is allowed', note: 'The if ended in return. So any id that reaches this line is NOT a string: the checker narrows it to number.' },
  { line: 5, may: ['number', 'string'], note: 'Both paths returned. Nothing about this was checked at runtime by TypeScript: the typeof test you wrote does the runtime work, and the checker just follows along.' },
];

export default function NarrowSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const chip = (k: Kind, x: number) => {
    const on = st.may.includes(k);
    const c = k === 'number' ? 'accent' : 'brand';
    return (
      <g key={k} opacity={on ? 1 : 0.35}>
        <Box x={x} y={34} w={110} h={34} r={17} fill={on ? tok(c, 0.15) : 'transparent'} stroke={on ? tok(c) : tok('line')} dash={!on}>
          <T x={x + 55} y={51.5} size={15} mono weight={700} anchor="middle" fill={on ? tok(c) : tok('muted')}>{k}</T>
        </Box>
        {!on && <line x1={x + 12} y1={51} x2={x + 98} y2={51} stroke={tok('muted')} strokeWidth={2} />}
      </g>
    );
  };
  return (
    <StepFrame title="Narrowing a union" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={104} title="What the checker believes id can be at the highlighted line">
        <T x={8} y={16} size={11} weight={700} fill={tok('muted')}>WHAT THE CHECKER BELIEVES id CAN BE HERE</T>
        {chip('number', 8)}
        <T x={136} y={52} size={18} mono anchor="middle" fill={tok('muted')}>|</T>
        {chip('string', 160)}
        {st.ok && <T x={8} y={90} size={13} mono fill={tok('safe')}>✓ {st.ok}</T>}
      </Svg>
    </StepFrame>
  );
}
