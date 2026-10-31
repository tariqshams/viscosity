// viscosity: ps=aos
const ps = [];
for (let i = 0; i < 100; i++) ps.push({ x: i });
const p = ps[3];
const f = () => p.x;
for (let i = 0; i < ps.length; i++) ps[i].x += 1;
console.log(f());
