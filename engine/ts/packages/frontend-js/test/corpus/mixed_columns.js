// viscosity: es=soa
const es = [];
for (let i = 0; i < 300; i++) es.push({ id: 'e' + i, hp: 100, x: i, tag: i % 3 ? null : { boss: true } });
for (let r = 0; r < 3; r++) {
  for (let i = 0; i < es.length; i++) {
    es[i].x += 1;
    if (es[i].tag !== null) es[i].hp -= 10;
  }
}
es[4].id = 42;
let s = 0;
for (const e of es) s += e.hp + e.x;
console.log(s, es[3].id, es[4].id, es[3].tag.boss, es[5].tag);
