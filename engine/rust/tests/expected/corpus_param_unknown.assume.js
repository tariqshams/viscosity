// viscosity: ps=aos
const ps = [];
for (let i = 0; i < 100; i++) ps.push({ x: i });
export function nudge(dx) {
  for (let i = 0; i < ps.length; i++) ps[i].x += dx;
}
nudge(1);
console.log(ps[1].x);
