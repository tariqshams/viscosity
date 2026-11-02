import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Svg, T, tok } from '../../viz/svg';

// What the checker knows about `e` at each line of an exhaustive switch.
// Each variant of the union is a chip: blue while it is still possible,
// orange when it is the one this branch has narrowed to, grey once a
// case above has handled it, red when it reaches `never` unhandled.
const CODE = `function evaluate(e: Expr): number {
  switch (e.kind) {
    case 'num': return e.value;
    case 'neg': return -evaluate(e.arg);
    case 'add': return evaluate(e.left)
                     + evaluate(e.right);
    default: return unreachable(e);
  }
}`;

type Chip = 'open' | 'here' | 'done' | 'bad';
type S = { line: number; label: string; chips: Chip[]; mul?: boolean; note: string };

const NAMES = ['num', 'neg', 'add', 'mul'];

const STATES: S[] = [
  { line: 0, label: 'e: Expr', chips: ['open', 'open', 'open'], note: 'On entry, e may be any of the three variants of Expr, so only the field they all share, kind, can be read safely.' },
  { line: 2, label: "e: { kind: 'num' }", chips: ['here', 'open', 'open'], note: "In case 'num', the checker has narrowed e to the num variant, so e.value is allowed; outside this case it would be an error." },
  { line: 3, label: "e: { kind: 'neg' }", chips: ['done', 'here', 'open'], note: "In case 'neg', e is the neg variant and has an arg. The num variant is ruled out here, because its case has already returned." },
  { line: 4, label: "e: { kind: 'add' }", chips: ['done', 'done', 'here'], note: "In case 'add', e has left and right. Every variant now has a case of its own." },
  { line: 6, label: 'e: never', chips: ['done', 'done', 'done'], note: 'In default, no variant is left, so e has the type never and unreachable(e), whose parameter is never, is accepted. The checker has proved the switch complete.' },
  { line: 6, label: "e: { kind: 'mul' }", chips: ['done', 'done', 'done', 'bad'], mul: true, note: "Now add a mul variant to Expr and forget its case. In default, e is still the mul variant, which is not never, so the call to unreachable(e) is a compile error that names the missing case." },
];

export default function NarrowSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const fill = (c: Chip) => (c === 'here' ? tok('brand', 0.85) : c === 'open' ? tok('accent', 0.3) : c === 'bad' ? tok('danger', 0.85) : tok('muted', 0.15));
  const stroke = (c: Chip) => (c === 'here' ? tok('brand') : c === 'open' ? tok('accent') : c === 'bad' ? tok('danger') : tok('line'));
  return (
    <StepFrame title="Narrowing a tagged union, case by case" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={92} title={`The checker's view of e on this line: ${st.label}`}>
        <T x={10} y={14} size={11} weight={700} fill={tok('muted')}>VARIANTS OF Expr</T>
        {st.chips.map((c, k) => (
          <g key={k}>
            <rect x={10 + k * 96} y={26} width={86} height={28} rx={5} fill={fill(c)} stroke={stroke(c)} strokeWidth={1.5} />
            <T x={10 + k * 96 + 43} y={40} size={13} mono weight={700} anchor="middle" opacity={c === 'done' ? 0.45 : 1}>{NAMES[k]}</T>
          </g>
        ))}
        <T x={10} y={76} size={13} mono weight={700}>{st.label}</T>
        {st.mul && <T x={390} y={76} size={12} anchor="end" fill={tok('danger')} weight={700}>error TS2345</T>}
      </Svg>
    </StepFrame>
  );
}
