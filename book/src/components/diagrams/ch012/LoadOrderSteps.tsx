import { StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

type Name = 'main' | 'parser' | 'scanner' | 'errors';
const POS: Record<Name, [number, number]> = {
  main: [150, 14], parser: [30, 84], scanner: [30, 154], errors: [270, 120],
};
const W = 100;
const H = 32;
const EDGES: [Name, Name][] = [['main', 'parser'], ['main', 'errors'], ['parser', 'scanner'], ['parser', 'errors'], ['scanner', 'errors']];

type S = { visiting: Name[]; done: Name[]; note: string };

const STATES: S[] = [
  { visiting: [], done: [], note: 'Each arrow means “imports”. main imports parser and errors; parser imports scanner and errors; scanner imports errors. Which file runs first?' },
  { visiting: ['main'], done: [], note: 'Start at the entry point, main. Before main can run, everything it imports must be ready. Its first import is parser.' },
  { visiting: ['main', 'parser'], done: [], note: 'parser can’t run yet either: its first import is scanner. We are going deeper, like a recursive call.' },
  { visiting: ['main', 'parser', 'scanner'], done: [], note: 'scanner imports errors. Deeper still.' },
  { visiting: ['main', 'parser', 'scanner'], done: ['errors'], note: 'errors imports nothing: this is the base case. It runs first.' },
  { visiting: ['main', 'parser'], done: ['errors', 'scanner'], note: 'Everything scanner needs is ready, so scanner runs second.' },
  { visiting: ['main', 'parser'], done: ['errors', 'scanner'], note: 'parser’s other import is errors. It has already run, and a module runs only once, so it is skipped.' },
  { visiting: ['main'], done: ['errors', 'scanner', 'parser'], note: 'parser runs third.' },
  { visiting: [], done: ['errors', 'scanner', 'parser', 'main'], note: 'main’s other import, errors, is done already. Finally main runs. Order: errors, scanner, parser, main. Every module ran after everything it imports, exactly once.' },
];

export default function LoadOrderSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const center = (n: Name, dy = 0): [number, number] => [POS[n][0] + W / 2, POS[n][1] + H / 2 + dy];
  return (
    <StepFrame title="Which module runs first?" steps={s} note={st.note}>
      <Svg w={400} h={230} title="Four modules and their imports. Each module runs after the modules it imports, each exactly once.">
        {EDGES.map(([a, b]) => {
          const [x1, y1] = center(a);
          const [x2, y2] = center(b);
          const sx = x1 + (x2 - x1) * 0.32;
          const sy = y1 + (y2 - y1) * 0.32;
          const ex = x1 + (x2 - x1) * 0.7;
          const ey = y1 + (y2 - y1) * 0.7;
          return <Arrow key={`${a}${b}`} x1={sx} y1={sy} x2={ex} y2={ey} color={tok('ink', 0.45)} />;
        })}
        {(Object.keys(POS) as Name[]).map((n) => {
          const [x, y] = POS[n];
          const k = st.done.indexOf(n);
          const vis = st.visiting.includes(n);
          const now = vis && st.visiting[st.visiting.length - 1] === n;
          return (
            <Box key={n} x={x} y={y} w={W} h={H} r={6}
              fill={k >= 0 ? tok('safe', 0.16) : now ? tok('brand', 0.16) : tok('panel')}
              stroke={k >= 0 ? tok('safe') : vis ? tok('brand') : tok('ink', 0.45)} dash={vis && !now}>
              <T x={x + 10} y={y + H / 2} size={12.5} mono weight={700}>{n}.js</T>
              {k >= 0 && <T x={x + W - 8} y={y + H / 2} size={12} mono weight={700} anchor="end" fill={tok('safe')}>#{k + 1}</T>}
            </Box>
          );
        })}
        <T x={8} y={206} size={11} weight={700} fill={tok('muted')}>RUN ORDER</T>
        <T x={8} y={222} size={13} mono>{st.done.length ? st.done.join(' → ') : '…'}</T>
        {st.visiting.length > 0 && <T x={392} y={206} size={11} anchor="end" fill={tok('muted')}>waiting: {st.visiting.join(', ')}</T>}
      </Svg>
    </StepFrame>
  );
}
