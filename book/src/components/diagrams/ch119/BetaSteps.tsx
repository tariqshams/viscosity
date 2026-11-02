// succ 1 reduced to 2, one beta step at a time, in normal order. The
// redex about to be reduced is highlighted.
import { StepFrame, useSteps } from '../../viz/stepper';
import { Svg, T, tok } from '../../viz/svg';

type S = { pre: string; redex: string; post: string; note: string; done?: boolean };
const STATES: S[] = [
  { pre: '', redex: 'succ 1', post: '', note: 'succ is λn. λf. λx. f (n f x) and 1 is λf. λx. f x (apply f once). Writing the names out gives the term on the next line.' },
  { pre: '', redex: '(λn. λf. λx. f (n f x)) (λf. λx. f x)', post: '', note: 'The whole term is a redex: a λ applied to an argument. Beta-reduction replaces every n in the body λf. λx. f (n f x) with the argument.' },
  { pre: 'λf. λx. f (', redex: '(λf. λx. f x) f', post: ' x)', note: 'n has gone, and its place holds the numeral 1. The next redex in normal order (leftmost, outermost) is that numeral applied to f. Its own λf binds a different f from the outer one, but the argument f is free here, so nothing is captured.' },
  { pre: 'λf. λx. f (', redex: '(λx. f x) x', post: ')', note: 'Substituting the outer f for the inner one gave λx. f x. One more redex: that function applied to x.' },
  { pre: 'λf. λx. f (f x)', redex: '', post: '', done: true, note: 'No λ is applied to anything any more: this is a normal form, and it applies f twice. It is the numeral 2. Note that all but the first step happened inside a λ body, which JavaScript never does.' },
];

const CW = 8.4;

export default function BetaSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const all = st.pre + st.redex + st.post;
  const x0 = 200 - ([...all].length * CW) / 2;
  const rx = x0 + [...st.pre].length * CW;
  const rw = [...st.redex].length * CW;
  return (
    <StepFrame title="Reducing succ 1" steps={s} note={st.note}>
      <Svg w={400} h={92} title="The current term, with the redex being reduced highlighted">
        <T x={200} y={16} size={12} anchor="middle" weight={700} fill={tok('muted')}>{st.done ? 'normal form: no redex left' : 'step ' + s.i + ': the highlighted part is the redex'}</T>
        {st.redex && <rect x={rx - 2} y={36} width={rw + 4} height={24} rx={4} fill={tok('brand', 0.18)} stroke={tok('brand')} />}
        <T x={x0} y={49} size={14} mono fill={st.done ? tok('safe') : tok('ink')} weight={st.done ? 700 : 400}>{all.replace(/ /g, ' ')}</T>
        <T x={200} y={80} size={12} anchor="middle" fill={tok('muted')}>(λx. t) s  →  t with s in place of x</T>
      </Svg>
    </StepFrame>
  );
}
