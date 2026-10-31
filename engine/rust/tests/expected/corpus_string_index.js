// viscosity: ps=aos
const ps = [];
for (let i = 0; i < 100; i++) ps.push({ x: i });
const k = '5';
for (let i = 0; i < ps.length; i++) ps[i].x += 1;
console.log(ps[k].x);
