/**
 * Lightweight sanity checks for crawl helpers.
 * Run: npx tsx src/lib/crawl/self-check.ts
 */
import { chunkDocument } from "@/lib/crawl/chunk";
import { extractPageContent } from "@/lib/crawl/extract";
import {
  assertSafePublicUrl,
  normalizeWebsiteUrl,
  UnsafeUrlError,
} from "@/lib/crawl/url-safety";

async function expectReject(url: string, label: string) {
  try {
    await assertSafePublicUrl(url);
    throw new Error(`Expected reject: ${label}`);
  } catch (error) {
    if (!(error instanceof UnsafeUrlError)) throw error;
    console.log("ok reject", label, error.message);
  }
}

async function main() {
  console.log(normalizeWebsiteUrl("Example.LV/path/#frag"));

  await expectReject("http://127.0.0.1/", "loopback");
  await expectReject("http://localhost/", "localhost");
  await expectReject("http://192.168.1.1/", "private");
  await expectReject("ftp://example.com/", "protocol");

  const extracted = extractPageContent(
    `<html><head><title>Demo</title><script>alert(1)</script></head>
     <body><nav>Menu</nav><main><h1>Hello</h1><p>World</p><a href="/about">About</a></main></body></html>`,
    "https://example.com/",
  );
  if (extracted.content.includes("alert")) throw new Error("script leaked");
  if (!extracted.content.includes("World")) throw new Error("missing content");
  console.log("ok extract", extracted.title, extracted.category);

  const chunks = chunkDocument("## Services\n\nWe offer A.\n\n## About\n\nWe are B.");
  if (chunks.length < 1) throw new Error("no chunks");
  console.log("ok chunks", chunks.length);

  console.log("self-check passed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
