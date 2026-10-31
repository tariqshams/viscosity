// viscosity: ps=soa
// Out of bounds, `ps[i].x = rhs` evaluates rhs before it fails: a read in rhs
// throws its own error first, and rhs's effects happen.
const ps = [];
for (let i = 0; i < 100; i++) ps.push({ x: i, y: i * 2 });
for (let i = 0; i < ps.length; i++) ps[i].x += ps[i].y;
try {
  for (let i = 0; i <= ps.length; i++) ps[i].x = ps[i].y;
} catch (e) {
  console.log('caught', e.message);
}
let t = 0;
try {
  ps[100].x = (t = 5);
} catch (e) {
  console.log('caught', e.message, t);
}
console.log(ps[3].x, ps[99].x);
