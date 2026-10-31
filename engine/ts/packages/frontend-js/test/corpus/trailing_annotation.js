// viscosity: qs=aos, rs=soa
const qs = []; // @viscosity aos
const rs = [];
for (let i = 0; i < 100; i++) { qs.push({ x: i }); rs.push({ x: i }); }
let s = 0;
for (let i = 0; i < qs.length; i++) s += qs[i].x + rs[i].x;
console.log(s);
