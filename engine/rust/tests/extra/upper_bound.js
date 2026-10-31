const evens = [];
for (let i = 0; i < 100; i++) { if (i % 2) evens.push({ x: i, y: 1 }); }
for (let i = 0; i < evens.length; i++) evens[i].y += evens[i].x;
const small = [];
for (let i = 0; i < 40; i++) { if (i % 3 === 0) small.push({ x: i }); }
for (let i = 0; i < small.length; i++) small[i].x++;
const both = [];
for (let i = 0; i < 50; i++) { if (i % 2) both.push({ x: i }); else both.push({ x: 0 }); }
for (let i = 0; i < both.length; i++) both[i].x *= 2;
const early = [];
for (let i = 0; i < 80; i++) { if (i > 70) break; early.push({ x: i }); }
for (let i = 0; i < early.length; i++) early[i].x -= 1;
console.log(evens.length, small.length, both[3].x, early.length);
