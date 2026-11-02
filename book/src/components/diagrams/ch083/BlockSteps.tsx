import { StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

// Parsing { print 1 ; print x ; } by recursive descent: the tokens with a
// cursor, the stack of parsing calls, and the tree as it grows.
const TOKENS = ['{', 'print', '1', ';', 'print', 'x', ';', '}'];

type Fr = { fn: string; doing: string };
type Id = 'one' | 'p1' | 'x' | 'p2' | 'blk';
type S = { i: number; stack: Fr[]; nodes: Id[]; result?: string; note: string };

const st = (doing: string): Fr => ({ fn: 'statement', doing });
const bl = (doing: string): Fr => ({ fn: 'block', doing });
const pr = (doing: string): Fr => ({ fn: 'printStmt', doing });
const ex = (doing: string): Fr => ({ fn: 'expr', doing });

const STATES: S[] = [
  { i: 0, stack: [st('peek: {')], nodes: [], note: 'Parsing starts with the rule statement. It must choose between printStmt and block, so it peeks at the next token without taking it. It is {, so this is a block.' },
  { i: 1, stack: [st('it is a block'), bl('took {')], nodes: [], note: 'statement calls block. The first symbol of block’s rule is the terminal "{", so block takes that token. The cursor moves on.' },
  { i: 1, stack: [st('it is a block'), bl('peek: not }'), st('peek: print')], nodes: [], note: 'statement* is a loop: while the next token is not }, parse one more statement. The next token is print, so block calls statement, which peeks and sees print: a printStmt.' },
  { i: 2, stack: [st('it is a block'), bl('loop…'), st('printStmt'), pr('took print')], nodes: [], note: 'printStmt takes the keyword print. Four calls are now waiting, one inside another, each remembering where it was in its own rule.' },
  { i: 3, stack: [st('it is a block'), bl('loop…'), st('printStmt'), pr('expr…'), ex('took 1')], nodes: ['one'], note: 'The next symbol of printStmt is expr. expr takes the number 1 and returns a literal node: the first leaf of the tree.' },
  { i: 4, stack: [st('it is a block'), bl('loop…'), st('printStmt'), pr('took ;')], nodes: ['one', 'p1'], note: 'Back in printStmt, the last symbol is ";", so it takes the semicolon and builds a print node holding the literal. Then printStmt and statement return.' },
  { i: 5, stack: [st('it is a block'), bl('body: 1 stmt'), st('printStmt'), pr('took print')], nodes: ['one', 'p1'], note: 'block pushes that node onto its body, and its loop goes round: the next token is print, not }, so statement and printStmt run again.' },
  { i: 6, stack: [st('it is a block'), bl('loop…'), st('printStmt'), pr('expr…'), ex('took x')], nodes: ['one', 'p1', 'x'], note: 'This time expr finds a name, x, and returns a variable node.' },
  { i: 7, stack: [st('it is a block'), bl('loop…'), st('printStmt'), pr('took ;')], nodes: ['one', 'p1', 'x', 'p2'], note: 'printStmt takes the ; and builds the second print node.' },
  { i: 7, stack: [st('it is a block'), bl('peek: }, stop')], nodes: ['one', 'p1', 'x', 'p2'], note: 'Back in block with two statements in its body. The next token is }, so the loop stops: zero or more statements, and here there were two.' },
  { i: 8, stack: [st('it is a block'), bl('took }')], nodes: ['one', 'p1', 'x', 'p2', 'blk'], note: 'block takes the closing } and builds a block node whose body is the two print nodes.' },
  { i: 8, stack: [], nodes: ['one', 'p1', 'x', 'p2', 'blk'], result: '(block (print 1) (print x))', note: 'Every call has returned and every token is used. The tree grew from the leaves up, and its shape is the shape of the calls: block called statement twice, so the block node has two children.' },
];

const POS: Record<Id, { x: number; y: number; label: string }> = {
  blk: { x: 304, y: 96, label: 'block' },
  p1: { x: 258, y: 152, label: 'print' },
  p2: { x: 350, y: 152, label: 'print' },
  one: { x: 258, y: 208, label: 'literal 1' },
  x: { x: 350, y: 208, label: 'var x' },
};
const EDGES: [Id, Id][] = [['blk', 'p1'], ['blk', 'p2'], ['p1', 'one'], ['p2', 'x']];

const FH = 26;
const NW = 82;
const NH = 26;

export default function BlockSteps() {
  const s = useSteps(STATES);
  const S0 = s.state;
  const has = (n: Id) => S0.nodes.includes(n);
  return (
    <StepFrame title="Parsing a block by recursive descent" steps={s} note={S0.note}>
      <Svg w={400} h={252} title="The tokens of { print 1 ; print x ; } with a cursor, the stack of parsing calls, and the syntax tree built so far">
        {TOKENS.map((t, k) => {
          const x = 4 + k * 44;
          const used = k < S0.i;
          return (
            <Box key={k} x={x} y={4} w={40} h={26} fill={used ? tok('ink', 0.06) : tok('panel')} stroke={k === S0.i ? tok('brand') : tok('ink', used ? 0.2 : 0.45)}>
              <T x={x + 20} y={17.5} size={t.length > 1 ? 11.5 : 14} mono anchor="middle" opacity={used ? 0.45 : 1}>{t}</T>
            </Box>
          );
        })}
        <Box x={4 + 8 * 44} y={4} w={40} h={26} dash fill="transparent" stroke={S0.i === 8 ? tok('brand') : tok('line')}>
          <T x={4 + 8 * 44 + 20} y={17.5} size={11} mono anchor="middle" fill={tok('muted')}>end</T>
        </Box>
        <T x={4 + S0.i * 44 + 20} y={40} size={11} mono anchor="middle" fill={tok('brand')} weight={700}>↑ next</T>

        <T x={6} y={58} size={11} weight={700} fill={tok('muted')}>CALLS (newest on top)</T>
        {S0.stack.length === 0 && <T x={6} y={226} size={12} fill={tok('muted')}>none: parsing finished</T>}
        {S0.stack.map((f, k) => {
          const y = 214 - k * (FH + 4);
          const top = k === S0.stack.length - 1;
          return (
            <Box key={k} x={4} y={y} w={202} h={FH} fill={top ? tok('brand', 0.14) : tok('panel')} stroke={top ? tok('brand') : tok('ink', 0.4)}>
              <T x={11} y={y + FH / 2} size={12} mono weight={700}>{f.fn}</T>
              <T x={96} y={y + FH / 2} size={11} mono fill={top ? tok('ink') : tok('muted')}>{f.doing}</T>
            </Box>
          );
        })}

        <T x={216} y={58} size={11} weight={700} fill={tok('muted')}>THE TREE SO FAR</T>
        {EDGES.map(([a, b]) => has(a) && has(b) && (
          <line key={a + b} x1={POS[a].x} y1={POS[a].y + NH / 2} x2={POS[b].x} y2={POS[b].y - NH / 2} stroke={tok('ink', 0.45)} strokeWidth={1.4} />
        ))}
        {(Object.keys(POS) as Id[]).map((id) => {
          if (!has(id)) return null;
          const p = POS[id];
          const stmt = id !== 'one' && id !== 'x';
          return (
            <Box key={id} x={p.x - NW / 2} y={p.y - NH / 2} w={NW} h={NH} r={stmt ? 4 : 13} fill={stmt ? tok('warn', 0.14) : tok('brand', 0.12)} stroke={stmt ? tok('warn') : tok('brand')}>
              <T x={p.x} y={p.y + 1} size={12} mono anchor="middle">{p.label}</T>
            </Box>
          );
        })}
        {S0.result && <T x={304} y={244} size={11.5} mono anchor="middle" fill={tok('safe')} weight={700}>{S0.result}</T>}
      </Svg>
    </StepFrame>
  );
}
