const fs = require('fs');
const src = fs.readFileSync('E:/xiangmu/mcpdirectory-clone/app.js', 'utf8').replace(/\r\n/g, '\n');
const lines = src.split('\n').filter(l => /^\s*\[["']/.test(l));
const names = lines.map(l => {
  const m = l.match(/^\s*\[["']([^"']+)["']/);
  return m ? m[1] : l.trim().slice(0, 40);
});
console.log('count:', names.length);
names.forEach((n, i) => console.log(i + 1, n));
