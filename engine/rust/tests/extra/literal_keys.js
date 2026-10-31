const ps = [{ 'a': 1, "b-c": 2, length: 3 }, { 'a': 4, "b-c": 5, length: 6 }];
for (let i = 0; i < 200; i++) ps.push({ 'a': i, "b-c": i + 1, length: 0 });
let s = 0;
for (let i = 0; i < ps.length; i++) s += ps[i].a + ps[i].length;
console.log(s, ps.length, ps[1]['a']);
