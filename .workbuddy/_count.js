const fs = require('fs');
const src = fs.readFileSync('E:/xiangmu/mcpdirectory-clone/app.js', 'utf8').replace(/\r\n/g, '\n');
const start = src.indexOf('const S = [');
// find matching close bracket by scanning
let i = src.indexOf('[', start);
let depth = 0, end = -1;
for (let j = i; j < src.length; j++) {
  if (src[j] === '[') depth++;
  else if (src[j] === ']') { depth--; if (depth === 0) { end = j; break; } }
}
const block = src.slice(i, end + 1);
// each entry is a top-level [ ... ] — count top-level "[" occurrences
let count = 0;
let d2 = 0;
for (const ch of block) {
  if (ch === '[') { if (d2 === 0) count++; d2++; }
  else if (ch === ']') d2--;
}
console.log('S total entries:', count);
// extract top-level entry first field (name)
const names = [];
let cur = null, buf = '', inArr = 0;
for (const ch of block) {
  if (ch === '[') { inArr++; if (inArr === 2) buf = ''; }
  else if (ch === ']') { if (inArr === 2 && buf.length) { names.push(buf); buf = ''; } inArr--; }
  else if (inArr === 2) buf += ch;
  // capture name up to comma
}
// simpler: regex top-level entries
const re = /^\s*\[(.*?)\],?$/gms;
const arrEntries = [...block.matchAll(/^\s*\["(.*?)"(?:,(.*?))?\],?\s*$/gm)];
console.log('parsed entries:', arrEntries.length);
