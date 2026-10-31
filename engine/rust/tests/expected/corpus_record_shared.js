// viscosity: ps=aos
const ps = [];
const proto = { x: 1 };
for (let i = 0; i < 100; i++) {
  const r = { x: i };
  ps.push(r);
  if (i === 5) r.x = 500;
}
for (let i = 0; i < ps.length; i++) ps[i].x += 1;
console.log(ps[5].x, proto.x);
