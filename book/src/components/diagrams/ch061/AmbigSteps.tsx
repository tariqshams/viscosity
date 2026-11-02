import { useState } from 'react';
import { StepFrame, useSteps } from '../../viz/stepper';
import { Svg, T, tok } from '../../viz/svg';
import { type PT, drawTree, frontier, layout, shownAfter } from './ptree_o80';

// 1 - 2 - 3  under the ambiguous grammar  expr → expr "-" expr | NUMBER
const num = (id: string, v: string): PT => ({ id, label: 'expr', kids: [{ id: id + 'n', label: 'NUMBER', term: true, lex: v }] });
const LEFT: PT = {
  id: 'r', label: 'expr', kids: [
    { id: 'a', label: 'expr', kids: [num('a1', '1'), { id: 'm1', label: '-', term: true }, num('a2', '2')] },
    { id: 'm2', label: '-', term: true },
    num('a3', '3'),
  ],
};
const RIGHT: PT = {
  id: 'r', label: 'expr', kids: [
    num('b1', '1'),
    { id: 'm1', label: '-', term: true },
    { id: 'b', label: 'expr', kids: [num('b2', '2'), { id: 'm2', label: '-', term: true }, num('b3', '3')] },
  ],
};

type Mode = 'left' | 'right';
const TREES: Record<Mode, PT> = { left: LEFT, right: RIGHT };
const ORDER: Record<Mode, string[]> = { left: ['r', 'a', 'a1', 'a2', 'a3'], right: ['r', 'b1', 'b', 'b2', 'b3'] };
const RULE: Record<string, string> = { r: 'expr → expr "-" expr', a: 'expr → expr "-" expr', b: 'expr → expr "-" expr' };
const NOTES: Record<Mode, string[]> = {
  left: [
    'One start symbol, expr. Every step below rewrites the leftmost nonterminal, so this is a leftmost derivation.',
    'Step 1: expr → expr "-" expr. So far both derivations agree.',
    'Step 2: here is the choice. We rewrite the leftmost expr with expr → expr "-" expr again, so the first subtraction goes inside the left child.',
    'Step 3: the leftmost expr becomes the number 1.',
    'Step 4: the next one becomes 2.',
    'Step 5: and the last becomes 3. The tree groups (1 - 2) - 3, which is -4.',
  ],
  right: [
    'The same sentence, the same grammar, and again always the leftmost nonterminal.',
    'Step 1: expr → expr "-" expr, exactly as before.',
    'Step 2: this time the leftmost expr becomes the number 1 straight away.',
    'Step 3: now the leftmost nonterminal is the right-hand expr, and we use expr → expr "-" expr on it, so the second subtraction goes inside the right child.',
    'Step 4: the leftmost expr becomes 2.',
    'Step 5: and the last becomes 3. Same tokens, second leftmost derivation, second tree: 1 - (2 - 3), which is 2.',
  ],
};
const PLACED: Record<Mode, ReturnType<typeof layout>> = { left: layout(LEFT, 20, 380, 100, 46), right: layout(RIGHT, 20, 380, 100, 46) };

const build = (m: Mode) => ORDER[m].concat(['']).map((_, k) => ({ done: ORDER[m].slice(0, k), next: ORDER[m][k], rule: k ? RULE[ORDER[m][k - 1]] ?? 'expr → NUMBER' : null, note: NOTES[m][k] }));
const SL = build('left');
const SR = build('right');

export default function AmbigSteps() {
  const [mode, setMode] = useState<Mode>('left');
  const sl = useSteps(SL);
  const sr = useSteps(SR);
  const s = mode === 'left' ? sl : sr;
  const st = s.state;
  const tree = TREES[mode];
  const form = frontier(tree, st.done);
  const cw = (p: PT) => Math.max(14, p.label.length * 7.8) + 8;
  let x = 200 - form.reduce((w, p) => w + cw(p), 0) / 2;
  return (
    <StepFrame title="Two leftmost derivations of 1 - 2 - 3" steps={s} note={st.note}>
      <div className="mb-2 flex gap-2">
        {(['left', 'right'] as Mode[]).map((m) => (
          <button key={m} type="button" className={'btn-3d px-3 py-1 text-sm' + (m === mode ? ' btn-3d-primary font-semibold' : '')}
            onClick={() => { setMode(m); (m === 'left' ? sl : sr).reset(); }} aria-pressed={m === mode}>
            {m === 'left' ? 'First derivation' : 'Second derivation'}
          </button>
        ))}
      </div>
      <Svg w={400} h={272} title="Above, the current sentential form with the next nonterminal underlined; below, the parse tree so far.">
        <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>SENTENTIAL FORM</T>
        {form.map((p) => {
          const w = cw(p);
          const cx = x + w / 2;
          x += w;
          return (
            <g key={p.id}>
              <T x={cx} y={36} size={13} mono anchor="middle" weight={p.term ? 400 : 700} fill={p.term ? undefined : tok('brand')}>{p.label}</T>
              {p.id === st.next && <line x1={cx - w / 2 + 3} y1={47} x2={cx + w / 2 - 3} y2={47} stroke={tok('brand')} strokeWidth={2.5} />}
            </g>
          );
        })}
        <T x={8} y={66} size={11} weight={700} fill={tok('muted')}>{st.rule ? 'LAST RULE USED: ' : 'NO RULE USED YET'}</T>
        {st.rule && <T x={130} y={66} size={12} mono>{st.rule}</T>}
        {drawTree(PLACED[mode], shownAfter(tree, st.done), st.next)}
      </Svg>
    </StepFrame>
  );
}
