// viscosity: ps=soa
const ps = [];
for (let i = 0; i < 100; i++) ps.push({ a: i });
for (let i = 0; i < ps.length; i++) ps[i].a *= 2;
ps[-1].a = 3;
