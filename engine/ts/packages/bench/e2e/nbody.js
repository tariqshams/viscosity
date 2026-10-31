// N-body: O(n^2) gravity on 1500 bodies (reads every field of others).
const N = 1500;
const bs = [];
for (let i = 0; i < N; i++) {
  bs.push({ x: Math.cos(i) * i, y: Math.sin(i) * i, vx: 0, vy: 0, m: 1 + (i % 3) });
}
function step(b, dt) {
  for (let i = 0; i < b.length; i++) {
    let ax = 0;
    let ay = 0;
    for (let j = 0; j < b.length; j++) {
      const dx = b[j].x - b[i].x;
      const dy = b[j].y - b[i].y;
      const d2 = dx * dx + dy * dy + 0.01;
      const f = b[j].m / (d2 * Math.sqrt(d2));
      ax += dx * f;
      ay += dy * f;
    }
    b[i].vx += ax * dt;
    b[i].vy += ay * dt;
  }
  for (let i = 0; i < b.length; i++) {
    b[i].x += b[i].vx * dt;
    b[i].y += b[i].vy * dt;
  }
}
const t0 = performance.now();
for (let s = 0; s < 6; s++) step(bs, 0.001);
const ms = performance.now() - t0;
let e = 0;
for (const b of bs) e += b.vx * b.vx + b.vy * b.vy;
console.log(JSON.stringify({ check: e.toPrecision(12), ms }));
