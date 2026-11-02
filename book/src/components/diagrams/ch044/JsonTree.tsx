import { Box, Svg, T, tok } from '../../viz/svg';

// The six kinds of JSON value, each with its own colour.
const KIND = { object: 'f1', array: 'f2', string: 'f3', number: 'f4', boolean: 'f5', null: 'f6' } as const;
type Kind = keyof typeof KIND;

const KIDS: { key: string; text: string; kind: Kind }[] = [
  { key: 'name', text: '"drip"', kind: 'string' },
  { key: 'tags', text: '[ ]', kind: 'array' },
  { key: 'v', text: '2', kind: 'number' },
  { key: 'ok', text: 'true', kind: 'boolean' },
  { key: 'next', text: 'null', kind: 'null' },
];

function Node({ x, y, w, text, kind }: { x: number; y: number; w: number; text: string; kind: Kind }) {
  return (
    <Box x={x - w / 2} y={y} w={w} h={28} r={14} fill={tok(KIND[kind], 0.14)} stroke={tok(KIND[kind])}>
      <T x={x} y={y + 14.5} size={12} mono weight={700} anchor="middle">{text}</T>
    </Box>
  );
}

/** A JSON text and the tree of values it describes. */
export default function JsonTree() {
  return (
    <Svg w={400} h={268} title='The JSON text {"name": "drip", "tags": ["vm", "gc"], "v": 2, "ok": true, "next": null} drawn as a tree. The root is an object with five keys. name holds the string "drip"; tags holds an array, which holds the strings "vm" and "gc"; v holds the number 2; ok holds the boolean true; next holds null. A legend names the six kinds of value: object, array, string, number, boolean and null.'>
      <T x={200} y={10} size={11} mono anchor="middle" fill={tok('muted')}>{'{"name": "drip", "tags": ["vm", "gc"],'}</T>
      <T x={200} y={26} size={11} mono anchor="middle" fill={tok('muted')}>{' "v": 2, "ok": true, "next": null}'}</T>
      <Node x={200} y={40} w={56} text="{ }" kind="object" />
      {KIDS.map((k, j) => {
        const x = 40 + j * 80;
        return (
          <g key={k.key}>
            <line x1={200} y1={68} x2={x} y2={118} stroke={tok('line')} strokeWidth={1.5} />
            <T x={x + (200 - x) * 0.45} y={90} size={11} mono weight={700} anchor="middle" fill={tok('brand')}>{k.key}</T>
            <Node x={x} y={118} w={70} text={k.text} kind={k.kind} />
          </g>
        );
      })}
      {['"vm"', '"gc"'].map((s, j) => {
        const x = 120 + (j * 2 - 1) * 36;
        return (
          <g key={s}>
            <line x1={120} y1={146} x2={x} y2={182} stroke={tok('line')} strokeWidth={1.5} />
            <T x={x + (j ? 10 : -10)} y={164} size={11} mono fill={tok('muted')} anchor="middle">{j}</T>
            <Node x={x} y={182} w={56} text={s} kind="string" />
          </g>
        );
      })}
      {(Object.keys(KIND) as Kind[]).map((k, j) => (
        <g key={k}>
          <circle cx={14 + j * 66} cy={244} r={6} fill={tok(KIND[k], 0.3)} stroke={tok(KIND[k])} strokeWidth={1.5} />
          <T x={24 + j * 66} y={244} size={11}>{k}</T>
        </g>
      ))}
    </Svg>
  );
}
