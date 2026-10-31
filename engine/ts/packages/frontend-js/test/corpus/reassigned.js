// viscosity: ps=aos
let ps = [];
for (let i = 0; i < 100; i++) ps.push({ x: i });
for (let i = 0; i < ps.length; i++) ps[i].x += 1;
ps = [];
console.log(ps.length);
