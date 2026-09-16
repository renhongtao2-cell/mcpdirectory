/*
 * MCP Servers Directory — 站点 A 同步脚本（幂等）
 * 数据源：app.js 的 S 数组
 * 重新生成：index.html 卡片/侧栏计数/JSON-LD ItemList/placeholder/FAQ 数、
 *          servers/<slug>.html 详情页、sitemap.xml、llms.txt
 * 用法：node .workbuddy/sync-site-a.js
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const BASE = "https://mcp.toolboxes.top";
const CATS = ["All","Developer Tools","Productivity","Data & Databases","Web & Search","Communication","E-commerce & Finance","AI & Agents","Files & Docs"];
const TODAY = new Date().toISOString().slice(0, 10);

// ---- 1. 解析 app.js 的 S 数组 ----
const appJs = fs.readFileSync(path.join(ROOT, "app.js"), "utf8");
const S = [];
const sBlock = appJs.match(/const S = \[([\s\S]*?)\n\];/);
if (!sBlock) throw new Error("app.js: 未找到 S 数组");
for (const line of sBlock[1].split("\n")) {
  const m = line.match(/^\s*\["((?:[^"\\]|\\.)*)","((?:[^"\\]|\\.)*)","((?:[^"\\]|\\.)*)","((?:[^"\\]|\\.)*)","((?:[^"\\]|\\.)*)"\],?\s*$/);
  if (m) S.push(m.slice(1, 6));
}
if (!S.length) throw new Error("app.js: S 数组解析为空");

const slugify = n => n.replace(/server/ig, "").replace(/&/g, "").replace(/[()]/g, " ").trim().toLowerCase().replace(/\s+/g, "-");
const esc = s => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const jstr = s => JSON.stringify(s);

// 校验分类
for (const s of S) {
  if (!CATS.includes(s[2])) throw new Error(`分类非法: ${s[0]} -> ${s[2]}`);
}
// 校验 slug 唯一
const slugs = S.map(s => slugify(s[0]));
if (new Set(slugs).size !== slugs.length) throw new Error("slug 重复: " + slugs.filter((v, i) => slugs.indexOf(v) !== i));

const N = S.length;
console.log(`[sync] S 数组共 ${N} 个 server`);

// ---- 2. index.html ----
let html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
const before = html.length;

// 兼容 CRLF：先统一换行，处理后写回（保持 LF）
if (html.includes("\r\n")) html = html.replace(/\r\n/g, "\n");

// 2a. 卡片 #grid
const cards = S.map(s => {
  const slug = slugify(s[0]);
  return `    <article class="card">
      <h3><a href="servers/${slug}.html">${esc(s[0])}</a> <em>${esc(s[2])}</em></h3>
      <p>${esc(s[1])}</p>
      <div class="tags">${s[3].split(",").map(t => `<span class="chip">${esc(t.trim())}</span>`).join("")}</div>
      <a href="https://github.com/${s[4]}" target="_blank" rel="noopener">Repository →</a>
    </article>`;
}).join("\n");
html = html.replace(/(<div id="grid">\n)([\s\S]*?)(\n    <\/div>\n    <div class="faq" id="faq">)/,
  (m, a, b, c) => a + cards + c);

// 2b. 侧栏分类计数
const catsHtml = CATS.map(c => {
  const n = c === "All" ? N : S.filter(s => s[2] === c).length;
  return `<button class="cat ${c === "All" ? "active " : ""}" data-c="${c === "All" ? "All" : esc(c)}">${c === "All" ? "All" : esc(c)}<span>${n}</span></button>`;
}).join("");
html = html.replace(/(<div id="cats">)[\s\S]*?(<\/div>)/, (m, a, b) => a + catsHtml + b);

// 2c. JSON-LD ItemList
const items = S.map((s, i) => `        {
          "@type": "ListItem",
          "position": ${i + 1},
          "item": {
            "@type": "SoftwareApplication",
            "name": ${jstr(s[0])},
            "description": ${jstr(s[1])},
            "applicationCategory": ${jstr(s[2])},
            "url": "${BASE}/servers/${slugify(s[0])}.html"
          }
        }`).join(",\n");
html = html.replace(/("itemListElement": \[\n)[\s\S]*?(\n      \]\n    \},)/, (m, a, b) => a + items + b);
html = html.replace(/("numberOfItems": )\d+/, `$1${N}`);

// 2d. placeholder
html = html.replace(/placeholder="Search \d+\+ MCP servers/, `placeholder="Search ${N}+ MCP servers`);

// 2e. FAQ 数量表述（全局）
html = html.replace(/curates \d+\+ open-source MCP servers/g, `curates ${N}+ open-source MCP servers`);

if (html.length === before) console.warn("[warn] index.html 长度未变，请检查正则");
fs.writeFileSync(path.join(ROOT, "index.html"), html);
console.log("[sync] index.html 已更新");

// ---- 3. 详情页 ----
function detailPage(s, idx) {
  const [name, desc, cat, tags, repo] = s;
  const slug = slugify(name);
  const shortName = name.replace(/ Server$/i, "");
  const key = slug.replace(/[^a-z0-9-]/g, "") || "mcp";
  const catEnc = encodeURIComponent(cat);
  const related = S.filter(x => x[2] === cat && x[0] !== name).slice(0, 5);
  const relPool = related.length >= 3 ? related
    : related.concat(S.filter(x => x[2] !== cat).slice(0, 5 - related.length));
  const relHtml = relPool.map(x =>
    `    <a href="${slugify(x[0])}.html">${esc(x[0])}</a>`).join("\n");
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(name)} — ${esc(cat)} | MCP Servers Directory</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${BASE}/servers/${slug}.html">
<meta name="theme-color" content="#0f1420">
<link rel="icon" href="data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%2036%2036'%3E%3Cdefs%3E%3ClinearGradient%20id='g'%20x1='0'%20y1='0'%20x2='1'%20y2='1'%3E%3Cstop%20offset='0'%20stop-color='%234cc9f0'/%3E%3Cstop%20offset='1'%20stop-color='%237b61ff'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect%20width='36'%20height='36'%20rx='9'%20fill='url(%23g)'/%3E%3C/svg%3E">
<meta property="og:type" content="website">
<meta property="og:site_name" content="MCP Servers Directory">
<meta property="og:title" content="${esc(name)} — ${esc(cat)} | MCP Servers Directory">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${BASE}/servers/${slug}.html">
<meta property="og:image" content="${BASE}/og-image.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(name)} — ${esc(cat)} | MCP Servers Directory">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${BASE}/og-image.png">
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "MCP Servers Directory",
          "item": "${BASE}/"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": ${jstr(cat)},
          "item": "${BASE}/?cat=${catEnc}"
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": ${jstr(name)}
        }
      ]
    },
    {
      "@type": "SoftwareApplication",
      "name": ${jstr(name)},
      "alternateName": ${jstr(shortName)},
      "description": ${jstr(desc)},
      "applicationCategory": ${jstr(cat)},
      "operatingSystem": "Cross-platform",
      "url": "${BASE}/servers/${slug}.html",
      "sameAs": "https://github.com/${repo}",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD"
      }
    }
  ]
}
</script>
<style>
  :root{--bg:#0f1420;--panel:#171e2e;--panel2:#1e2740;--line:#2a3550;--text:#e8edf5;--dim:#8a97ad;--cyan:#4cc9f0;--cyan-d:#173c4d;--green:#57d977;--amber:#ffb454;}
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:var(--bg);color:var(--text);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;line-height:1.55}
  header{padding:22px 26px;border-bottom:1px solid var(--line);display:flex;align-items:center;gap:14px;flex-wrap:wrap}
  .logo{width:36px;height:36px;border-radius:9px;background:conic-gradient(from 90deg,#4cc9f0,#7b61ff,#4cc9f0)}
  header h1{font-size:19px}
  header p{font-size:12px;color:var(--dim)}
  .cta{margin-left:auto;display:flex;gap:10px}
  .btn{border:none;border-radius:10px;padding:10px 16px;font-weight:700;font-size:13.5px;cursor:pointer;text-decoration:none;display:inline-block}
  .btn-c{background:var(--cyan);color:#06222b}
  .btn-g{background:var(--panel);color:var(--text);border:1px solid var(--line)}
  main{max-width:1150px;margin:0 auto;padding:22px 20px 60px;display:grid;grid-template-columns:210px 1fr;gap:20px}
  @media(max-width:860px){main{grid-template-columns:1fr}}
  .side{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:14px;height:fit-content;position:sticky;top:16px}
  .side h2{font-size:11.5px;text-transform:uppercase;color:var(--dim);letter-spacing:.8px;margin-bottom:8px}
  .cat{display:block;width:100%;text-align:left;background:transparent;border:none;color:var(--dim);padding:8px 10px;border-radius:8px;font-size:13.5px;cursor:pointer}
  .cat:hover{background:var(--panel2);color:var(--text)}
  .cat.active{background:var(--cyan-d);color:var(--cyan);font-weight:700}
  .cat span{float:right;font-size:11px}
  .search{width:100%;background:var(--panel2);border:1px solid var(--line);color:var(--text);border-radius:10px;padding:11px 14px;font-size:14px;outline:none;margin-bottom:14px}
  .search:focus{border-color:var(--cyan)}
  #grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:14px}
  .card{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:16px;display:flex;flex-direction:column;gap:8px}
  .card h3{font-size:15px;display:flex;justify-content:space-between;gap:8px}
  .card h3 em{font-style:normal;font-size:11px;color:var(--cyan);border:1px solid #4cc9f044;background:#4cc9f01a;padding:2px 8px;border-radius:999px;white-space:nowrap}
  .card p{font-size:13px;color:var(--dim);flex:1}
  .card .tags{display:flex;flex-wrap:wrap;gap:6px}
  .chip{font-size:10.5px;padding:2px 8px;border-radius:999px;background:var(--panel2);border:1px solid var(--line);color:var(--dim)}
  .card a{color:var(--cyan);font-size:12.5px;text-decoration:none;font-weight:600}
  .empty{grid-column:1/-1;text-align:center;color:var(--dim);padding:40px}
  .banner{background:linear-gradient(120deg,#173c4d,#231a4d);border:1px solid var(--line);border-radius:14px;padding:18px 20px;margin-bottom:16px}
  .banner b{color:var(--cyan)}
  .banner p{font-size:13.5px;color:var(--text)}
  footer{border-top:1px solid var(--line);text-align:center;color:var(--dim);font-size:12.5px;padding:24px}
  footer a{color:var(--cyan)}
  .detail{max-width:860px;margin:0 auto;padding:24px 20px 60px;display:block}
  .crumb{font-size:12.5px;color:var(--dim);margin-bottom:14px}
  .crumb a{color:var(--cyan);text-decoration:none}
  .meta-chips{display:flex;gap:6px;flex-wrap:wrap;margin:10px 0 14px}
  .detail h1{font-size:26px}
  .detail h2{font-size:16px;margin:24px 0 8px}
  .detail p{margin:10px 0}
  .detail ol{margin:10px 0 10px 22px;color:var(--dim);font-size:14px}
  .detail ol li{margin:5px 0}
  .detail a{color:var(--cyan)}
  .code{background:var(--panel2);border:1px solid var(--line);border-radius:10px;padding:14px;font-family:ui-monospace,Consolas,monospace;font-size:12.5px;overflow-x:auto;white-space:pre;color:var(--text)}
  .rel a{display:inline-block;margin:4px 14px 4px 0;color:var(--cyan);font-size:13px;text-decoration:none}
  .btnrow{margin:18px 0;display:flex;gap:10px;flex-wrap:wrap}
  .dim{color:var(--dim)} .small{font-size:12.5px}
</style>
</head>
<body>
<header>
  <a class="logo" href="/" aria-label="MCP Servers Directory home"></a>
  <div><div class="brand" style="font-size:19px;font-weight:700"><a href="/">MCP Servers Directory</a></div><p style="font-size:12px;color:var(--dim)">The curated catalog of Model Context Protocol servers</p></div>
</header>

<main class="detail">
  <div class="crumb"><a href="/">MCP Servers Directory</a> / <a href="/?cat=${catEnc}">${esc(cat)}</a> / ${esc(name)}</div>
  <h1>${esc(name)}</h1>
  <div class="meta-chips"><span class="chip">${esc(cat)}</span>${tags.split(",").map(t => `<span class="chip">${esc(t.trim())}</span>`).join("")}</div>
  <p>${esc(desc)}</p>
  <p>${esc(shortName)} is an open-source MCP server maintained at <a href="https://github.com/${repo}" target="_blank" rel="noopener">${repo}</a> and is listed in the <a href="/?cat=${catEnc}">${esc(cat)}</a> category of the MCP Servers Directory.</p>
  <div class="btnrow"><a class="btn btn-c" href="https://github.com/${repo}" target="_blank" rel="noopener">View on GitHub →</a><a class="btn btn-g" href="/">← Browse all ${N} servers</a></div>

  <h2>How to connect ${esc(shortName)} to Claude Desktop</h2>
  <ol>
    <li>Install Node.js (v18+) if you do not have it — most MCP servers run through <code>npx</code>.</li>
    <li>Open Claude Desktop, go to <b>Settings → Developer → Edit Config</b>, and open <code>claude_desktop_config.json</code>.</li>
    <li>Add an <code>mcpServers</code> entry for this server (see the example below).</li>
    <li>Check the server's GitHub README for the exact package name, required arguments and environment variables (for example API keys).</li>
    <li>Restart Claude Desktop — the server's tools appear under the tools (hammer) icon in a new chat.</li>
  </ol>
  <div class="code">{
  "mcpServers": {
    "${key}": {
      "command": "npx",
      "args": [
        "-y",
        "&lt;package-name-from-README&gt;"
      ],
      "env": {
        "API_KEY": "your-key-if-required"
      }
    }
  }
}</div>
  <p class="dim small">The exact package name, arguments and required environment variables are documented in the server's README on GitHub.</p>

  <h2>Related MCP servers</h2>
  <div class="rel">
${relHtml}
  </div>
</main>

<footer>MCP Servers Directory — an independent, weekly-updated catalog of Model Context Protocol servers. <a href="/about.html">About</a> · <a href="/privacy.html">Privacy Policy</a><br>MCP is an open standard; trademarks belong to their owners.</footer>
</body>
</html>
`;
}

fs.mkdirSync(path.join(ROOT, "servers"), { recursive: true });
let created = 0, updated = 0;
S.forEach((s, i) => {
  const p = path.join(ROOT, "servers", slugify(s[0]) + ".html");
  const content = detailPage(s, i);
  if (fs.existsSync(p)) {
    if (fs.readFileSync(p, "utf8") !== content) { fs.writeFileSync(p, content); updated++; }
  } else { fs.writeFileSync(p, content); created++; }
});
console.log(`[sync] 详情页: 新建 ${created}, 更新 ${updated}, 共 ${N}`);

// ---- 4. sitemap.xml ----
const urls = [`  <url><loc>${BASE}/</loc><lastmod>${TODAY}</lastmod><changefreq>daily</changefreq><priority>1.0</priority></url>`]
  .concat(S.map(s => `  <url><loc>${BASE}/servers/${slugify(s[0])}.html</loc><lastmod>${TODAY}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>`))
  .concat([
    `  <url><loc>${BASE}/about.html</loc><lastmod>${TODAY}</lastmod><changefreq>monthly</changefreq><priority>0.3</priority></url>`,
    `  <url><loc>${BASE}/privacy.html</loc><lastmod>${TODAY}</lastmod><changefreq>monthly</changefreq><priority>0.3</priority></url>`
  ]);
fs.writeFileSync(path.join(ROOT, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`);
console.log(`[sync] sitemap.xml: ${urls.length} 个 URL`);

// ---- 5. llms.txt ----
const llms = [
  "# MCP Servers Directory",
  "",
  `> A hand-curated catalog of Model Context Protocol (MCP) servers: what each server does, its category and its GitHub repository. Built to help developers and AI assistants find the right MCP server. Updated weekly. ${N}+ servers across ${CATS.length - 1} categories.`,
  "",
  "## Pages",
  "",
  `- [MCP Servers Directory](${BASE}/): browse and search all MCP servers by category`,
  `- [About](${BASE}/about.html): curation policy and submission process`,
  `- [Privacy Policy](${BASE}/privacy.html)`,
  "",
  "## MCP servers",
  ""
].concat(S.map(s => `- [${s[0]}](${BASE}/servers/${slugify(s[0])}.html): ${s[1]}`)).join("\n") + "\n";
fs.writeFileSync(path.join(ROOT, "llms.txt"), llms);
console.log("[sync] llms.txt 已更新");

// ---- 6. 自检 ----
const errs = [];
const idx = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
const cardCount = (idx.match(/<article class="card">/g) || []).length;
const detailCount = fs.readdirSync(path.join(ROOT, "servers")).filter(f => f.endsWith(".html")).length;
const smCount = (fs.readFileSync(path.join(ROOT, "sitemap.xml"), "utf8").match(/<loc>/g) || []).length;
if (cardCount !== N) errs.push(`卡片数 ${cardCount} != S ${N}`);
if (detailCount !== N) errs.push(`详情页 ${detailCount} != S ${N}`);
if (smCount !== N + 3) errs.push(`sitemap ${smCount} != ${N + 3}`);
try {
  const m = idx.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  JSON.parse(m[1]);
} catch (e) { errs.push("index.html JSON-LD 解析失败: " + e.message); }
if (errs.length) { console.error("[FAIL] " + errs.join(" | ")); process.exit(1); }
console.log(`[OK] 一致: 卡片 ${cardCount} = 详情页 ${detailCount} = S ${N}; sitemap ${smCount} URL; JSON-LD 可解析`);
