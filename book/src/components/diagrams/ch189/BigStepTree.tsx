// Building the derivation of  if 1 < 2 then 3 + 4 else 0 ⇓ 7  in the
// order a recursive evaluator would: each judgment is asked for (with ?)
// and later answered, children before parents.
import { StepFrame, useSteps } from '../../viz/stepper';
import { Svg, T, tok } from '../../viz/svg';

type J = { id: string; e: string; v: string; x: number; y: number; rule: string; w: number };
const J: J[] = [
  { id: 'n1', e: '1', v: '1', x: 55, y: 30, rule: '', w: 0 },
  { id: 'n2', e: '2', v: '2', x: 145, y: 30, rule: '', w: 0 },
  { id: 'n3', e: '3', v: '3', x: 255, y: 30, rule: '', w: 0 },
  { id: 'n4', e: '4', v: '4', x: 345, y: 30, rule: '', w: 0 },
  { id: 'lt', e: '1 < 2', v: 'true', x: 100, y: 92, rule: 'Lt', w: 150 },
  { id: 'add', e: '3 + 4', v: '7', x: 300, y: 92, rule: 'Add', w: 130 },
  { id: 'if', e: 'if 1 < 2 then 3 + 4 else 0', v: '7', x: 200, y: 154, rule: 'IfT', w: 340 },
];
type St = Record<string, 'asked' | 'done'>;
const ORDER: [string, 'asked' | 'done', string][] = [
  ['if', 'asked', 'We want to know what the whole if evaluates to. Which rule? It depends on the condition, so that is the first premise to establish.'],
  ['lt', 'asked', 'Evaluate the condition, 1 < 2. Its rule, Lt, needs both sides evaluated first.'],
  ['n1', 'done', '1 ⇓ 1: a number evaluates to itself, by the axiom Num. Nothing above the line.'],
  ['n2', 'done', '2 ⇓ 2, the same way.'],
  ['lt', 'done', 'Both premises hold, and 1 is less than 2, so Lt concludes 1 < 2 ⇓ true.'],
  ['add', 'asked', 'The condition is true, so the rule for the whole if is IfT, whose second premise evaluates the then branch, 3 + 4. The else branch, 0, is never evaluated: IfT does not mention it.'],
  ['n3', 'done', '3 ⇓ 3.'],
  ['n4', 'done', '4 ⇓ 4.'],
  ['add', 'done', 'Add concludes 3 + 4 ⇓ 7.'],
  ['if', 'done', 'Both premises of IfT hold, so the conclusion does: the if evaluates to 7. The finished tree is the proof, and it was built in exactly the order an interpreter’s recursive calls return.'],
];
const STATES: { st: St; at: string; note: string }[] = [{ st: {}, at: '', note: 'The rules give the answer as a tree of judgments, each of the form e ⇓ v. Step through to build it the way an evaluator does.' }];
for (const [id, s, note] of ORDER) STATES.push({ st: { ...STATES[STATES.length - 1].st, [id]: s }, at: id, note });

export default function BigStepTree() {
  const s = useSteps(STATES);
  const { st, at, note } = s.state;
  return (
    <StepFrame title="A big-step derivation, built bottom-up" steps={s} note={note}>
      <Svg w={400} h={176} title="A derivation tree: the four number axioms on top, then 1 < 2 ⇓ true and 3 + 4 ⇓ 7, then the whole if ⇓ 7 at the bottom; each judgment shows ? until it is answered">
        {J.map((j) => {
          const state = st[j.id];
          if (!state) return null;
          const text = `${j.e} ⇓ ${state === 'done' ? j.v : '?'}`;
          const hi = at === j.id;
          return (
            <g key={j.id}>
              {j.w > 0 && state === 'done' && (
                <>
                  <line x1={j.x - j.w / 2} y1={j.y - 18} x2={j.x + j.w / 2} y2={j.y - 18} stroke={tok('ink', 0.7)} strokeWidth={1.4} />
                  <T x={j.x + j.w / 2 + 3} y={j.y - 18} size={11} weight={700} fill={tok('accent')}>{j.rule}</T>
                </>
              )}
              {hi && <rect x={j.x - text.length * 3.9 - 4} y={j.y - 10} width={text.length * 7.8 + 8} height={20} rx={4} fill={tok('brand', 0.15)} stroke={tok('brand')} />}
              <T x={j.x} y={j.y} size={13} mono anchor="middle" weight={state === 'done' ? 700 : 400} fill={state === 'done' ? tok('ink') : tok('muted')}>{text.replace(/ /g, ' ')}</T>
            </g>
          );
        })}
      </Svg>
    </StepFrame>
  );
}
