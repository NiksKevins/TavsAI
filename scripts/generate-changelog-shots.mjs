/**
 * Renders product-faithful HD changelog screenshots (2× retina).
 * Run: node scripts/generate-changelog-shots.mjs
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "../public/changelog");

const SHELL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&family=Syne:wght@600;700&display=swap');
  :root {
    --bg: #fafafa; --fg: #0f172a; --card: #fff; --muted: #f1f5f9;
    --muted-fg: #64748b; --border: #e2e8f0; --primary: #3b82f6;
    --accent: #eff6ff; --accent-fg: #2563eb; --radius: 12px;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0; background: var(--bg); color: var(--fg);
    font-family: Manrope, system-ui, sans-serif; -webkit-font-smoothing: antialiased;
  }
  .display { font-family: Syne, Manrope, sans-serif; }
  .shell { display: grid; grid-template-columns: 240px 1fr; min-height: 900px; }
  .aside {
    background: var(--card); border-right: 1px solid var(--border);
    padding: 20px 14px; display: flex; flex-direction: column; gap: 18px;
  }
  .brand { display: flex; align-items: center; gap: 10px; padding: 4px 8px; }
  .brand-mark {
    width: 32px; height: 32px; border-radius: 8px; background: var(--primary);
    color: #fff; display: grid; place-items: center; font-weight: 700; font-size: 14px;
  }
  .brand-name { font-family: Syne, sans-serif; font-weight: 700; font-size: 15px; }
  .brand-sub { font-size: 11px; color: var(--muted-fg); margin-top: 1px; }
  .group-label {
    display: flex; align-items: center; justify-content: space-between;
    font-size: 11px; font-weight: 650; letter-spacing: 0.14em; text-transform: uppercase;
    color: var(--muted-fg); padding: 8px 10px 6px;
  }
  .nav a {
    display: flex; align-items: center; gap: 10px; padding: 9px 12px;
    border-radius: 10px; color: #475569; text-decoration: none; font-size: 14px; font-weight: 500;
  }
  .nav a.active { background: var(--accent); color: var(--accent-fg); }
  .main { padding: 28px 36px 40px; }
  .topbar {
    display: flex; justify-content: flex-end; align-items: center; gap: 12px; margin-bottom: 22px;
  }
  .chip {
    display: inline-flex; align-items: center; gap: 6px; border: 1px solid var(--border);
    background: #fff; border-radius: 10px; padding: 8px 12px; font-size: 13px; font-weight: 600;
  }
  .user { text-align: right; font-size: 13px; line-height: 1.25; }
  .user .role { color: var(--muted-fg); font-size: 11px; }
  h1 { margin: 0; font-size: 30px; font-weight: 700; letter-spacing: -0.02em; }
  .subtitle { margin: 8px 0 0; color: var(--muted-fg); font-size: 15px; max-width: 54ch; line-height: 1.5; }
  .badge {
    display: inline-flex; align-items: center; border-radius: 999px; padding: 3px 10px;
    font-size: 12px; font-weight: 600; background: var(--muted); color: #334155;
  }
  .badge.ok { background: #dcfce7; color: #166534; }
  .badge.primary { background: var(--primary); color: #fff; }
  .badge.outline { background: #fff; border: 1px solid var(--border); }
  .card {
    background: var(--card); border: 1px solid var(--border); border-radius: var(--radius);
    padding: 18px; box-shadow: 0 1px 0 rgba(15,23,42,0.02);
  }
  .btn {
    display: inline-flex; align-items: center; justify-content: center; gap: 8px;
    border-radius: 10px; padding: 9px 14px; font-size: 13px; font-weight: 600; border: 1px solid transparent;
  }
  .btn-primary { background: var(--primary); color: #fff; }
  .btn-outline { background: #fff; border-color: var(--border); color: #0f172a; }
  .btn:disabled { opacity: 0.55; }
  .section-label {
    display: flex; align-items: center; gap: 8px; font-size: 11px; font-weight: 650;
    letter-spacing: 0.14em; text-transform: uppercase; color: var(--muted-fg); margin: 0 0 12px;
  }
  table { width: 100%; border-collapse: collapse; font-size: 14px; }
  th {
    text-align: left; font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase;
    color: var(--muted-fg); font-weight: 650; padding: 12px 14px; border-bottom: 1px solid var(--border);
  }
  td { padding: 14px; border-bottom: 1px solid var(--border); vertical-align: top; }
  tr:last-child td { border-bottom: 0; }
  .name { color: var(--accent-fg); font-weight: 600; }
  .meta { color: var(--muted-fg); font-size: 12px; margin-top: 3px; }
  .mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12px; color: #475569; }
  .progress {
    height: 10px; border-radius: 999px; background: var(--muted); overflow: hidden;
  }
  .progress > span { display: block; height: 100%; width: 68%; background: var(--primary); border-radius: inherit; }
  .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 14px; }
  .stat {
    background: var(--muted); border-radius: 10px; padding: 12px 14px;
  }
  .stat .k { font-size: 11px; color: var(--muted-fg); text-transform: uppercase; letter-spacing: 0.08em; }
  .stat .v { font-family: Syne, sans-serif; font-size: 22px; font-weight: 700; margin-top: 4px; }
  .metrics { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-top: 22px; }
  .metric {
    background: var(--card); border: 1px solid var(--border); border-radius: var(--radius); padding: 14px 16px;
  }
  .metric .k { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--muted-fg); font-weight: 650; }
  .metric .v { font-family: Syne, sans-serif; font-size: 26px; font-weight: 700; margin-top: 6px; }
  .logo-box {
    width: 56px; height: 56px; border-radius: 16px; border: 1px solid var(--border);
    background: #fff; display: grid; place-items: center; box-shadow: 0 1px 2px rgba(15,23,42,0.04);
  }
  .logo-box svg { width: 36px; height: 36px; }
  .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
  .grid-2 { display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 16px; margin-top: 16px; }
`;

const GOOGLE_SVG = `<svg viewBox="0 0 256 256" width="36" height="36"><polygon fill="#FFF" points="195.368 60.632 60.632 60.632 60.632 195.368 195.368 195.368"/><polygon fill="#EA4335" points="195.368 256 256 195.368 225.684 190.196 195.368 195.368 189.835 223.098"/><path d="M0 195.368v40.421C0 246.956 9.044 256 20.211 256H60.632l6.225-30.316L60.632 195.368 27.599 190.196 0 195.368z" fill="#188038"/><path d="M256 60.632V20.211C256 9.044 246.956 0 235.789 0H195.368c-3.689 15.036-5.533 26.101-5.533 33.196s1.844 12.24 5.533 23.436c13.41 3.84 23.515 5.76 30.316 5.76s16.906-1.92 30.316-5.76z" fill="#1967D2"/><polygon fill="#FBBC04" points="256 60.632 195.368 60.632 195.368 195.368 256 195.368"/><polygon fill="#34A853" points="195.368 195.368 60.632 195.368 60.632 256 195.368 256"/><path d="M195.368 0H20.211C9.044 0 0 9.044 0 20.211v175.157h60.632V60.632h134.736V0z" fill="#4285F4"/><path d="M88.269 165.154c-5.036-3.402-8.522-8.371-10.425-14.939l11.689-4.817c1.061 4.042 2.914 7.175 5.558 9.398 2.627 2.223 5.827 3.318 9.566 3.318 3.823 0 7.107-1.162 9.853-3.486 2.745-2.324 4.126-5.288 4.126-8.876 0-3.672-1.448-6.67-4.345-8.994-2.897-2.324-6.535-3.486-10.88-3.486H96.657v-11.571h6.063c3.739 0 6.888-1.01 9.448-3.032 2.56-2.021 3.84-4.783 3.84-8.303 0-3.133-1.145-5.625-3.436-7.495-2.29-1.87-5.187-2.813-8.707-2.813-3.436 0-6.164.91-8.185 2.745-2.02 1.841-3.538 4.165-4.413 6.754l-11.57-4.817c1.532-4.345 4.345-8.185 8.471-11.503 4.126-3.318 9.398-4.985 15.798-4.985 4.733 0 8.994.91 12.767 2.745 3.772 1.836 6.737 4.379 8.876 7.613 2.139 3.25 3.2 6.888 3.2 10.93 0 4.126-.994 7.613-2.981 10.476-1.987 2.863-4.429 5.053-7.326 6.585v.691c3.741 1.542 6.99 4.075 9.398 7.326 2.442 3.284 3.672 7.208 3.672 11.79s-1.162 8.674-3.486 12.261c-2.324 3.587-5.541 6.417-9.617 8.472-4.093 2.055-8.69 3.099-13.794 3.099-5.912.017-11.369-1.684-16.405-5.086zm71.798-58.004l-12.834 9.28-6.417-9.735 23.023-16.606h8.825v78.333h-12.598V107.15z" fill="#4285F4"/></svg>`;

const OUTLOOK_SVG = `<svg viewBox="0 0 512 512" width="36" height="36"><rect width="231" height="270" x="168" y="107" fill="#0052A5" rx="15"/><path fill="#113366" d="M398 247v23l15-8s0-7-5-9l-10-6z"/><path fill="#113366" d="M168 290v70h77v-70z"/><path fill="#1177DD" d="M168 150v70h77v-70zm77 70v70h77v-70zm77 70v70h77v-70z"/><path fill="#33AAEE" d="M245 150v70h77v-70zm77 70v70h77v-70z"/><path fill="#55CCFF" d="M322 150h77v70h-77z"/><path fill="#1199EE" d="M413 261 282 336s121 73 124 71c5-3 7-11 7-18V261Z"/><path fill="#22AAEE" d="M160 266c-4 3-6 7-6 12v117c0 8 6 14 14 14h230c4 0 5 0 8-2"/><rect width="172" height="172" x="70" y="172" fill="#1188EE" rx="15"/><path fill="#fff" d="M155 230c14 0 22 11 22 29s-9 28-23 28c-11 0-22-10-22-28 0-15 7-29 23-29Zm-1 75c26 0 44-18 44-47 0-25-16-46-43-46-28 0-44 20-44 48 0 27 20 45 43 45Z"/></svg>`;

const CALENDLY_SVG = `<svg viewBox="0 0 24 24" width="32" height="32"><circle cx="12" cy="12" r="12" fill="#006BFF"/><path fill="#fff" d="M17.6 8.4c-.3-.3-.8-.3-1.1 0l-5.2 5.2-2.1-2.1c-.3-.3-.8-.3-1.1 0-.3.3-.3.8 0 1.1l2.7 2.7c.3.3.8.3 1.1 0l5.7-5.7c.3-.4.3-.9 0-1.2z"/></svg>`;

function shell({ active, title, subtitle, body, topExtra = "" }) {
  const link = (href, label, key) =>
    `<a class="${active === key ? "active" : ""}" href="#">${label}</a>`;
  return `<!doctype html><html lang="lv"><head><meta charset="utf-8"><style>${SHELL_CSS}</style></head><body>
  <div class="shell" id="shot">
    <aside class="aside">
      <div class="brand">
        <div class="brand-mark">T</div>
        <div>
          <div class="brand-name">TavsWebs Bot</div>
          <div class="brand-sub">Darba telpa</div>
        </div>
      </div>
      <nav class="nav">
        <div class="group-label"><span>Darbs</span><span>▾</span></div>
        ${link("#", "Pārskats", "overview")}
        ${link("#", "Sarunas", "chats")}
        ${link("#", "Leadi", "leads")}
        ${link("#", "Pieraksti", "bookings")}
        ${link("#", "Analītika", "analytics")}
        <div class="group-label" style="margin-top:10px"><span>Bots</span><span>▾</span></div>
        ${link("#", "Zināšanas", "knowledge")}
        ${link("#", "Asistents", "assistant")}
        ${link("#", "Widget", "widget")}
        ${link("#", "Integrācijas", "integrations")}
        <div class="group-label" style="margin-top:10px"><span>Konts</span><span>▾</span></div>
        ${link("#", "Norēķini", "billing")}
        ${link("#", "Iestatījumi", "settings")}
      </nav>
    </aside>
    <div class="main">
      <div class="topbar">
        <div class="chip">📢 Jaunumi</div>
        ${topExtra}
        <div class="user">
          <div><strong>Niks Kevins Markitāns</strong></div>
          <div class="role">OWNER · nikskevinsm@gmail.com</div>
        </div>
      </div>
      <h1 class="display">${title}</h1>
      <p class="subtitle">${subtitle}</p>
      ${body}
    </div>
  </div>
  </body></html>`;
}

const pages = {
  "integrations.png": shell({
    active: "integrations",
    title: "Integrācijas",
    subtitle:
      "Pievienojiet kalendārus un pierakstu rīkus. OAuth marķieri tiek šifrēti un netiek rādīti pārlūkā.",
    body: `
      <div style="margin-top:28px">
        <div class="section-label">📅 Pieejams tagad</div>
        <div class="grid-3">
          <div class="card" style="border-color:#bfdbfe">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px">
              <div class="logo-box">${GOOGLE_SVG}</div>
              <span class="badge">Nav savienots</span>
            </div>
            <h3 class="display" style="margin:14px 0 6px;font-size:18px">Google Calendar</h3>
            <p style="margin:0;color:var(--muted-fg);font-size:13px;line-height:1.5">
              Reāla pieejamība un pierakstu apstiprināšana. AI neizdomā brīvus laikus.
            </p>
            <div style="display:flex;gap:8px;margin-top:16px;flex-wrap:wrap">
              <button class="btn btn-primary">Pievienot Google Calendar</button>
              <button class="btn btn-outline">Skatīt pierakstus</button>
            </div>
          </div>
          <div class="card" style="opacity:.95">
            <div style="display:flex;justify-content:space-between;align-items:flex-start">
              <div class="logo-box">${OUTLOOK_SVG}</div>
              <span class="badge outline">Drīzumā</span>
            </div>
            <h3 class="display" style="margin:14px 0 6px;font-size:18px">Microsoft Outlook</h3>
            <p style="margin:0;color:var(--muted-fg);font-size:13px;line-height:1.5">Outlook / Microsoft 365 kalendārs pierakstiem.</p>
            <div style="margin-top:16px"><button class="btn btn-outline" disabled>Gaidām</button></div>
          </div>
          <div class="card" style="opacity:.95">
            <div style="display:flex;justify-content:space-between;align-items:flex-start">
              <div class="logo-box">${CALENDLY_SVG}</div>
              <span class="badge outline">Drīzumā</span>
            </div>
            <h3 class="display" style="margin:14px 0 6px;font-size:18px">Calendly</h3>
            <p style="margin:0;color:var(--muted-fg);font-size:13px;line-height:1.5">Sinhronizē Calendly slotus ar asistentu.</p>
            <div style="margin-top:16px"><button class="btn btn-outline" disabled>Gaidām</button></div>
          </div>
        </div>
      </div>`,
  }),

  "leads-table.png": shell({
    active: "leads",
    title: "Leadi",
    subtitle: "Potenciālie klienti no sarunām un widget formām.",
    topExtra: `<button class="btn btn-outline">Lead iestatījumi</button>`,
    body: `
      <div class="card" style="margin-top:22px;padding:16px">
        <div style="display:grid;grid-template-columns:1.4fr 1fr 1fr auto;gap:10px;align-items:end">
          <div>
            <div style="font-size:12px;color:var(--muted-fg);margin-bottom:6px">Meklēt</div>
            <div style="border:1px solid var(--border);border-radius:10px;padding:10px 12px;color:#94a3b8">Vārds, e-pasts, telefons…</div>
          </div>
          <div>
            <div style="font-size:12px;color:var(--muted-fg);margin-bottom:6px">Statuss</div>
            <div style="border:1px solid var(--border);border-radius:10px;padding:10px 12px">Visi</div>
          </div>
          <div>
            <div style="font-size:12px;color:var(--muted-fg);margin-bottom:6px">Pakalpojums</div>
            <div style="border:1px solid var(--border);border-radius:10px;padding:10px 12px">Visi</div>
          </div>
          <button class="btn btn-primary">Filtrēt</button>
        </div>
      </div>
      <div class="card" style="margin-top:14px;padding:0;overflow:hidden">
        <table>
          <thead>
            <tr><th>Klients</th><th>Pakalpojums</th><th>Statuss</th><th>Avots</th><th>Datums</th></tr>
          </thead>
          <tbody>
            <tr style="background:#eff6ff">
              <td><div class="name">Niks Kevins</div><div class="meta">25547113 · nikskevinsm@gmail.com</div></td>
              <td>Mājaslapa</td>
              <td><span class="badge">Jauns</span></td>
              <td><span class="mono">widget_lead_form</span></td>
              <td style="color:var(--muted-fg)">13.08.2026., 09:01</td>
            </tr>
            <tr>
              <td><div class="name">Anna Bērziņa</div><div class="meta">29111222 · anna@example.lv</div></td>
              <td>SEO audits</td>
              <td><span class="badge primary">Kvalificēts</span></td>
              <td><span class="mono">chat_extract</span></td>
              <td style="color:var(--muted-fg)">18.08.2026., 11:28</td>
            </tr>
            <tr>
              <td><div class="name">Jānis Ozols</div><div class="meta">20033445 · janis@firma.lv</div></td>
              <td>Konsultācija</td>
              <td><span class="badge">Kontaktēts</span></td>
              <td><span class="mono">widget_lead_form</span></td>
              <td style="color:var(--muted-fg)">20.08.2026., 16:44</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p style="margin:12px 0 0;font-size:12px;color:var(--muted-fg)">Padoms: klikšķiniet jebkurā rindas vietā, lai atvērtu lead detaļas.</p>`,
  }),

  "knowledge-index.png": shell({
    active: "knowledge",
    title: "Mājaslapa",
    subtitle: "Indeksācija ir viens no zināšanu avotiem — ne vienīgais.",
    body: `
      <div style="margin-top:18px;display:flex;gap:8px;background:var(--muted);padding:6px;border-radius:12px;border:1px solid var(--border);width:fit-content">
        <div class="btn btn-primary" style="padding:8px 12px">Mājaslapa</div>
        <div class="btn" style="background:transparent">Pakalpojumi</div>
        <div class="btn" style="background:transparent">BUJ</div>
        <div class="btn" style="background:transparent">Dokumenti</div>
        <div class="btn" style="background:transparent">Uzņēmums</div>
      </div>
      <div class="grid-2">
        <div class="card">
          <h3 class="display" style="margin:0 0 8px;font-size:18px">Indeksēt vietni</h3>
          <p style="margin:0 0 14px;color:var(--muted-fg);font-size:13px;line-height:1.5">Ievadiet URL — bots izgūs lapas, lai atbildētu precīzāk.</p>
          <div style="font-size:12px;color:var(--muted-fg);margin-bottom:6px">Vietnes URL</div>
          <div style="border:1px solid var(--border);border-radius:10px;padding:11px 12px;margin-bottom:12px">https://tavswebs.com</div>
          <button class="btn btn-primary">Palaist indeksāciju</button>
        </div>
        <div class="card">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:12px">
            <h3 class="display" style="margin:0;font-size:18px">Indeksācijas statuss</h3>
            <span class="badge primary">Notiek</span>
          </div>
          <p style="margin:10px 0 8px;font-size:13px;color:#334155">Apstrādā lapas · 68% · 42s</p>
          <div class="progress"><span></span></div>
          <div class="stats">
            <div class="stat"><div class="k">Atrastās</div><div class="v">24</div></div>
            <div class="stat"><div class="k">Apstrādātās</div><div class="v">16</div></div>
            <div class="stat"><div class="k">Limits</div><div class="v">50</div></div>
          </div>
          <div style="display:flex;gap:8px;margin-top:14px">
            <button class="btn btn-outline">Indeksēt vēlreiz</button>
            <button class="btn" style="background:transparent;color:var(--muted-fg)">Atcelt</button>
          </div>
        </div>
      </div>`,
  }),

  "overview.png": shell({
    active: "overview",
    title: "Pārskats",
    subtitle: "Sveicināti, TavsWebs. Viss būtiskais — vienā vietā.",
    topExtra: `<button class="btn btn-outline">Analītika</button><button class="btn btn-primary">Widget</button>`,
    body: `
      <div class="metrics">
        <div class="metric"><div class="k">Sarunas</div><div class="v">128</div></div>
        <div class="metric"><div class="k">Leadi</div><div class="v">34</div></div>
        <div class="metric"><div class="k">Pieraksti</div><div class="v">9</div></div>
        <div class="metric"><div class="k">Šomēnes</div><div class="v">61%</div></div>
      </div>
      <div class="grid-2">
        <div class="card">
          <h3 class="display" style="margin:0 0 12px;font-size:16px">Sarunas laika gaitā</h3>
          <svg viewBox="0 0 420 140" width="100%" height="140">
            <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#3b82f6" stop-opacity=".35"/><stop offset="100%" stop-color="#3b82f6" stop-opacity="0"/></linearGradient></defs>
            <path d="M0,110 C40,100 70,70 110,78 C150,86 170,40 210,48 C250,56 280,30 320,38 C360,46 390,20 420,28 L420,140 L0,140 Z" fill="url(#g)"/>
            <path d="M0,110 C40,100 70,70 110,78 C150,86 170,40 210,48 C250,56 280,30 320,38 C360,46 390,20 420,28" fill="none" stroke="#3b82f6" stroke-width="3"/>
          </svg>
        </div>
        <div class="card">
          <h3 class="display" style="margin:0 0 8px;font-size:16px">Plāna izmantojums</h3>
          <p style="margin:0 0 10px;font-size:13px;color:var(--muted-fg)">61% no 200 sarunām mēnesī</p>
          <div class="progress"><span style="width:61%"></span></div>
          <div style="margin-top:18px">
            <div style="font-size:13px;font-weight:650;margin-bottom:8px">Iestatīšanas kontrolsaraksts</div>
            <div style="font-size:13px;color:#166534;margin:6px 0">✓ Widget instalēts</div>
            <div style="font-size:13px;color:#166534;margin:6px 0">✓ Zināšanas indeksētas</div>
            <div style="font-size:13px;color:var(--muted-fg);margin:6px 0">○ Google Calendar savienots</div>
          </div>
        </div>
      </div>`,
  }),

  "jaunumi.png": shell({
    active: "overview",
    title: "Jaunumi",
    subtitle: "Detalizēti — kas mainījies un kā to izmantot.",
    body: `
      <div class="card" style="margin-top:22px;padding:0;overflow:hidden;display:grid;grid-template-columns:280px 1fr;min-height:520px">
        <div style="border-right:1px solid var(--border);padding:10px">
          <div style="background:var(--accent);border-radius:10px;padding:12px;margin-bottom:6px">
            <div style="font-weight:700;font-size:14px">Ērtāks panelis</div>
            <div style="font-size:12px;color:var(--muted-fg);margin-top:4px">2026-08-22</div>
          </div>
          <div style="border-radius:10px;padding:12px;color:var(--muted-fg)">
            <div style="font-weight:600;font-size:14px;color:#334155">Leadi no čata</div>
            <div style="font-size:12px;margin-top:4px">2026-08-13</div>
          </div>
          <div style="border-radius:10px;padding:12px;color:var(--muted-fg)">
            <div style="font-weight:600;font-size:14px;color:#334155">Ātrāka indeksācija</div>
            <div style="font-size:12px;margin-top:4px">2026-08-12</div>
          </div>
        </div>
        <div style="padding:28px">
          <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start">
            <div>
              <h2 class="display" style="margin:0;font-size:24px">Ērtāks panelis</h2>
              <p style="margin:8px 0 0;color:var(--muted-fg);font-size:14px;max-width:48ch;line-height:1.5">
                Jaunumi kā lapa, klikšķināmi leadi, oficiālie integrāciju logotipi un sakārtota navigācija.
              </p>
            </div>
            <span class="badge">2026-08-22</span>
          </div>
          <div style="margin-top:20px;border:1px solid var(--border);border-radius:12px;overflow:hidden;background:#f8fafc;height:180px;display:grid;place-items:center;color:var(--muted-fg);font-size:13px">
            Integrācijas · Leadi · Navigācija
          </div>
          <ul style="margin:20px 0 0;padding:0;list-style:none;display:grid;gap:12px">
            <li style="display:flex;gap:10px;font-size:14px;line-height:1.5"><span style="width:6px;height:6px;border-radius:99px;background:var(--primary);margin-top:8px;flex:none"></span>Jaunumi ir atsevišķa lapa ar sarakstu un detaļām — vieglāk atrast konkrētu izmaiņu.</li>
            <li style="display:flex;gap:10px;font-size:14px;line-height:1.5"><span style="width:6px;height:6px;border-radius:99px;background:var(--primary);margin-top:8px;flex:none"></span>Leadu tabulā visa rinda ir klikšķināma, ne tikai klienta vārds.</li>
          </ul>
        </div>
      </div>`,
  }),
};

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1440, height: 960 },
    deviceScaleFactor: 2,
  });

  for (const [filename, html] of Object.entries(pages)) {
    await page.setContent(html, { waitUntil: "networkidle" });
    await page.waitForTimeout(400);
    const shot = path.join(OUT, filename);
    await page.locator("#shot").screenshot({
      path: shot,
      type: "png",
      animations: "disabled",
    });
    console.log("wrote", shot);
  }

  await browser.close();
  await writeFile(
    path.join(OUT, ".generated"),
    `generated ${new Date().toISOString()}\n`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
