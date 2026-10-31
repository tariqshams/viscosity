// viscosity: ps=soa
const ps = [];
let n = 0;
while (n < 5000) {
  ps.push({ a: n, b: n % 7 });
  n++;
}
let s = 0;
for (let i = 0; i < ps.length; i++) s += ps[i].a * ps[i].b;
console.log(s, ps.length);
