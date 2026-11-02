// Chapter 323: a semispace heap before and after one copying collection.
// Only the reachable objects are copied, packed together at the start of
// to-space; the whole of from-space is then free in one piece. A picture,
// not a measurement.
import type { ReactNode } from 'react';
import { Arrow, Box, Svg, T, tok } from '../../viz/svg';

const OBJS = [
  { x: 0, w: 40, live: true, n: 'A' }, { x: 40, w: 30, live: false, n: '' }, { x: 70, w: 26, live: false, n: '' },
  { x: 96, w: 34, live: true, n: 'B' }, { x: 130, w: 30, live: false, n: '' }, { x: 160, w: 24, live: true, n: 'C' },
];

function Space({ x, y, label, children, empty }: { x: number; y: number; label: string; children?: ReactNode; empty?: boolean }) {
  return (
    <g>
      <T x={x} y={y - 10} size={11} weight={700} fill={tok('muted')}>{label}</T>
      <Box x={x} y={y} w={184} h={34} r={3} fill={empty ? 'transparent' : tok('panel')} stroke={tok('ink', 0.5)} dash={empty} />
      {children}
    </g>
  );
}

export default function Semispaces() {
  const live = OBJS.filter((o) => o.live);
  let at = 0;
  const packed = live.map((o) => { const p = { ...o, x: at }; at += o.w; return p; });
  return (
    <Svg w={400} h={236} title="Before: from-space holds three live and three dead objects, and to-space is empty. After: the three live objects are packed at the start of to-space, and from-space is entirely free.">
      <T x={8} y={14} size={12} weight={700}>before</T>
      <Space x={8} y={38} label="from-space (full)">
        {OBJS.map((o, k) => (
          <Box key={k} x={10 + o.x} y={41} w={o.w - 3} h={28} r={2}
            fill={o.live ? tok('safe', 0.35) : 'transparent'} stroke={o.live ? tok('safe') : tok('danger', 0.7)} dash={!o.live}>
            {o.live && <T x={10 + o.x + (o.w - 3) / 2} y={55} size={12} weight={700} anchor="middle">{o.n}</T>}
          </Box>
        ))}
      </Space>
      <Space x={208} y={38} label="to-space (empty)" empty />
      <Arrow x1={110} y1={86} x2={250} y2={136} color={tok('brand')} />
      <T x={196} y={100} size={11} fill={tok('brand')}>copy only A, B, C</T>
      <T x={8} y={130} size={12} weight={700}>after</T>
      <Space x={8} y={154} label="old from-space: all free" empty />
      <Space x={208} y={154} label="to-space: the new heap">
        {packed.map((o, k) => (
          <Box key={k} x={210 + o.x} y={157} w={o.w - 3} h={28} r={2} fill={tok('safe', 0.35)} stroke={tok('safe')}>
            <T x={210 + o.x + (o.w - 3) / 2} y={171} size={12} weight={700} anchor="middle">{o.n}</T>
          </Box>
        ))}
        <line x1={210 + at} x2={210 + at} y1={152} y2={198} stroke={tok('brand')} strokeWidth={2} />
        <T x={392} y={206} size={11} anchor="end" fill={tok('brand')}>next free address</T>
      </Space>
      <T x={8} y={228} size={12}>The dead objects were never visited.</T>
    </Svg>
  );
}
