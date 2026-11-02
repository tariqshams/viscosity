import { CodeTrace, StepFrame, useSteps } from '../../viz/stepper';
import { Box, Svg, T, tok } from '../../viz/svg';

// One object falling into dictionary mode, following real runs in Node
// v22.23.4 (V8 12.4): %HasFastProperties(p) stays true after
// `p.z = undefined` and becomes false after `delete p.z`; %DebugPrint then
// shows [DictionaryProperties], a NameDictionary and `dictionary_map`.
const CODE = `const p = { x: 1, y: 2, z: 3 };
p.z = undefined;
delete p.z;
p.x;`;

type S = { line: number | null; mode: 'fast' | 'dict'; z: string; hasZ: boolean; read?: boolean; note: string };

const STATES: S[] = [
  { line: 0, mode: 'fast', z: '3', hasZ: true, note: 'A literal with three properties: one shared map says x is field 0, y field 1, z field 2. The object holds just the three values.' },
  { line: 1, mode: 'fast', z: 'undefined', hasZ: true, note: 'Setting z to undefined only changes a value. The keys and their order are the same, so the map is the same: %HasFastProperties(p) is still true.' },
  { line: 2, mode: 'dict', z: '', hasZ: false, note: 'delete removes the key itself. In V8 12.4 that sends p into dictionary mode: its properties move into a hash table of its own, names and values together, and its map becomes a dictionary map.' },
  { line: 3, mode: 'dict', z: '', hasZ: false, read: true, note: 'Reading p.x now means hashing the name "x" and searching p’s own table, much as a Drip instance does, instead of loading field 0 at a fixed place.' },
];

export default function DictSteps() {
  const s = useSteps(STATES);
  const st = s.state;
  const fast = st.mode === 'fast';
  return (
    <StepFrame title="From a shared shape to a dictionary" steps={s} note={st.note}>
      <CodeTrace code={CODE} line={st.line} />
      <Svg w={400} h={140} title="On the left, the object p; on the right, either its shared map with three fields, or, after delete, its own hash table of names and values.">
        <T x={8} y={14} size={11} weight={700} fill={tok('muted')}>p</T>
        {fast ? (
          <>
            {[['map', ''], ['1', 'f1'], ['2', 'f2'], [st.z, 'f3']].map(([v, f], k) => (
              <Box key={k} x={8} y={24 + k * 28} w={92} h={24} r={3} fill={f ? tok(f, 0.18) : tok('panel')} stroke={f ? tok(f) : tok('line')}>
                <T x={54} y={36 + k * 28} size={12} mono anchor="middle">{v}</T>
              </Box>
            ))}
            <Box x={170} y={24} w={222} h={100} fill={tok('brand', 0.08)} stroke={tok('brand')}>
              <T x={182} y={42} size={12} weight={700} fill={tok('brand')}>shared map (fast)</T>
              <T x={182} y={64} size={12} mono>x → field 0</T>
              <T x={182} y={84} size={12} mono>y → field 1</T>
              <T x={182} y={104} size={12} mono>z → field 2</T>
            </Box>
          </>
        ) : (
          <>
            <Box x={8} y={24} w={92} h={24} r={3} fill={tok('panel')}>
              <T x={54} y={36} size={12} mono anchor="middle">map</T>
            </Box>
            <Box x={8} y={52} w={92} h={24} r={3} fill={tok('warn', 0.15)} stroke={tok('warn')}>
              <T x={54} y={64} size={11} anchor="middle">properties →</T>
            </Box>
            <Box x={170} y={24} w={222} h={100} fill={tok('warn', 0.08)} stroke={tok('warn')}>
              <T x={182} y={42} size={12} weight={700} fill={tok('warn')}>p’s own hash table</T>
              <T x={182} y={64} size={12} mono fill={st.read ? tok('brand') : tok('ink')}>"x": 1{st.read ? '  ← hash, search' : ''}</T>
              <T x={182} y={84} size={12} mono>"y": 2</T>
              <T x={182} y={104} size={12} mono fill={tok('muted')}>(z is gone)</T>
            </Box>
          </>
        )}
      </Svg>
    </StepFrame>
  );
}
