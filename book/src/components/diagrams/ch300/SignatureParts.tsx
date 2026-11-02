// Chapter 300: the parts of a Rust function signature, labelled, with the
// TypeScript signature that says the same thing underneath.
import { Svg, T, tok } from '../../viz/svg';

const PARTS: { x: number; w: number; text: string; label: string; col: string; up?: boolean }[] = [
  { x: 14, w: 18, text: 'fn', label: 'keyword', col: 'accent', up: true },
  { x: 40, w: 36, text: 'area', label: 'name', col: 'ink' },
  { x: 84, w: 54, text: 'w: i32', label: 'parameter: type', col: 'f1', up: true },
  { x: 150, w: 54, text: 'h: i32', label: '(required)', col: 'f2' },
  { x: 218, w: 50, text: '-> i32', label: 'return type', col: 'brand', up: true },
];

export default function SignatureParts() {
  return (
    <Svg w={400} h={176} title="A Rust function signature, part by part, with the TypeScript one below">
      <rect x={6} y={58} width={388} height={34} rx={5} fill={tok('panel')} stroke={tok('line')} />
      <T x={14} y={75} size={14} mono>
        <tspan fill={tok('accent')} fontWeight={700}>fn</tspan> area(<tspan fill={tok('f1')}>w: i32</tspan>, <tspan fill={tok('f2')}>h: i32</tspan>) <tspan fill={tok('brand')}>-&gt; i32</tspan> {'{'}
      </T>
      {PARTS.map((p) => (
        <g key={p.text}>
          <line x1={p.x + p.w / 2} y1={p.up ? 56 : 94} x2={p.x + p.w / 2} y2={p.up ? 40 : 110} stroke={tok('ink', 0.4)} strokeWidth={1} />
          <T x={Math.max(p.x + p.w / 2, 32)} y={p.up ? 30 : 120} size={11} anchor="middle" fill={tok(p.col)} weight={700}>{p.label}</T>
        </g>
      ))}
      <T x={14} y={146} size={11} weight={700} fill={tok('muted')}>THE SAME IN TYPESCRIPT</T>
      <T x={14} y={164} size={12} mono fill={tok('muted')}>function area(w: number, h: number): number</T>
    </Svg>
  );
}
