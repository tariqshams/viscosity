// Checking S <: T for records, one field of T at a time: every field T
// asks for must be in S, with a type that is itself a subtype.
import { StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

type F = [string, string];
type S = { q: string; s: F[]; t: F[]; hs: number; ht: number; mark: '' | 'ok' | 'no'; verdict?: string; note: string };
const P: F[] = [['x', 'number'], ['y', 'number']];
const PC: F[] = [...P, ['colour', 'string']];
const STATES: S[] = [
  { q: 'Pixel <: Point ?', s: PC, t: P, hs: -1, ht: -1, mark: '', note: 'Is a Pixel (x, y and a colour) a subtype of a Point (x and y)? The check walks the fields that T, the expected type, asks for, and looks each one up in S.' },
  { q: 'Pixel <: Point ?', s: PC, t: P, hs: 0, ht: 0, mark: 'ok', note: 'T asks for x : number. S has x, and its type number is a subtype of number (every type is a subtype of itself).' },
  { q: 'Pixel <: Point ?', s: PC, t: P, hs: 1, ht: 1, mark: 'ok', note: 'T asks for y : number. S has it too.' },
  { q: 'Pixel <: Point ?', s: PC, t: P, hs: 2, ht: -1, mark: '', verdict: 'yes: Pixel <: Point', note: 'T asks for nothing more. S’s colour is never looked at: code expecting a Point will not ask for it, so it does no harm. This is width subtyping: extra fields are allowed.' },
  { q: 'Point <: Pixel ?', s: P, t: PC, hs: 1, ht: 1, mark: 'ok', note: 'The other way round. T is now Pixel, so it asks for x, y and colour. x and y are found, as before.' },
  { q: 'Point <: Pixel ?', s: P, t: PC, hs: -1, ht: 2, mark: 'no', verdict: 'no: colour is missing', note: 'T asks for colour : string, and S has no colour. Code expecting a Pixel may read p.colour, so a Point cannot stand in for one. Subtyping has a direction.' },
];

function Col({ x, title, fs, hi, mark }: { x: number; title: string; fs: F[]; hi: number; mark: string }) {
  return (
    <g>
      <T x={x + 75} y={48} size={11} anchor="middle" weight={700} fill={tok('muted')}>{title}</T>
      {fs.map(([n, ty], k) => (
        <Box key={k} x={x} y={60 + k * 30} w={150} h={24} fill={k === hi ? (mark === 'no' ? tok('danger', 0.15) : tok('brand', 0.15)) : tok('panel')} stroke={k === hi ? (mark === 'no' ? tok('danger') : tok('brand')) : tok('line')}>
          <T x={x + 10} y={72 + k * 30} size={12} mono>{`${n} : ${ty}`}</T>
        </Box>
      ))}
    </g>
  );
}

export default function SubtypeSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="Is S a subtype of T? Field by field" steps={s} note={st.note}>
      <Svg w={400} h={180} title="Two columns of fields, S on the left and T on the right, with the field being checked highlighted in both">
        <T x={200} y={18} size={14} mono anchor="middle" weight={700}>{st.q.replace(/ /g, ' ')}</T>
        <Col x={20} title="S (what we have)" fs={st.s} hi={st.hs} mark={st.mark} />
        <Col x={230} title="T (what is expected)" fs={st.t} hi={st.ht} mark={st.mark} />
        {st.mark && <T x={200} y={72 + Math.max(st.hs, st.ht) * 30} size={14} anchor="middle" weight={700} fill={st.mark === 'ok' ? tok('safe') : tok('danger')}>{st.mark === 'ok' ? '✓' : '✗'}</T>}
        {st.verdict && <T x={200} y={162} size={13} anchor="middle" weight={700} fill={st.verdict.startsWith('yes') ? tok('safe') : tok('danger')}>{st.verdict}</T>}
      </Svg>
    </StepFrame>
  );
}
