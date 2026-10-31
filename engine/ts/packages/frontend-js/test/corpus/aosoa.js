// viscosity: ps=aosoa
// @viscosity aosoa(8)
const ps = [];
for (let i = 0; i < 1003; i++) ps.push({ x: i, y: -i, z: i / 2 });
for (let r = 0; r < 2; r++) {
  for (let i = 0; i < ps.length; i++) {
    const p = ps[i];
    p.x += p.z;
    p.y -= 1;
  }
}
let s = 0;
for (const p of ps) s += p.x * 2 + p.y;
console.log(s, ps[1002].z, ps[7].x, ps[8].y);
