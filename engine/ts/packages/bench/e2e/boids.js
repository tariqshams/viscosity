// Boids-style flocking: each boid looks at a window of 64 neighbours.
const N = 20000;
const fl = [];
for (let i = 0; i < N; i++) {
  fl.push({ x: (i * 13) % 800, y: (i * 29) % 600, vx: Math.sin(i), vy: Math.cos(i), hue: i % 360 });
}
function flock(b) {
  for (let i = 0; i < b.length; i++) {
    let cx = 0;
    let cy = 0;
    for (let j = i + 1; j < i + 64 && j < b.length; j++) {
      cx += b[j].vx;
      cy += b[j].vy;
    }
    b[i].vx = b[i].vx * 0.9 + cx * 0.001;
    b[i].vy = b[i].vy * 0.9 + cy * 0.001;
  }
  for (let i = 0; i < b.length; i++) {
    b[i].x += b[i].vx;
    b[i].y += b[i].vy;
  }
}
const t0 = performance.now();
for (let s = 0; s < 30; s++) flock(fl);
const ms = performance.now() - t0;
let s = 0;
for (const b of fl) s += b.x + b.y;
console.log(JSON.stringify({ check: s.toFixed(4), ms }));
