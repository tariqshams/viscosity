import { Box, Svg, T, tok } from '../../viz/svg';

// Chapter 283: where the count lives. CPython 3.13 (default build) starts
// every object with ob_refcnt and ob_type (Include/object.h; an empty
// object() is 16 bytes on a 64-bit machine). Rust's Rc<T> points at an
// RcInner { strong, weak, value } (library/alloc/src/rc.rs, 1.97.0).
function Row({ y, label, cells }: { y: number; label: string; cells: [string, number, string][] }) {
  let x = 6;
  return (
    <g>
      <T x={6} y={y} size={11} weight={700} fill={tok('muted')}>{label}</T>
      {cells.map(([t, w, c]) => {
        const bx = x;
        x += w + 2;
        return (
          <Box key={t} x={bx} y={y + 10} w={w} h={34} fill={tok(c, 0.15)} stroke={tok(c)}>
            <T x={bx + w / 2} y={y + 27} size={12} mono anchor="middle">{t}</T>
          </Box>
        );
      })}
    </g>
  );
}

export default function HeaderFigure() {
  return (
    <Svg w={400} h={168} title="A CPython object begins with its reference count and its type; a Rust Rc allocation holds a strong count, a weak count and the value">
      <Row y={12} label="CPYTHON 3.13: EVERY OBJECT" cells={[['ob_refcnt', 110, 'f6'], ['ob_type', 100, 'f1'], ['fields …', 170, 'line']]} />
      <Row y={80} label="RUST: WHAT AN Rc<T> POINTS AT" cells={[['strong', 90, 'f6'], ['weak', 90, 'f2'], ['value: T', 200, 'line']]} />
      <T x={200} y={156} size={11} anchor="middle" fill={tok('muted')}>The count sits next to the data it counts.</T>
    </Svg>
  );
}
