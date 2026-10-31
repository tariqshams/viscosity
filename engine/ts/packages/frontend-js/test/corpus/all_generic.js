// viscosity: ws=aos
const ws = [];
for (let i = 0; i < 300; i++) ws.push({ word: 'w' + i });
let n = 0;
for (let i = 0; i < ws.length; i++) n += ws[i].word.length;
console.log(n);
