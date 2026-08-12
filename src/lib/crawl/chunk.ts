import { CRAWL_CONFIG } from "@/config/crawl";
import { estimateTokens } from "@/lib/crawl/hash";

export type TextChunk = {
  chunkIndex: number;
  content: string;
  tokenCount: number;
  metadata: {
    heading?: string;
  };
};

/**
 * Heading-aware semantic chunking.
 * Prefer keeping a heading with its following paragraphs; split oversized sections
 * on paragraph boundaries rather than fixed character slices.
 */
export function chunkDocument(text: string): TextChunk[] {
  const cleaned = text.trim();
  if (!cleaned) return [];

  const sections = splitIntoSections(cleaned);
  const rawChunks: { content: string; heading?: string }[] = [];

  for (const section of sections) {
    const tokens = estimateTokens(section.body);
    if (tokens <= CRAWL_CONFIG.maxChunkTokens) {
      const content = section.heading
        ? `${section.heading}\n\n${section.body}`.trim()
        : section.body;
      rawChunks.push({ content, heading: section.heading });
      continue;
    }

    const parts = splitByParagraphs(section.body, CRAWL_CONFIG.targetChunkTokens);
    for (const part of parts) {
      const content = section.heading
        ? `${section.heading}\n\n${part}`.trim()
        : part;
      rawChunks.push({ content, heading: section.heading });
    }
  }

  // Merge tiny trailing chunks into previous when possible
  const merged: { content: string; heading?: string }[] = [];
  for (const chunk of rawChunks) {
    const prev = merged[merged.length - 1];
    if (
      prev &&
      estimateTokens(chunk.content) < CRAWL_CONFIG.minChunkTokens &&
      estimateTokens(prev.content) + estimateTokens(chunk.content) <=
        CRAWL_CONFIG.maxChunkTokens
    ) {
      prev.content = `${prev.content}\n\n${chunk.content}`.trim();
      continue;
    }
    merged.push({ ...chunk });
  }

  return merged.map((chunk, index) => ({
    chunkIndex: index,
    content: chunk.content,
    tokenCount: estimateTokens(chunk.content),
    metadata: chunk.heading ? { heading: chunk.heading } : {},
  }));
}

function splitIntoSections(text: string): { heading?: string; body: string }[] {
  const lines = text.split(/\n/);
  const sections: { heading?: string; body: string }[] = [];
  let currentHeading: string | undefined;
  let bodyLines: string[] = [];

  const flush = () => {
    const body = bodyLines.join("\n").trim();
    if (!body && !currentHeading) return;
    sections.push({
      heading: currentHeading,
      body: body || currentHeading || "",
    });
    bodyLines = [];
  };

  for (const line of lines) {
    if (/^##\s+/.test(line)) {
      flush();
      currentHeading = line.replace(/^##\s+/, "").trim();
      continue;
    }
    bodyLines.push(line);
  }
  flush();

  return sections.length ? sections : [{ body: text }];
}

function splitByParagraphs(text: string, targetTokens: number): string[] {
  const paragraphs = text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const parts: string[] = [];
  let current = "";

  for (const paragraph of paragraphs) {
    const next = current ? `${current}\n\n${paragraph}` : paragraph;
    if (estimateTokens(next) > targetTokens && current) {
      parts.push(current);
      current = paragraph;
    } else {
      current = next;
    }
  }
  if (current) parts.push(current);

  // Hard-split remaining oversized paragraphs
  return parts.flatMap((part) => {
    if (estimateTokens(part) <= CRAWL_CONFIG.maxChunkTokens) return [part];
    const out: string[] = [];
    let remaining = part;
    while (estimateTokens(remaining) > CRAWL_CONFIG.maxChunkTokens) {
      const cut = Math.min(remaining.length, CRAWL_CONFIG.maxChunkTokens * 4);
      let at = remaining.lastIndexOf(" ", cut);
      if (at < cut * 0.5) at = cut;
      out.push(remaining.slice(0, at).trim());
      remaining = remaining.slice(at).trim();
    }
    if (remaining) out.push(remaining);
    return out;
  });
}
