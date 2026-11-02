import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const CODE = `const n = new Num(3, 42);
n.value       // 42
n.show()      // '42'
n.where()     // 'line 3'
n.toString()  // '[object Object]'
n.colour      // undefined`;

const LINKS = [
  { name: 'n (own properties)', keys: 'line: 3, value: 42' },
  { name: 'Num.prototype', keys: 'constructor, show' },
  { name: 'Node.prototype', keys: 'constructor, where, show' },
  { name: 'Object.prototype', keys: 'toString, hasOwnProperty, …' },
];

type S = { line: number | null; key?: string; upTo: number; hit: number | null; note: string };

const STATES: S[] = [
  { line: 0, upTo: -1, hit: null, note: 'The chain for n: the object itself, then Num’s shared methods, then Node’s, then Object’s, then null, the end. Each link points to the next, its prototype.' },
  { line: 1, key: 'value', upTo: 0, hit: 0, note: 'n.value: JavaScript looks at n’s own properties first, finds value there, and stops. Most reads end on the first link.' },
  { line: 2, key: 'show', upTo: 0, hit: null, note: 'n.show: n has no own property called show, so the search follows n’s link up to its prototype.' },
  { line: 2, key: 'show', upTo: 1, hit: 1, note: 'Num.prototype has show, so the search stops here. Node.prototype also has a show, but it is never reached: that is what overriding is.' },
  { line: 3, key: 'where', upTo: 2, hit: 2, note: 'n.where: not on n, not on Num.prototype, found on Node.prototype, two links up. That is how a Num inherits where.' },
  { line: 4, key: 'toString', upTo: 3, hit: 3, note: 'n.toString: nobody in our code wrote it. It is on Object.prototype, the last link of every ordinary chain, so every object has it.' },
  { line: 5, key: 'colour', upTo: 4, hit: null, note: 'n.colour: no link has it, and after Object.prototype comes null, the end of the chain. The search gives up and the answer is undefined.' },
];

export default function LookupSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="A property lookup walks up the chain" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={262} title="The prototype chain of n, top to bottom: n's own properties, Num.prototype, Node.prototype, Object.prototype, then null; the current lookup is highlighted where it is found">
        {LINKS.map((l, k) => {
          const y = 6 + k * 54;
          const hit = st.hit === k;
          const missed = k <= st.upTo && !hit;
          return (
            <g key={l.name}>
              <Box x={4} y={y} w={300} h={42} r={6}
                fill={hit ? tok('brand', 0.14) : missed ? tok('ink', 0.05) : tok('panel')}
                stroke={hit ? tok('brand') : tok('ink', missed ? 0.3 : 0.5)}>
                <T x={14} y={y + 14} size={12} mono weight={700}>{l.name}</T>
                <T x={14} y={y + 31} size={11.5} mono fill={tok('muted')}>{l.keys}</T>
              </Box>
              {k < LINKS.length && <Arrow x1={40} y1={y + 42} x2={40} y2={y + 54} width={1.5} color={tok('ink', 0.45)} />}
              {(hit || missed) && (
                <>
                  <T x={314} y={y + 14} size={12} weight={700} fill={hit ? tok('brand') : tok('muted')}>{hit ? 'found' : 'not here'}</T>
                  <T x={314} y={y + 31} size={11.5} mono fill={hit ? tok('brand') : tok('muted')}>{st.key}</T>
                </>
              )}
            </g>
          );
        })}
        <Box x={4} y={222} w={80} h={30} r={6} dash stroke={st.upTo === 4 ? tok('brand') : tok('line')} fill="transparent">
          <T x={44} y={237.5} size={13} mono weight={700} anchor="middle">null</T>
        </Box>
        {st.upTo === 4 && <T x={96} y={237.5} size={12} weight={700} fill={tok('brand')}>end of the chain: undefined</T>}
      </Svg>
    </StepFrame>
  );
}
