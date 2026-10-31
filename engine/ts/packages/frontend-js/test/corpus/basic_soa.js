// viscosity: ps=soa
const ps = [];
for (let i = 0; i < 1000; i++) ps.push({ x: i, y: 0, vx: 1, vy: 2 });
for (let t = 0; t < 3; t++) {
  for (let i = 0; i < ps.length; i++) {
    ps[i].x += ps[i].vx * 0.5;
    ps[i].y = ps[i].y + ps[i].vy;
  }
}
let s = 0;
for (let i = 0; i < ps.length; i++) s += ps[i].x + ps[i].y;
console.log(s, ps.length, ps[10].x, ps[999].y);
