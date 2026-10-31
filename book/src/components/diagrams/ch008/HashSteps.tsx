import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const CODE = `// toy hash: (number of letters) % 4
m.set('red', 2);
m.set('blue', 1);
m.set('green', 5);
m.set('pink', 7);
m.get('green');
m.get('pink');
m.get('gold');`;

type Entry = [string, number];
type S = {
  line: number;
  buckets: Entry[][];
  key?: string;
  hash?: string;
  at?: number;
  checked?: string[];
  found?: string;
  note: string;
};

const B0: Entry[][] = [[], [], [], []];
const B1: Entry[][] = [[], [], [], [['red', 2]]];
const B2: Entry[][] = [[['blue', 1]], [], [], [['red', 2]]];
const B3: Entry[][] = [[['blue', 1]], [['green', 5]], [], [['red', 2]]];
const B4: Entry[][] = [[['blue', 1], ['pink', 7]], [['green', 5]], [], [['red', 2]]];

const STATES: S[] = [
  { line: 0, buckets: B0, note: 'A hash table is an array of buckets: here, 4 of them. To keep this readable, our toy hash function just counts the key’s letters, then takes % 4 to land on a bucket number.' },
  { line: 1, buckets: B1, key: 'red', hash: "'red' has 3 letters, 3 % 4 = 3", at: 3, note: 'set(\'red\', 2): the hash says bucket 3, so the entry goes straight there. No searching.' },
  { line: 2, buckets: B2, key: 'blue', hash: "'blue' has 4 letters, 4 % 4 = 0", at: 0, note: '\'blue\' hashes to bucket 0.' },
  { line: 3, buckets: B3, key: 'green', hash: "'green' has 5 letters, 5 % 4 = 1", at: 1, note: '\'green\' hashes to bucket 1.' },
  { line: 4, buckets: B4, key: 'pink', hash: "'pink' has 4 letters, 4 % 4 = 0", at: 0, note: '\'pink\' ALSO hashes to bucket 0. Two keys in one bucket is a collision. Both entries simply share the bucket.' },
  { line: 5, buckets: B4, key: 'green', hash: "'green' → bucket 1", at: 1, checked: ['green'], found: '5', note: 'get(\'green\'): hash first, then look only in bucket 1. One comparison finds it: 5.' },
  { line: 6, buckets: B4, key: 'pink', hash: "'pink' → bucket 0", at: 0, checked: ['blue', 'pink'], found: '7', note: 'get(\'pink\'): bucket 0 holds two entries, so it checks \'blue\' (no), then \'pink\' (yes): 7.' },
  { line: 7, buckets: B4, key: 'gold', hash: "'gold' → bucket 0", at: 0, checked: ['blue', 'pink'], found: 'undefined', note: 'get(\'gold\'): bucket 0 has no \'gold\', so the answer is undefined. It never looked at red or green. A real hash function mixes every character, so keys spread out evenly and buckets stay short.' },
];

export default function HashSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  return (
    <StepFrame title="Finding a key without searching" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={200} title="Four buckets numbered 0 to 3, each holding the entries whose key hashed to it">
        {st.key ? (
          <>
            <T x={8} y={14} size={13} mono weight={700}>{`'${st.key}'`}</T>
            <T x={8} y={34} size={12} mono fill={tok('muted')}>{st.hash}</T>
          </>
        ) : (
          <T x={8} y={14} size={12} fill={tok('muted')}>An empty table: 4 buckets.</T>
        )}
        {st.found && <T x={392} y={14} size={13} mono weight={700} anchor="end" fill={st.found === 'undefined' ? tok('danger') : tok('safe')}>→ {st.found}</T>}
        {st.buckets.map((b, i) => {
          const y = 50 + i * 37;
          const hot = st.at === i;
          return (
            <g key={i}>
              <Box x={8} y={y} w={44} h={31} fill={hot ? tok('brand', 0.2) : tok('panel')} stroke={hot ? tok('brand') : tok('ink', 0.45)}>
                <T x={30} y={y + 16} size={14} mono weight={700} anchor="middle">{i}</T>
              </Box>
              {b.length === 0 && <T x={64} y={y + 16} size={12} fill={tok('muted')}>empty</T>}
              {b.map(([k, v], j) => {
                const seen = hot && st.checked?.includes(k);
                const match = seen && k === st.key;
                return (
                  <g key={k}>
                    {j > 0 && <Arrow x1={60 + j * 150 - 14} y1={y + 16} x2={60 + j * 150 - 2} y2={y + 16} />}
                    <Box x={60 + j * 150} y={y} w={130} h={31} fill={match ? tok('safe', 0.15) : seen ? tok('danger', 0.08) : tok('accent', 0.08)} stroke={match ? tok('safe') : seen ? tok('danger') : tok('accent')}>
                      <T x={70 + j * 150} y={y + 16} size={13} mono>{`'${k}' → ${v}`}</T>
                    </Box>
                  </g>
                );
              })}
            </g>
          );
        })}
      </Svg>
    </StepFrame>
  );
}
