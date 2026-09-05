const CATS = ["All","Developer Tools","Productivity","Data & Databases","Web & Search","Communication","E-commerce & Finance","AI & Agents","Files & Docs"];
const S = [
  ["Filesystem Server","Give AI assistants safe, scoped access to local files and directories — read, write and organize with permission controls.","Developer Tools","files,local,disk","modelcontextprotocol/servers"],
  ["GitHub Server","Let AI assistants manage repositories, issues, pull requests, files and code search on GitHub.","Developer Tools","github,git,code","modelcontextprotocol/servers"],
  ["GitLab Server","GitLab API integration for project management, merge requests and CI pipelines via AI assistants.","Developer Tools","gitlab,ci,devops","modelcontextprotocol/servers"],
  ["Sentry Server","Fetch and analyze error reports from Sentry — let your AI assistant debug production issues with you.","Developer Tools","monitoring,errors","modelcontextprotocol/servers"],
  ["Puppeteer Server","Browser automation for AI assistants: navigate, screenshot and interact with web pages.","Web & Search","browser,automation,scraping","modelcontextprotocol/servers"],
  ["Fetch Server","Fetch and convert web content to a format optimized for LLM consumption.","Web & Search","web,fetch,html","modelcontextprotocol/servers"],
  ["Brave Search Server","Web and local search powered by the Brave Search API — fresh results inside AI conversations.","Web & Search","search,brave,web","modelcontextprotocol/servers"],
  ["Exa Search Server","AI-native semantic search over the web — find pages by meaning, not just keywords.","Web & Search","search,semantic,exa","exa-labs/exa-mcp-server"],
  ["Firecrawl Server","Turn entire websites into clean, LLM-ready markdown — crawl, scrape and structure the web.","Web & Search","crawling,markdown,scraping","mendableai/firecrawl-mcp-server"],
  ["PostgreSQL Server","Read-only database access with schema inspection for Postgres — safe data exploration by AI.","Data & Databases","postgres,sql,database","modelcontextprotocol/servers"],
  ["SQLite Server","Query, analyze and modify SQLite databases with built-in business intelligence prompts.","Data & Databases","sqlite,sql,bi","modelcontextprotocol/servers"],
  ["Supabase Server","Manage Supabase projects: query tables, manage auth and storage through AI conversations.","Data & Databases","supabase,postgres,baas","supabase-community/supabase-mcp"],
  ["Memory Server","Persistent knowledge-graph memory for AI assistants — remember entities, facts and relations across sessions.","AI & Agents","memory,knowledge-graph","modelcontextprotocol/servers"],
  ["Sequential Thinking Server","Structured, reflective step-by-step reasoning scaffold for complex problem decomposition.","AI & Agents","reasoning,planning","modelcontextprotocol/servers"],
  ["EverArt Server","Generate images inside AI conversations using EverArt's models — from prompt to artwork.","AI & Agents","image-generation,art","modelcontextprotocol/servers"],
  ["Slack Server","Channel management, messaging and history access for team communication inside AI chats.","Communication","slack,messaging,team","modelcontextprotocol/servers"],
  ["Google Drive Server","Search, list and read files from Google Drive — your docs become AI-accessible context.","Files & Docs","google-drive,docs,cloud","modelcontextprotocol/servers"],
  ["Google Maps Server","Location search, directions and place details from Google Maps inside AI chats.","Web & Search","maps,location,travel","modelcontextprotocol/servers"],
  ["Notion Server","Read and manage Notion pages and databases — turn your workspace into AI context.","Productivity","notion,wiki,workspace","modelcontextprotocol/servers"],
  ["Linear Server","Issue tracking and project management for Linear via AI assistants.","Productivity","linear,issues,projects","modelcontextprotocol/servers"],
  ["Jira & Confluence Server","Search and manage Jira issues and Confluence documentation with AI assistance.","Productivity","jira,confluence,atlassian","modelcontextprotocol/servers"],
  ["Microsoft 365 Server","Outlook mail, calendar and OneDrive files as context for your AI assistant.","Productivity","microsoft,outlook,calendar","modelcontextprotocol/servers"],
  ["Cloudflare Server","Deploy and manage Cloudflare Workers, KV, R2 and D1 from natural language.","Developer Tools","cloudflare,edge,deploy","cloudflare/mcp-server-cloudflare"],
  ["Vercel Server","Manage Vercel deployments, projects and DNS records through AI conversations.","Developer Tools","vercel,deploy,hosting","modelcontextprotocol/servers"],
  ["Stripe Server","Payments intelligence: create payment links, list invoices and inspect Stripe data safely.","E-commerce & Finance","stripe,payments,billing","stripe/agent-toolkit"],
  ["Shopify Server","Storefront and admin operations for Shopify stores — products, orders and customers.","E-commerce & Finance","shopify,ecommerce,orders","shopify/dev-mcp"],
  ["PayPal Server","Payment and transaction operations via PayPal's API, exposed to AI assistants.","E-commerce & Finance","paypal,payments,finance","paypal/paypal-mcp-server"],
  ["Bank of Anthos Server","Banking data exploration demo — account balances and transactions as AI context.","E-commerce & Finance","banking,transactions","modelcontextprotocol/servers"],
  ["Obsidian Server","Read and search your Obsidian vault — personal notes become an AI knowledge base.","Files & Docs","obsidian,notes,pkm","modelcontextprotocol/servers"],
  ["Filesystem (Windows) Server","Windows-optimized file operations for AI assistants in enterprise environments.","Files & Docs","windows,files,enterprise","modelcontextprotocol/servers"]
];
const slugify = n => n.replace(/server/ig,"").replace(/&/g,"").replace(/[()]/g," ").trim().toLowerCase().replace(/\s+/g,"-");
let active = "All", q = "";
const params = new URLSearchParams(location.search);
q = params.get("q") || "";
if (CATS.includes(params.get("cat"))) active = params.get("cat");
const grid = document.getElementById("grid"), catsEl = document.getElementById("cats");
function counts(cat){ return cat==="All" ? S.length : S.filter(s=>s[2]===cat).length; }
function renderCats(){
  catsEl.innerHTML = CATS.map(c=>`<button class="cat ${c===active?"active":""}" data-c="${c}">${c}<span>${counts(c)}</span></button>`).join("");
}
function renderGrid(){
  const ql = q.toLowerCase();
  const list = S.filter(s=>(active==="All"||s[2]===active)&&(!ql||(s[0]+" "+s[1]+" "+s[3]).toLowerCase().includes(ql)));
  grid.innerHTML = list.length ? list.map(s=>`
    <article class="card">
      <h3><a href="servers/${slugify(s[0])}.html">${s[0]}</a> <em>${s[2]}</em></h3>
      <p>${s[1]}</p>
      <div class="tags">${s[3].split(",").map(t=>`<span class="chip">${t.trim()}</span>`).join("")}</div>
      <a href="https://github.com/${s[4]}" target="_blank" rel="noopener">Repository →</a>
    </article>`).join("") : `<div class="empty">No servers match your search. Try another keyword, or submit yours below.</div>`;
}
function syncUrl(){
  const p = new URLSearchParams();
  if (q) p.set("q", q);
  if (active !== "All") p.set("cat", active);
  const s = p.toString();
  history.replaceState(null, "", s ? "?" + s : location.pathname);
}
catsEl.addEventListener("click",e=>{ const b=e.target.closest(".cat"); if(!b) return; active=b.dataset.c; renderCats(); renderGrid(); syncUrl(); });
document.getElementById("q").addEventListener("input",e=>{ q=e.target.value; renderGrid(); syncUrl(); });
if (q) document.getElementById("q").value = q;
renderCats(); renderGrid();
