// viscosity: cs=soa
const cs = [];
for (let i = 0; i < 100; i++) cs.push({ n: i, m: 0 });
for (let i = 0; i < cs.length; i++) {
  cs[i].n++;
  ++cs[i].m;
  cs[i].m -= 2;
  cs[i].n **= 2;
  const old = cs[i].m--;
  if (old !== -1) throw new Error('bad postfix');
}
console.log(cs[5].n, cs[5].m, cs[99].n);
