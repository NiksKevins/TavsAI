import * as cheerio from "cheerio";

export type PageCategory =
  | "home"
  | "services"
  | "about"
  | "contact"
  | "faq"
  | "other";

export type ExtractedPage = {
  title: string;
  content: string;
  headings: string[];
  description: string | null;
  links: string[];
  category: PageCategory;
};

const NOISE_SELECTORS = [
  "script",
  "style",
  "noscript",
  "iframe",
  "svg",
  "canvas",
  "form",
  "nav",
  "footer",
  "header",
  "aside",
  "[role='navigation']",
  "[role='banner']",
  "[role='contentinfo']",
  ".cookie",
  ".cookies",
  "#cookie",
  ".newsletter",
  ".social-share",
  ".share-buttons",
  ".advertisement",
  ".ads",
  ".tracking",
].join(", ");

function classifyPath(pathname: string): PageCategory {
  const p = pathname.toLowerCase();
  if (p === "/" || p === "") return "home";
  if (/faq|jautajum|biezak/.test(p)) return "faq";
  if (/contact|kontakti|sazin/.test(p)) return "contact";
  if (/about|par-mums|par_mums|komanda|team/.test(p)) return "about";
  if (/service|pakalpoj|cenas|price|menu|piedav/.test(p)) return "services";
  return "other";
}

function cleanText(value: string): string {
  return value
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

/**
 * Extract readable text from untrusted HTML.
 * Scripts/styles are stripped; content is treated as DATA only.
 */
export function extractPageContent(html: string, pageUrl: string): ExtractedPage {
  const $ = cheerio.load(html);
  const url = new URL(pageUrl);

  $(NOISE_SELECTORS).remove();
  $("a[href^='javascript:']").remove();

  const title =
    cleanText($("title").first().text()) ||
    cleanText($("h1").first().text()) ||
    url.hostname;

  const description =
    cleanText($('meta[name="description"]').attr("content") ?? "") || null;

  const headings: string[] = [];
  $("h1, h2, h3").each((_, el) => {
    const text = cleanText($(el).text());
    if (text) headings.push(text);
  });

  const main = $("main, article, [role='main'], .content, #content").first();
  const root = main.length ? main : $("body");

  const blocks: string[] = [];

  root.find("h1, h2, h3, h4, p, li, dt, dd, td, th, blockquote, pre").each((_, el) => {
    const tag = el.tagName?.toLowerCase() ?? "";
    const text = cleanText($(el).text());
    if (!text || text.length < 2) return;

    if (/^h[1-4]$/.test(tag)) {
      blocks.push(`\n## ${text}\n`);
    } else if (tag === "li") {
      blocks.push(`- ${text}`);
    } else {
      blocks.push(text);
    }
  });

  // Fallback if structure was sparse
  if (blocks.join("").trim().length < 40) {
    const fallback = cleanText(root.text());
    if (fallback) blocks.push(fallback);
  }

  const content = cleanText(blocks.join("\n"));

  const links: string[] = [];
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (href) links.push(href);
  });

  return {
    title,
    content,
    headings,
    description,
    links,
    category: classifyPath(url.pathname),
  };
}
