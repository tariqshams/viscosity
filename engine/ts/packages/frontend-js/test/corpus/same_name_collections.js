// viscosity: ps=soa
function a() {
  const ps = [];
  for (let i = 0; i < 100; i++)
    ps.push({ x: i });
  let s = 0;
  for (let i = 0; i < ps.length; i++)
    s += ps[i].x;
  return s;
}
function b() {
  const ps = [];
  for (let i = 0; i < 100; i++)
    ps.push({ y: i, z: 1 });
  let s = 0;
  for (let i = 0; i < ps.length; i++)
    s += ps[i].y + ps[i].z;
  return s;
}
console.log(a(), b());
