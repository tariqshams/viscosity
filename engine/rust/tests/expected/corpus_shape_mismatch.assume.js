// viscosity: ps=aos
const ps = [];
for (let i = 0; i < 100; i++) {
  if (i % 2) ps.push({ x: i, y: 1 });
  else ps.push({ y: 1, x: i });
}
let s = 0;
for (let i = 0; i < ps.length; i++) s += ps[i].x;
console.log(s);
