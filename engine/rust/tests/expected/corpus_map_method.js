// viscosity: ps=aos
const ps = [];
for (let i = 0; i < 100; i++) ps.push({ x: i });
for (let i = 0; i < ps.length; i++) ps[i].x *= 3;
console.log(ps.map((p) => p.x).slice(0, 3));
