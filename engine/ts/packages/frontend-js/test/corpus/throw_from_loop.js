// viscosity: ps=aos
// An element thrown from inside a loop escapes (via a phi).
const ps = [];
for (let i = 0; i < 100; i++) ps.push({ x: i });
const e = ps[0];
try {
  for (let i = 0; i < ps.length; i++) { ps[i].x += 1; if (i === 50) throw e; }
} catch (err) {
  console.log(typeof err, err.x);
}
