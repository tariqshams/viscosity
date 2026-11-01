// AoSoA block sizes: whole powers of two up to 2^16 are used; anything
// else (not a whole number, not a power of two, or too large) is refused.
// @viscosity aosoa(16)
const a = [];
// @viscosity aosoa(65536)
const b = [];
// @viscosity aosoa(131072)
const c = [];
// @viscosity aosoa(1073741824)
const d = [];
// @viscosity aosoa(4294967296)
const e = [];
// @viscosity aosoa(18446744073709551616)
const f = [];
// @viscosity aosoa(99999999999999999999999)
const g = [];
// @viscosity aosoa(x)
const h = [];
// @viscosity aosoa()
const i2 = [];
// @viscosity aosoa(-4)
const j = [];
// @viscosity aosoa(012)
const k = [];
// @viscosity aosoa(0)
const l = [];
// @viscosity aosoa(8 rows)
const m = [];
for (let i = 0; i < 100; i++) {
  a.push({ x: i, y: 2 * i });
  b.push({ x: i, y: 2 * i });
  c.push({ x: i, y: 2 * i });
  d.push({ x: i, y: 2 * i });
  e.push({ x: i, y: 2 * i });
  f.push({ x: i, y: 2 * i });
  g.push({ x: i, y: 2 * i });
  h.push({ x: i, y: 2 * i });
  i2.push({ x: i, y: 2 * i });
  j.push({ x: i, y: 2 * i });
  k.push({ x: i, y: 2 * i });
  l.push({ x: i, y: 2 * i });
  m.push({ x: i, y: 2 * i });
}
let s = 0;
for (let i = 0; i < 100; i++) {
  s += a[i].x + b[i].x + c[i].x + d[i].x + e[i].x + f[i].x + g[i].x;
  s += h[i].y + i2[i].y + j[i].y + k[i].y + l[i].y + m[i].y;
}
console.log(s);
