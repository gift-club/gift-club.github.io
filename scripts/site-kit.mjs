// Gift Club static site kit: one file, no dependencies, Node 20+.
// Every gift-club.github.io site is built with an identical copy of this file (scripts/site-kit.mjs).
// It writes one folder per language under docs/, with canonical, hreflang, Open Graph, JSON-LD
// and a sitemap, so GitHub Pages can serve docs/ as-is.

import { cpSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

export const ORG_SITE = "https://gift-club.github.io";
export const GITHUB_ORG = "https://github.com/gift-club";
export const MAIN_SITE = "https://giftclub.app";

export const LANGS = ["en", "ru", "uk", "es", "pl", "it", "tr", "de", "fr"];

export const LANG_NAMES = {
  en: "English",
  ru: "Русский",
  uk: "Українська",
  es: "Español",
  pl: "Polski",
  it: "Italiano",
  tr: "Türkçe",
  de: "Deutsch",
  fr: "Français",
};

/** Open Graph locale codes. */
const OG_LOCALE = {
  en: "en_US",
  ru: "ru_RU",
  uk: "uk_UA",
  es: "es_ES",
  pl: "pl_PL",
  it: "it_IT",
  tr: "tr_TR",
  de: "de_DE",
  fr: "fr_FR",
};

/** giftclub.app home page for a language: English at the root, every other language under its prefix. */
export const mainHome = (lang) => (lang === "en" ? `${MAIN_SITE}/` : `${MAIN_SITE}/${lang}/`);

/** The Gift Club sites on gift-club.github.io, for the cross-links in every footer. */
export const SISTER_SITES = [
  { key: "dataset", path: "/telegram-gifts-dataset/" },
  { key: "calculator", path: "/telegram-stars-calculator/" },
  { key: "verifier", path: "/provably-fair-verifier/" },
];

export const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

/** The public URL of `path` ("" or "stars-prices/") on a site in a language. */
export const pageUrl = (site, lang, path = "") => `${site.base}/${lang === "en" ? "" : `${lang}/`}${path}`;

/** The same, relative to the site root, for links between pages of one site. */
const localHref = (site, lang, path = "") => `${site.root}${lang === "en" ? "" : `${lang}/`}${path}`;

const CSS = `
:root{color-scheme:dark;--bg:#0d0b14;--panel:#17141f;--line:#2a2535;--ink:#f3f0fa;--muted:#a59fb5;--accent:#ffcf4a;--link:#8ec5ff}
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.6 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
a{color:var(--link)}
a:hover{text-decoration-thickness:2px}
.wrap{max-width:860px;margin:0 auto;padding:0 16px}
header{border-bottom:1px solid var(--line)}
header .wrap{display:flex;flex-wrap:wrap;gap:8px 16px;align-items:center;justify-content:space-between;padding-top:14px;padding-bottom:14px}
.brand{display:inline-flex;align-items:center;gap:10px;font-weight:700;color:var(--ink);text-decoration:none}
.brand img{display:block;width:32px;height:32px;border-radius:8px}
.brand em{font-style:normal;color:var(--accent)}
nav ul{display:flex;flex-wrap:wrap;gap:6px 14px;list-style:none;margin:0;padding:0;font-size:15px}
nav a{color:var(--muted);text-decoration:none}
nav a[aria-current=page]{color:var(--ink);font-weight:600}
main{padding:28px 0 40px}
h1{font-size:clamp(28px,5vw,40px);line-height:1.15;margin:0 0 12px}
h2{font-size:24px;line-height:1.25;margin:36px 0 10px}
h3{font-size:19px;margin:24px 0 8px}
.lead{font-size:18px;color:var(--ink)}
.meta{color:var(--muted);font-size:14px}
.answer{background:var(--panel);border:1px solid var(--line);border-left:4px solid var(--accent);border-radius:10px;padding:14px 16px;margin:18px 0}
.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;margin:16px 0}
.card{background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:14px 16px}
.card h3{margin:0 0 6px;font-size:17px}
.card p{margin:0;color:var(--muted);font-size:15px}
.table-wrap{overflow-x:auto;margin:12px 0;border:1px solid var(--line);border-radius:10px}
table{border-collapse:collapse;width:100%;font-size:15px}
th,td{padding:8px 10px;border-bottom:1px solid var(--line);text-align:left;white-space:nowrap}
pre,code{overflow-wrap:anywhere}
pre{white-space:pre}
th{background:var(--panel);position:sticky;top:0}
td.num,th.num{text-align:right;font-variant-numeric:tabular-nums}
tr:last-child td{border-bottom:0}
caption{caption-side:top;text-align:left;padding:8px 10px;color:var(--muted);font-size:14px}
code,pre{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:14px}
code{background:var(--panel);padding:1px 5px;border-radius:5px}
pre{background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:12px 14px;overflow-x:auto}
pre code{background:none;padding:0}
details{background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:10px 14px;margin:8px 0}
summary{cursor:pointer;font-weight:600}
.langs{display:flex;flex-wrap:wrap;gap:4px 12px;font-size:14px;color:var(--muted)}
.langs a{color:var(--muted)}
.langs a[aria-current=true]{color:var(--ink);font-weight:600;text-decoration:none}
footer{border-top:1px solid var(--line);padding:24px 0 40px;color:var(--muted);font-size:14px}
footer p{margin:6px 0}
iframe{max-width:100%}
`;

/**
 * One HTML page.
 * site: { base, root, name, repo, langs, sisterKey }
 * page: { path, nav?, lang, title, description, h1, lead?, body, jsonLd?, noindex?, updated? }
 * ui:   per-language strings: { skip, navLabel, langsLabel, footerBy, footerTag, sourceOnGithub, moreLabel, sisters: {dataset, calculator, verifier}, updated, licence }
 */
export const renderPage = (site, page, allPaths, ui) => {
  const { lang } = page;
  const url = pageUrl(site, lang, page.path);
  const alternates = site.langs.filter((l) => allPaths[page.path]?.includes(l));
  const hreflang = page.noindex
    ? ""
    : [
        ...alternates.map((l) => `<link rel="alternate" hreflang="${l}" href="${pageUrl(site, l, page.path)}">`),
        alternates.includes("en") ? `<link rel="alternate" hreflang="x-default" href="${pageUrl(site, "en", page.path)}">` : "",
      ].join("\n");
  const jsonLd = (page.jsonLd ?? [])
    .map((obj) => `<script type="application/ld+json">${JSON.stringify(obj).replace(/</g, "\\u003c")}</script>`)
    .join("\n");
  const nav = (site.nav ?? [])
    .filter((n) => allPaths[n.path]?.includes(lang))
    .map(
      (n) =>
        `<li><a href="${localHref(site, lang, n.path)}"${n.path === page.path ? ' aria-current="page"' : ""}>${esc(ui.nav[n.key])}</a></li>`,
    )
    .join("");
  const langLinks = alternates
    .map(
      (l) =>
        `<a href="${localHref(site, l, page.path)}" hreflang="${l}" lang="${l}"${l === lang ? ' aria-current="true"' : ""}>${LANG_NAMES[l]}</a>`,
    )
    .join("");
  const sisters = SISTER_SITES.filter((s) => s.key !== site.sisterKey)
    .map((s) => `<a href="${s.path}${lang === "en" ? "" : `${lang}/`}">${esc(ui.sisters[s.key])}</a>`)
    .join(" · ");

  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(page.title)}</title>
<meta name="description" content="${esc(page.description)}">
${page.noindex ? '<meta name="robots" content="noindex,follow">' : `<link rel="canonical" href="${url}">`}
${hreflang}
<meta property="og:type" content="website">
<meta property="og:site_name" content="${esc(site.name[lang] ?? site.name.en)}">
<meta property="og:title" content="${esc(page.title)}">
<meta property="og:description" content="${esc(page.description)}">
<meta property="og:url" content="${url}">
<meta property="og:locale" content="${OG_LOCALE[lang]}">
<meta name="twitter:card" content="summary">
<meta name="theme-color" content="#0d0b14">
<link rel="icon" href="${site.root}favicon.ico" sizes="any">
<link rel="icon" type="image/png" sizes="32x32" href="${site.root}favicon-32.png">
<link rel="icon" type="image/png" sizes="192x192" href="${site.root}icon-192.png">
<link rel="apple-touch-icon" href="${site.root}apple-touch-icon.png">
<style>${CSS.trim()}</style>
${jsonLd}
</head>
<body>
<header><div class="wrap">
<a class="brand" href="${localHref(site, lang)}"><img src="${site.root}logo-64.png" width="32" height="32" alt=""><span>Gift Club <em>${esc(site.short[lang] ?? site.short.en)}</em></span></a>
${nav ? `<nav aria-label="${esc(ui.navLabel)}"><ul>${nav}</ul></nav>` : ""}
</div></header>
<main><div class="wrap">
<h1>${esc(page.h1)}</h1>
${page.lead ? `<p class="lead">${page.lead}</p>` : ""}
${page.updated ? `<p class="meta">${esc(ui.updated)}: <time datetime="${page.updated}">${page.updated}</time></p>` : ""}
${page.body}
</div></main>
<footer><div class="wrap">
${langLinks ? `<p class="langs" aria-label="${esc(ui.langsLabel)}">${langLinks}</p>` : ""}
<p>${ui.footerBy(`<a href="${mainHome(lang)}">Gift Club</a>`)}</p>
<p>${esc(ui.moreLabel)}: ${sisters} · <a href="${site.repo}">${esc(ui.sourceOnGithub)}</a></p>
${site.licence ? `<p>${site.licence[lang] ?? site.licence.en}</p>` : ""}
</div></footer>
</body>
</html>
`;
};

/** Writes every page to outDir/<lang>/<path>/index.html, plus sitemap.xml and .nojekyll. */
export const writeSite = (outDir, site, pages, uiByLang) => {
  const allPaths = {};
  for (const p of pages) (allPaths[p.path] ??= []).push(p.lang);
  for (const p of pages) {
    const file = join(outDir, p.lang === "en" ? "" : p.lang, p.path, "index.html");
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, renderPage(site, p, allPaths, uiByLang[p.lang]));
  }
  const urls = pages
    .filter((p) => !p.noindex)
    .map((p) => {
      const alts = site.langs
        .filter((l) => allPaths[p.path].includes(l))
        .map((l) => `    <xhtml:link rel="alternate" hreflang="${l}" href="${pageUrl(site, l, p.path)}"/>`)
        .join("\n");
      // lastmod only from a real date (the page's data or the site's release), never the build day.
      const lastmod = p.updated ?? site.updated;
      const xDefault = allPaths[p.path].includes("en")
        ? `\n    <xhtml:link rel="alternate" hreflang="x-default" href="${pageUrl(site, "en", p.path)}"/>`
        : "";
      return `  <url>\n    <loc>${pageUrl(site, p.lang, p.path)}</loc>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ""}\n${alts}${xDefault}\n  </url>`;
    })
    .join("\n");
  writeFileSync(
    join(outDir, "sitemap.xml"),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls}\n</urlset>\n`,
  );
  writeFileSync(join(outDir, ".nojekyll"), "");
  // The logo and icons: site/brand/ beside docs/, copied to the site root.
  const brand = join(dirname(outDir), "site", "brand");
  if (existsSync(brand)) cpSync(brand, outDir, { recursive: true });
  return pages.length;
};

