// viscosity: ps=aos
const ps = [];
for (let i = 0; i < 100; i++) ps.push({ x: i, y: i });
for (let i = 0; i < ps.length; i++) ps[i].x += 1;
console.log(ps[3]);
