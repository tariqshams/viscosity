import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

// rustc's table of impls, for an associated type (one row per type) and
// for a hypothetical generic trait (any number of rows per type), and
// what a call to next() can learn from each.

type Row = { ty: string; item: string; hot?: boolean };
type S = { code: string; line: number | null; title: string; rows: Row[]; out?: { text: string; bad?: boolean }; note: string };

const TRAIT = `trait Iterator {
    type Item;
    fn next(&mut self)
        -> Option<Self::Item>;
}`;

const STATES: S[] = [
  { code: TRAIT, line: 1, title: 'impls of Iterator', rows: [], note: 'The trait declares a blank, Item, and uses it as Self::Item in next. No type has filled it in yet, so the table of implementations is empty.' },
  { code: `impl Iterator for Countdown {\n    type Item = u32;\n    ...\n}`, line: 1, title: 'impls of Iterator', rows: [{ ty: 'Countdown', item: 'u32', hot: true }], note: 'This impl fills the blank for Countdown: its Item is u32. rustc records one row: Countdown → u32.' },
  { code: `impl Iterator for Tokens<'_> {\n    type Item = Token;\n    ...\n}`, line: 1, title: 'impls of Iterator', rows: [{ ty: 'Countdown', item: 'u32' }, { ty: "Tokens<'_>", item: 'Token', hot: true }], note: 'A scanner’s token iterator fills it with Token. Each type gets its own row, and a type may have only one row: a second impl of Iterator for Countdown would be rejected.' },
  { code: `let mut c = Countdown(3);\nlet x = c.next();`, line: 1, title: 'impls of Iterator', rows: [{ ty: 'Countdown', item: 'u32', hot: true }, { ty: "Tokens<'_>", item: 'Token' }], out: { text: 'x : Option<u32>' }, note: 'To type c.next(), rustc needs <Countdown as Iterator>::Item. It finds the one row for Countdown, so x is an Option<u32>, with no annotation from you.' },
  { code: `trait Gen<T> {\n    fn next(&mut self) -> Option<T>;\n}\nimpl Gen<u32> for Countdown { ... }\nimpl Gen<String> for Countdown { ... }`, line: 4, title: 'impls of Gen<T>', rows: [{ ty: 'Countdown', item: 'T = u32', hot: true }, { ty: 'Countdown', item: 'T = String', hot: true }], note: 'With a generic parameter instead, nothing stops a type implementing the trait twice, once per T. Both impls are legal.' },
  { code: `let mut c = Countdown(3);\nlet x = c.next(); // which one?`, line: 1, title: 'impls of Gen<T>', rows: [{ ty: 'Countdown', item: 'T = u32', hot: true }, { ty: 'Countdown', item: 'T = String', hot: true }], out: { text: 'x : Option<?>  (annotate!)', bad: true }, note: 'Now c.next() matches two rows, so rustc cannot pick the type of x and you must say which you mean at every call. That is why Iterator, which a type does in one way, uses an associated type.' },
];

export default function ItemSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="One blank per type: how rustc finds Item" steps={s} note={st.note}>
      <CodeTrace code={st.code} line={st.line} />
      <Svg w={400} h={150} title="rustc's table of implementations, one row per type and trait">
        <T x={8} y={12} size={11} weight={700} fill={tok('muted')}>{st.title.toUpperCase()}</T>
        <T x={20} y={32} size={11} weight={700} fill={tok('muted')}>type</T>
        <T x={210} y={32} size={11} weight={700} fill={tok('muted')}>item type</T>
        {st.rows.length === 0 && <T x={20} y={60} size={12} fill={tok('muted')}>(no rows yet)</T>}
        {st.rows.map((r, i) => (
          <Box key={i} x={8} y={42 + i * 30} w={384} h={26} r={3}
            fill={r.hot ? tok('brand', 0.15) : tok('panel')} stroke={r.hot ? tok('brand') : tok('line')}>
            <T x={20} y={55 + i * 30} size={12} mono>{r.ty}</T>
            <T x={190} y={55 + i * 30} size={12} mono fill={tok('muted')}>→</T>
            <T x={210} y={55 + i * 30} size={12} mono weight={700}>{r.item}</T>
          </Box>
        ))}
        {st.out && (
          <T x={8} y={136} size={13} mono weight={700} fill={tok(st.out.bad ? 'danger' : 'safe')}>{st.out.text}</T>
        )}
      </Svg>
    </StepFrame>
  );
}
