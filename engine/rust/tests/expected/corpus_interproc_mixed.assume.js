// viscosity: a=aos, b=aos
const a = [];
const b = [];
for (let i = 0; i < 100; i++) { a.push({ x: i }); b.push({ x: -i }); }
function total(xs) {
  let s = 0;
  for (let i = 0; i < xs.length; i++) s += xs[i].x;
  return s;
}
console.log(total(a), total(b));
