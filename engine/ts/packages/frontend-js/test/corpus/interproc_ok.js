// viscosity: bodies=soa
const bodies = [];
for (let i = 0; i < 200; i++) bodies.push({ x: i, y: i * 2, m: 1 + (i % 3) });
function centerOfMass(bs) {
  let mx = 0;
  let m = 0;
  for (const b of bs) { mx += b.x * b.m; m += b.m; }
  return mx / m;
}
function drift(bs, dx) {
  for (let i = 0; i < bs.length; i++) bs[i].x += dx;
}
drift(bodies, 0.5);
drift(bodies, -0.25);
console.log(centerOfMass(bodies));
