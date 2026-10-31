// viscosity: ps=soa
const ps = [];
for (let i = 0; i < 100; i++) ps.push({ x: i });
let s = 0;
try {
  for (let i = 0; i < ps.length; i++) s += ps[i].x;
  ps[1000].x = 1;
} catch (e) {
  console.log('caught', e.constructor.name, e.message);
}
console.log(s);
