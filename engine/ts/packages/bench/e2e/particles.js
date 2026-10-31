// Particles: 200k particles with 8 fields; the hot loop touches 4.
const N = 200000;
const ps = [];
for (let i = 0; i < N; i++) {
  ps.push({ x: i % 1000, y: (i * 7) % 1000, vx: 1, vy: -1, mass: 1 + (i % 5), age: 0, r: 2, g: 3 });
}
function step(arr, dt) {
  for (let i = 0; i < arr.length; i++) {
    const p = arr[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
  }
}
const t0 = performance.now();
for (let f = 0; f < 200; f++) step(ps, 0.016);
const ms = performance.now() - t0;
let s = 0;
for (const p of ps) s += p.x + p.y;
console.log(JSON.stringify({ check: s.toFixed(3), ms }));
