// A small state-diagram drawer for the automata chapters: circles for
// states, a double ring for accepting states, labelled arrows for moves.
// Colours come from tok(), so both themes work.
import { T, tok } from '../../viz/svg';

export type St = { id: string; x: number; y: number; label?: string; accept?: boolean };
export type Ed = { from: string; to: string; label: string; bend?: number; loop?: 'up' | 'down'; dx?: number; dy?: number };

const R = 17;

export function Fsm({ states, edges, start, on = [], hot = [], dim = [] }: {
  states: St[]; edges: Ed[]; start?: string; on?: string[]; hot?: string[]; dim?: string[];
}) {
  const at = (id: string) => states.find((s) => s.id === id)!;
  return (
    <g>
      {edges.map((e, k) => <Edge key={k} e={e} a={at(e.from)} b={at(e.to)} hot={hot.includes(`${e.from}>${e.to}:${e.label}`)} />)}
      {start && (() => {
        const s = at(start);
        return <Line x1={s.x - R - 22} y1={s.y} x2={s.x - R - 1} y2={s.y} color={tok('ink', 0.7)} />;
      })()}
      {states.map((s) => {
        const lit = on.includes(s.id);
        const faded = dim.includes(s.id);
        const stroke = lit ? tok('brand') : tok('ink', faded ? 0.25 : 0.6);
        return (
          <g key={s.id} opacity={faded ? 0.45 : 1}>
            <circle cx={s.x} cy={s.y} r={R} fill={lit ? tok('brand', 0.18) : tok('panel')} stroke={stroke} strokeWidth={lit ? 2.5 : 1.5} />
            {s.accept && <circle cx={s.x} cy={s.y} r={R - 4} fill="none" stroke={stroke} strokeWidth={1.3} />}
            <T x={s.x} y={s.y + 1} size={12} mono anchor="middle" weight={lit ? 700 : 400}>{s.label ?? s.id}</T>
          </g>
        );
      })}
    </g>
  );
}

function Line({ x1, y1, x2, y2, color }: { x1: number; y1: number; x2: number; y2: number; color: string }) {
  const ang = Math.atan2(y2 - y1, x2 - x1);
  const ah = 7;
  return (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={1.6} />
      <polygon points={`${x2},${y2} ${x2 - ah * Math.cos(ang - 0.45)},${y2 - ah * Math.sin(ang - 0.45)} ${x2 - ah * Math.cos(ang + 0.45)},${y2 - ah * Math.sin(ang + 0.45)}`} fill={color} />
    </g>
  );
}

function Edge({ e, a, b, hot }: { e: Ed; a: St; b: St; hot: boolean }) {
  const color = hot ? tok('brand') : tok('ink', 0.55);
  const w = hot ? 2.6 : 1.5;
  const lx = (e.dx ?? 0);
  const ly = (e.dy ?? 0);
  if (e.loop) {
    const s = e.loop === 'up' ? -1 : 1;
    const y0 = a.y + s * (R - 3);
    const d = `M${a.x - 8},${y0} C${a.x - 22},${a.y + s * 46} ${a.x + 22},${a.y + s * 46} ${a.x + 8},${y0}`;
    const ty = a.y + s * 46;
    return (
      <g>
        <path d={d} fill="none" stroke={color} strokeWidth={w} />
        <polygon points={`${a.x + 8},${y0} ${a.x + 13},${y0 + s * 8} ${a.x + 4},${y0 + s * 7}`} fill={color} />
        <T x={a.x + lx} y={ty + s * 2 + ly} size={11} mono anchor="middle" fill={hot ? tok('brand') : tok('ink')} weight={hot ? 700 : 400}>{e.label}</T>
      </g>
    );
  }
  const bend = e.bend ?? 0;
  const ang0 = Math.atan2(b.y - a.y, b.x - a.x);
  const x1 = a.x + R * Math.cos(ang0 - bend * 0.5);
  const y1 = a.y + R * Math.sin(ang0 - bend * 0.5);
  const x2 = b.x - R * Math.cos(ang0 + bend * 0.5);
  const y2 = b.y - R * Math.sin(ang0 + bend * 0.5);
  const mx = (x1 + x2) / 2 + bend * (y2 - y1) * -0.5;
  const my = (y1 + y2) / 2 + bend * (x2 - x1) * 0.5;
  const ang = Math.atan2(y2 - my, x2 - mx);
  const ah = 7;
  const tx = (x1 + 2 * mx + x2) / 4;
  const ty = (y1 + 2 * my + y2) / 4;
  return (
    <g>
      <path d={`M${x1},${y1} Q${mx},${my} ${x2},${y2}`} fill="none" stroke={color} strokeWidth={w} />
      <polygon points={`${x2},${y2} ${x2 - ah * Math.cos(ang - 0.45)},${y2 - ah * Math.sin(ang - 0.45)} ${x2 - ah * Math.cos(ang + 0.45)},${y2 - ah * Math.sin(ang + 0.45)}`} fill={color} />
      <rect x={tx - 3 * Math.max(1, e.label.length) - 3 + lx} y={ty - 15 + ly} width={6 * Math.max(1, e.label.length) + 6} height={13} rx={3} fill={tok('paper', 0.85)} />
      <T x={tx + lx} y={ty - 8 + ly} size={11} mono anchor="middle" fill={hot ? tok('brand') : tok('ink')} weight={hot ? 700 : 400}>{e.label}</T>
    </g>
  );
}
