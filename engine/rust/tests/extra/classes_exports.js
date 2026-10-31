export const qs = [];
for (let i = 0; i < 100; i++) qs.push({ v: i });
class Box { #p = 1; static { var hidden = 3; } get p() { return this.#p; } m() { return #p in this; } }
const rs = [];
for (let i = 0; i < 100; i++) rs.push({ v: i, w: new Box().p });
for (let i = 0; i < rs.length; i++) rs[i].v *= 2;
export function twice(n) { return n * 2; }
const z = 3;
export { z };
console.log(rs[5].v, typeof Box);