/** schema.org Organization for Gift Club, used as creator/publisher everywhere. */
export const ORGANIZATION = {
  "@type": "Organization",
  "@id": `${MAIN_SITE}/#organization`,
  name: "Gift Club",
  url: `${MAIN_SITE}/`,
  sameAs: [GITHUB_ORG, `${ORG_SITE}/`],
};

export const breadcrumbs = (items) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: it.url })),
});

const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: "\u00a0", rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“", mdash: "—", ndash: "–", hellip: "…" };

/** HTML to plain text for JSON-LD: tags dropped, entities decoded. */
const plainText = (html) =>
  html
    .replace(/<[^>]+>/g, "")
    .replace(/&#x([0-9a-f]+);/gi, (m, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (m, d) => String.fromCodePoint(Number(d)))
    .replace(/&([a-z]+);/gi, (m, e) => ENTITIES[e.toLowerCase()] ?? m);

export const faqPage = (faq) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faq.map(({ q, a }) => ({
    "@type": "Question",
    name: q,
    acceptedAnswer: { "@type": "Answer", text: plainText(a) },
  })),
});

/** FAQ as HTML details blocks; the same entries feed faqPage(). */
export const faqHtml = (heading, faq) =>
  `<h2>${esc(heading)}</h2>\n${faq.map(({ q, a }) => `<details><summary>${esc(q)}</summary><p>${a}</p></details>`).join("\n")}`;

/** A table from headers and rows; `num` marks right-aligned numeric columns by index. */
export const table = ({ caption, headers, rows, num = [] }) =>
  `<div class="table-wrap"><table>${caption ? `<caption>${esc(caption)}</caption>` : ""}<thead><tr>${headers
    .map((h, i) => `<th scope="col"${num.includes(i) ? ' class="num"' : ""}>${esc(h)}</th>`)
    .join("")}</tr></thead><tbody>${rows
    .map((r) => `<tr>${r.map((c, i) => `<td${num.includes(i) ? ' class="num"' : ""}>${c ?? "—"}</td>`).join("")}</tr>`)
    .join("")}</tbody></table></div>`;

/** Number formatting per language. */
export const fmtNum = (lang, n, digits = 0) =>
  new Intl.NumberFormat(lang === "uk" ? "uk-UA" : lang, { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(n);
