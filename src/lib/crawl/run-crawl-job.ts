import { CRAWL_CONFIG } from "@/config/crawl";
import { chunkDocument } from "@/lib/crawl/chunk";
import { extractPageContent } from "@/lib/crawl/extract";
import { FetchPageError, fetchPage } from "@/lib/crawl/fetch-page";
import { sha256 } from "@/lib/crawl/hash";
import { loadRobotsTxt } from "@/lib/crawl/robots";
import {
  assertSafePublicUrl,
  normalizeCrawlUrl,
} from "@/lib/crawl/url-safety";
import { prisma } from "@/lib/db";

export type PageFailure = {
  url: string;
  error: string;
};

async function isCanceled(jobId: string): Promise<boolean> {
  const job = await prisma.crawlJob.findUnique({
    where: { id: jobId },
    select: { status: true },
  });
  return job?.status === "CANCELED";
}

/**
 * Full crawl pipeline for one CrawlJob.
 * Safe to run inside Inngest (or local fallback).
 * Embeddings are intentionally not generated here — chunks are prepared only.
 */
export async function runCrawlJob(jobId: string): Promise<void> {
  const job = await prisma.crawlJob.findUnique({
    where: { id: jobId },
    include: { website: true },
  });

  if (!job || job.status === "CANCELED") return;
  if (["COMPLETED", "FAILED"].includes(job.status)) return;

  // Claim the job so Inngest + after() cannot crawl the same QUEUED row twice.
  if (job.status === "QUEUED") {
    const claimed = await prisma.crawlJob.updateMany({
      where: { id: jobId, status: "QUEUED" },
      data: {
        status: "CRAWLING",
        startedAt: job.startedAt ?? new Date(),
        errorMessage: null,
      },
    });
    if (claimed.count === 0) return;
  } else if (job.status === "CRAWLING" || job.status === "PROCESSING") {
    // Another worker already owns this job.
    return;
  }

  const failures: PageFailure[] = [];
  const pageLimit = job.pageLimit;

  try {
    await prisma.website.update({
      where: { id: job.websiteId },
      data: { status: "CRAWLING" },
    });

    const seed = await assertSafePublicUrl(job.website.url);
    const robots = await loadRobotsTxt(seed.url);

    const queue: { url: string; depth: number }[] = [
      { url: seed.url.toString(), depth: 0 },
    ];
    const seen = new Set<string>();
    let processed = 0;
    let discovered = 1;

    await prisma.crawlJob.update({
      where: { id: jobId },
      data: { pagesDiscovered: discovered },
    });

    while (queue.length > 0 && processed < pageLimit) {
      if (await isCanceled(jobId)) return;

      const batch = queue.splice(0, CRAWL_CONFIG.concurrency);
      for (const item of batch) {
        if (processed >= pageLimit) break;
        if (seen.has(item.url)) continue;
        seen.add(item.url);

        if (!robots.isAllowed(item.url)) {
          failures.push({ url: item.url, error: "robots_disallowed" });
          continue;
        }

        if (robots.crawlDelayMs > 0) {
          await new Promise((r) => setTimeout(r, robots.crawlDelayMs));
        }

        try {
          const page = await fetchPage(item.url);
          const extracted = extractPageContent(page.html, page.finalUrl);
          const contentHash = sha256(
            `${extracted.title}\n${extracted.content}`,
          );

          const existing = await prisma.knowledgeDocument.findFirst({
            where: {
              workspaceId: job.workspaceId,
              websiteId: job.websiteId,
              sourceUrl: page.finalUrl,
              type: "WEBSITE_PAGE",
            },
          });

          if (existing && existing.contentHash === contentHash) {
            // Unchanged — skip re-chunk / re-embed preparation
            await prisma.knowledgeDocument.update({
              where: { id: existing.id },
              data: {
                status: "READY",
                metadata: {
                  ...(typeof existing.metadata === "object" &&
                  existing.metadata !== null
                    ? (existing.metadata as object)
                    : {}),
                  category: extracted.category,
                  unchanged: true,
                  lastSeenAt: new Date().toISOString(),
                },
              },
            });
          } else {
            const chunks = chunkDocument(extracted.content);
            const document = existing
              ? await prisma.knowledgeDocument.update({
                  where: { id: existing.id },
                  data: {
                    title: extracted.title,
                    contentHash,
                    rawText: extracted.content,
                    status: "READY",
                    mimeType: "text/html",
                    errorMessage: null,
                    metadata: {
                      category: extracted.category,
                      headings: extracted.headings.slice(0, 30),
                      description: extracted.description,
                      finalUrl: page.finalUrl,
                      unchanged: false,
                    },
                  },
                })
              : await prisma.knowledgeDocument.create({
                  data: {
                    workspaceId: job.workspaceId,
                    websiteId: job.websiteId,
                    type: "WEBSITE_PAGE",
                    status: "READY",
                    title: extracted.title,
                    sourceUrl: page.finalUrl,
                    mimeType: "text/html",
                    contentHash,
                    rawText: extracted.content,
                    metadata: {
                      category: extracted.category,
                      headings: extracted.headings.slice(0, 30),
                      description: extracted.description,
                      finalUrl: page.finalUrl,
                      unchanged: false,
                    },
                  },
                });

            await prisma.knowledgeChunk.deleteMany({
              where: { documentId: document.id },
            });

            if (chunks.length) {
              await prisma.knowledgeChunk.createMany({
                data: chunks.map((chunk) => ({
                  workspaceId: job.workspaceId,
                  documentId: document.id,
                  chunkIndex: chunk.chunkIndex,
                  content: chunk.content,
                  contentHash: sha256(chunk.content),
                  tokenCount: chunk.tokenCount,
                  metadata: chunk.metadata,
                })),
              });
            }
          }

          if (item.depth < CRAWL_CONFIG.maxDepth) {
            for (const href of extracted.links) {
              const next = normalizeCrawlUrl(href, new URL(page.finalUrl));
              if (!next || seen.has(next)) continue;
              if (queue.some((q) => q.url === next)) continue;
              if (discovered >= pageLimit * 3) break;
              queue.push({ url: next, depth: item.depth + 1 });
              discovered += 1;
            }
          }

          if (!job.website.title && extracted.title) {
            await prisma.website.update({
              where: { id: job.websiteId },
              data: { title: extracted.title },
            });
          }
        } catch (error) {
          const message =
            error instanceof FetchPageError
              ? error.code
              : error instanceof Error
                ? error.message
                : "unknown";
          failures.push({ url: item.url, error: message });

          const failedDoc = await prisma.knowledgeDocument.findFirst({
            where: {
              workspaceId: job.workspaceId,
              websiteId: job.websiteId,
              sourceUrl: item.url,
            },
          });

          if (failedDoc) {
            await prisma.knowledgeDocument.update({
              where: { id: failedDoc.id },
              data: { status: "FAILED", errorMessage: message },
            });
          } else {
            await prisma.knowledgeDocument.create({
              data: {
                workspaceId: job.workspaceId,
                websiteId: job.websiteId,
                type: "WEBSITE_PAGE",
                status: "FAILED",
                title: item.url,
                sourceUrl: item.url,
                errorMessage: message,
                metadata: { category: "other" },
              },
            });
          }
        }

        processed += 1;
        await prisma.crawlJob.update({
          where: { id: jobId },
          data: {
            pagesProcessed: processed,
            pagesDiscovered: Math.max(discovered, seen.size + queue.length),
            failureLog: failures.slice(0, 100),
          },
        });
      }
    }

    if (await isCanceled(jobId)) return;

    await prisma.crawlJob.update({
      where: { id: jobId },
      data: {
        status: "PROCESSING",
      },
    });

    // Generate embeddings for changed documents (skips unchanged contentHash).
    const { embedChunksForDocument } = await import(
      "@/services/knowledge/embedding-service"
    );
    const { hasOpenAIKey } = await import("@/services/ai/openai-client");

    if (hasOpenAIKey()) {
      const docs = await prisma.knowledgeDocument.findMany({
        where: {
          workspaceId: job.workspaceId,
          websiteId: job.websiteId,
          status: "READY",
        },
        select: { id: true },
      });
      for (const doc of docs) {
        if (await isCanceled(jobId)) return;
        try {
          await embedChunksForDocument({
            workspaceId: job.workspaceId,
            documentId: doc.id,
          });
        } catch (error) {
          console.error("[crawl] embedding failed", doc.id, error);
        }
      }
    } else {
      console.warn(
        "[crawl] OPENAI_API_KEY missing — chunks stored without embeddings",
      );
    }

    await prisma.crawlJob.update({
      where: { id: jobId },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        pagesProcessed: processed,
        pagesDiscovered: Math.max(discovered, seen.size),
        failureLog: failures.slice(0, 100),
      },
    });

    await prisma.website.update({
      where: { id: job.websiteId },
      data: {
        status: "READY",
        lastCrawledAt: new Date(),
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "crawl_failed";

    await prisma.crawlJob.update({
      where: { id: jobId },
      data: {
        status: "FAILED",
        completedAt: new Date(),
        errorMessage: message,
        failureLog: failures.slice(0, 100),
      },
    });

    await prisma.website.update({
      where: { id: job.websiteId },
      data: { status: "FAILED" },
    });

    throw error;
  }
}
