// Builds the org home page (https://gift-club.github.io/) into docs/, plus robots.txt, which lists the
// sitemap of every project site (project sites cannot serve their own robots.txt), and a 404 page.
// Run: node scripts/build-site.mjs
import { rmSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { GITHUB_ORG, LANGS, MAIN_SITE, ORGANIZATION, ORG_SITE, SISTER_SITES, esc, mainHome, pageUrl, writeSite } from "./site-kit.mjs";
import content from "../site/content.mjs";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const DOCS = `${ROOT}docs`;

const site = {
  /** The release date: the sitemap lastmod of pages without their own data date. */
  updated: "2026-11-12",
  base: ORG_SITE,
  root: "/",
  repo: GITHUB_ORG,
  langs: LANGS,
  sisterKey: "none",
  name: Object.fromEntries(LANGS.map((l) => [l, "Gift Club"])),
  short: Object.fromEntries(LANGS.map((l) => [l, "open source"])),
};

const pages = LANGS.map((lang) => {
  const c = content[lang];
  const cards = SISTER_SITES.map(
    (s) =>
      `<a class="card" href="${s.path}${lang === "en" ? "" : `${lang}/`}" style="text-decoration:none"><h3>${esc(c.ui.sisters[s.key])}</h3><p>${esc(c.cards[s.key])}</p></a>`,
  ).join("");
  return {
    path: "",
    lang,
    title: c.title,
    description: c.description,
    h1: c.h1,
    lead: esc(c.lead),
    body: `<div class="cards">${cards}</div>
<h2>${esc(c.aboutHeading)}</h2>
<p>${c.about(`<a href="${mainHome(lang)}">Gift Club</a>`)}</p>`,
    jsonLd: [
      { "@context": "https://schema.org", ...ORGANIZATION, logo: `${MAIN_SITE}/favicon.ico` },
      {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "Gift Club open source",
        url: pageUrl(site, lang, ""),
        inLanguage: lang,
        publisher: { "@id": ORGANIZATION["@id"] },
      },
      {
        "@context": "https://schema.org",
        "@type": "ItemList",
        itemListElement: SISTER_SITES.map((s, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: c.ui.sisters[s.key],
          url: `${ORG_SITE}${s.path}${lang === "en" ? "" : `${lang}/`}`,
        })),
      },
    ],
  };
});

rmSync(DOCS, { recursive: true, force: true });
const ui = Object.fromEntries(LANGS.map((l) => [l, { ...content[l].ui, nav: {} }]));
const count = writeSite(DOCS, site, pages, ui);

writeFileSync(
  `${DOCS}/robots.txt`,
  `User-agent: *
Allow: /

Sitemap: ${ORG_SITE}/sitemap.xml
${SISTER_SITES.map((s) => `Sitemap: ${ORG_SITE}${s.path}sitemap.xml`).join("\n")}
`,
);

// GitHub Pages serves 404.html for every missing path on the org domain, project sites included.
writeFileSync(
  `${DOCS}/404.html`,
  `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Page not found · Gift Club</title><meta name="robots" content="noindex">
<style>body{margin:0;background:#0d0b14;color:#f3f0fa;font:16px/1.6 system-ui,sans-serif;display:grid;place-items:center;min-height:100vh;padding:16px;text-align:center}a{color:#8ec5ff}</style></head>
<body><main><h1>Page not found</h1><p>${SISTER_SITES.map((s) => `<a href="${s.path}">${esc(content.en.ui.sisters[s.key])}</a>`).join(" · ")}</p><p><a href="${MAIN_SITE}/">Gift Club</a></p></main></body></html>
`,
);
console.log(`Built ${count} pages into docs/ with robots.txt and 404.html`);
