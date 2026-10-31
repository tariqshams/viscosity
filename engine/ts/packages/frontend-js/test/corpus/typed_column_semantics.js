// viscosity: ps=soa
const ps = [];
for (let i = 0; i < 100; i++) ps.push({ v: i % 2 ? Infinity : -Infinity });
for (let i = 0; i < ps.length; i++) ps[i].v = ps[i].v * 0;
console.log(Number.isNaN(ps[3].v), ps.length);
