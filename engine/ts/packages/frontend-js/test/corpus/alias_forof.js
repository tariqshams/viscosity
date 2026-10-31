// viscosity: ps=soa
const ps = [];
for (let i = 0; i < 500; i++) ps.push({ x: i * 0.25, v: -1 });
function step(arr, dt) {
  for (let i = 0; i < arr.length; i++) {
    const p = arr[i];
    p.x = p.x + p.v * dt;
    p.v *= 0.99;
  }
}
for (let k = 0; k < 10; k++) step(ps, 0.016);
let total = 0;
for (const p of ps) total += p.x;
console.log(total.toFixed(9), ps[0].v);
