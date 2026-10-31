const cs = [];
for (let i = 0; i < 128; i++) cs.push({ a: i, b: i % 3, c: 1, d: null });
for (let i = 0; i < cs.length; i++) {
  cs[i].a **= 2; cs[i].b |= 4; cs[i].c <<= 1; cs[i].a %= 1000;
  cs[i].d ??= i; cs[i].c &&= 3; cs[i].b ||= 9;
  const old = cs[i].a++;
  cs[i].b = old > 5 ? cs[i].b : -cs[i].b;
}
let s = 0;
for (const e of cs) s += e.a + e.b + e.c + e.d;
console.log(s, cs[7].a, cs[100].d);
