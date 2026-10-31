const ps = [];
for (let i = 0; i < 100; i++) ps.push({ x: i, y: i });
const [first] = [ps[0]];
const { x } = ps[1];
let a, b;
[a, b] = [1, 2];
({ a, b } = { a: b, b: a });
function f({ q = ps.length } = {}, ...rest) { return q + rest.length; }
for (let i = 0; i < ps.length; i++) ps[i].x += a;
console.log(first.x, x, a, b, f({}, 1, 2));
