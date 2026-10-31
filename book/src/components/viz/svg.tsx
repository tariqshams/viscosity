// Small SVG building blocks shared by the diagrams. All colours come from
// the CSS tokens, so light and dark mode both work and a field keeps the
// same colour everywhere.
import type { ReactNode } from 'react';

export const tok = (name: string, alpha = 1) => (alpha === 1 ? `rgb(var(--${name}))` : `rgb(var(--${name}) / ${alpha})`);

export function Box({ x, y, w, h, fill = tok('panel'), stroke = tok('line'), r = 5, dash, children, opacity = 1 }: {
  x: number; y: number; w: number; h: number; fill?: string; stroke?: string; r?: number; dash?: boolean; children?: ReactNode; opacity?: number;
}) {
  return (
    <g opacity={opacity}>
      <rect x={x} y={y} width={w} height={h} rx={r} fill={fill} stroke={stroke} strokeWidth={1.5} strokeDasharray={dash ? '5 4' : undefined} />
      {children}
    </g>
  );
}

export function T({ x, y, children, size = 14, mono, weight, anchor = 'start', fill, opacity }: {
  x: number; y: number; children: ReactNode; size?: number; mono?: boolean; weight?: number; anchor?: 'start' | 'middle' | 'end'; fill?: string; opacity?: number;
}) {
  return (
    <text x={x} y={y} fontSize={size} className={mono ? 'mono' : undefined} fontWeight={weight} textAnchor={anchor} dominantBaseline="middle" fill={fill} opacity={opacity}>
      {children}
    </text>
  );
}

/** An arrow from (x1,y1) to (x2,y2), optionally curved by `bend`. */
export function Arrow({ x1, y1, x2, y2, color = tok('ink', 0.7), bend = 0, width = 2, dash }: {
  x1: number; y1: number; x2: number; y2: number; color?: string; bend?: number; width?: number; dash?: boolean;
}) {
  const mx = (x1 + x2) / 2 + bend * (y2 - y1) * -0.3;
  const my = (y1 + y2) / 2 + bend * (x2 - x1) * 0.3;
  const ang = Math.atan2(y2 - my, x2 - mx);
  const ah = 8;
  const p1 = [x2 - ah * Math.cos(ang - 0.45), y2 - ah * Math.sin(ang - 0.45)];
  const p2 = [x2 - ah * Math.cos(ang + 0.45), y2 - ah * Math.sin(ang + 0.45)];
  return (
    <g>
      <path d={`M${x1},${y1} Q${mx},${my} ${x2},${y2}`} fill="none" stroke={color} strokeWidth={width} strokeDasharray={dash ? '5 4' : undefined} />
      <polygon points={`${x2},${y2} ${p1[0]},${p1[1]} ${p2[0]},${p2[1]}`} fill={color} />
    </g>
  );
}

export function Svg({ w, h, title, children }: { w: number; h: number; title: string; children: ReactNode }) {
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="viz" role="img" aria-label={title} style={{ maxWidth: w * 1.4 }}>
      <title>{title}</title>
      {children}
    </svg>
  );
}
