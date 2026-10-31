// viscosity(opt-in): marked=soa, unmarked=aos
// @viscosity soa
const marked = [];
const unmarked = [];
for (let i = 0; i < 300; i++) {
  marked.push({ v: i });
  unmarked.push({ v: i });
}
let s = 0;
for (let i = 0; i < marked.length; i++) s += marked[i].v + unmarked[i].v;
console.log(s);
