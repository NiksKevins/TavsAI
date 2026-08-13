import { z } from "zod";

import { prisma } from "@/lib/db";
import { getDocumentCategory } from "@/lib/knowledge/queries";
import { getOpenAIClient, hasOpenAIKey } from "@/services/ai/openai-client";
import { syncFaqKnowledge, syncServiceKnowledge } from "@/services/knowledge/sync-service";

const CRAWL_SOURCE_MARKER = "__source:crawl__";

const extractedServiceSchema = z.object({
  nameLv: z.string().trim().min(2).max(160),
  descriptionLv: z.string().trim().max(2000).optional().nullable(),
  priceFrom: z.number().nonnegative().max(1_000_000).optional().nullable(),
  duration: z.string().trim().max(80).optional().nullable(),
  category: z.string().trim().max(80).optional().nullable(),
});

const extractedFaqSchema = z.object({
  questionLv: z.string().trim().min(5).max(300),
  answerLv: z.string().trim().min(5).max(4000),
  category: z.string().trim().max(80).optional().nullable(),
});

const extractionSchema = z.object({
  services: z.array(extractedServiceSchema).max(40).default([]),
  faqs: z.array(extractedFaqSchema).max(40).default([]),
});

export type CrawlImportResult = {
  servicesCreated: number;
  servicesUpdated: number;
  faqsCreated: number;
  faqsUpdated: number;
};

function normalizeName(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function isCrawlManagedNotes(notes: string | null | undefined): boolean {
  return Boolean(notes?.includes(CRAWL_SOURCE_MARKER));
}

function crawlNotes(extra?: string | null): string {
  return [CRAWL_SOURCE_MARKER, extra?.trim()].filter(Boolean).join("\n");
}

/** Heading / price heuristics when OpenAI is unavailable. */
function heuristicServices(rawText: string): z.infer<typeof extractedServiceSchema>[] {
  const blocks = rawText
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter((b) => b.length >= 8 && b.length <= 800);

  const out: z.infer<typeof extractedServiceSchema>[] = [];
  const seen = new Set<string>();

  for (const block of blocks) {
    const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
    if (!lines.length) continue;
    const nameLv = lines[0].replace(/^[-•*\d.)\s]+/, "").slice(0, 160);
    if (nameLv.length < 3 || nameLv.length > 80) continue;
    if (/^(sveiki|hello|kontakti|par mums|cookie)/i.test(nameLv)) continue;

    const priceMatch = block.match(
      /(?:no\s+)?(?:€|EUR)?\s*(\d+(?:[.,]\d{1,2})?)\s*(?:€|EUR)?/i,
    );
    const priceFrom = priceMatch
      ? Number(priceMatch[1].replace(",", "."))
      : null;

    const key = normalizeName(nameLv);
    if (seen.has(key)) continue;
    seen.add(key);

    out.push({
      nameLv,
      descriptionLv: lines.slice(1).join(" ").slice(0, 600) || null,
      priceFrom: Number.isFinite(priceFrom) ? priceFrom : null,
      duration: null,
      category: null,
    });
    if (out.length >= 25) break;
  }

  return out;
}

function heuristicFaqs(rawText: string): z.infer<typeof extractedFaqSchema>[] {
  const out: z.infer<typeof extractedFaqSchema>[] = [];
  const parts = rawText.split(/\n(?=[^\n]{8,160}\?\s*$)/m);
  for (const part of parts) {
    const lines = part
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length < 2) continue;
    const questionLv = lines[0];
    if (!questionLv.endsWith("?")) continue;
    const answerLv = lines.slice(1).join(" ").slice(0, 2000);
    if (answerLv.length < 5) continue;
    out.push({ questionLv: questionLv.slice(0, 300), answerLv, category: null });
    if (out.length >= 25) break;
  }
  return out;
}

async function extractWithOpenAI(params: {
  title: string;
  url: string | null;
  category: string;
  text: string;
}): Promise<z.infer<typeof extractionSchema>> {
  const client = getOpenAIClient();
  const truncated = params.text.slice(0, 12_000);
  const completion = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL_EXTRACT?.trim() || "gpt-4o-mini",
    temperature: 0,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "Extract business services and FAQs from website page text. Return JSON only: {\"services\":[{\"nameLv\",\"descriptionLv\",\"priceFrom\",\"duration\",\"category\"}],\"faqs\":[{\"questionLv\",\"answerLv\",\"category\"}]}. Use Latvian when the page is Latvian. Skip navigation, cookies, and marketing fluff. priceFrom must be a number in EUR or null. If none found, return empty arrays.",
      },
      {
        role: "user",
        content: JSON.stringify({
          title: params.title,
          url: params.url,
          category: params.category,
          text: truncated,
        }),
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { services: [], faqs: [] };
  }
  const result = extractionSchema.safeParse(parsed);
  return result.success ? result.data : { services: [], faqs: [] };
}

/**
 * Turn crawled website pages into editable Service / FAQ rows.
 * Only creates/updates crawl-managed rows (notes contain __source:crawl__).
 * Manual entries are left untouched.
 */
export async function importStructuredKnowledgeFromCrawl(
  workspaceId: string,
): Promise<CrawlImportResult> {
  const docs = await prisma.knowledgeDocument.findMany({
    where: {
      workspaceId,
      type: "WEBSITE_PAGE",
      status: "READY",
      rawText: { not: null },
    },
    select: {
      id: true,
      title: true,
      sourceUrl: true,
      rawText: true,
      metadata: true,
    },
    take: 80,
  });

  const relevant = docs.filter((doc) => {
    const category = getDocumentCategory(doc.metadata);
    return (
      category === "services" ||
      category === "faq" ||
      category === "home" ||
      category === "other"
    );
  });

  const serviceMap = new Map<string, z.infer<typeof extractedServiceSchema>>();
  const faqMap = new Map<string, z.infer<typeof extractedFaqSchema>>();

  for (const doc of relevant) {
    const text = doc.rawText?.trim();
    if (!text || text.length < 40) continue;
    const category = getDocumentCategory(doc.metadata);

    let extracted: z.infer<typeof extractionSchema> = {
      services: [],
      faqs: [],
    };

    if (hasOpenAIKey()) {
      try {
        extracted = await extractWithOpenAI({
          title: doc.title,
          url: doc.sourceUrl,
          category,
          text,
        });
      } catch (error) {
        console.error("[crawl-import] openai extract failed", doc.id, error);
      }
    }

    if (
      extracted.services.length === 0 &&
      (category === "services" || category === "home")
    ) {
      extracted.services = heuristicServices(text);
    }
    if (extracted.faqs.length === 0 && category === "faq") {
      extracted.faqs = heuristicFaqs(text);
    }

    if (category === "faq") {
      extracted.services = [];
    }
    if (category === "services") {
      // keep faqs if model found them on a services page
    }

    for (const service of extracted.services) {
      serviceMap.set(normalizeName(service.nameLv), service);
    }
    for (const faq of extracted.faqs) {
      faqMap.set(normalizeName(faq.questionLv), faq);
    }
  }

  let servicesCreated = 0;
  let servicesUpdated = 0;
  let faqsCreated = 0;
  let faqsUpdated = 0;

  const existingServices = await prisma.service.findMany({
    where: { workspaceId },
    select: {
      id: true,
      nameLv: true,
      notes: true,
    },
  });
  const serviceByName = new Map(
    existingServices.map((s) => [normalizeName(s.nameLv), s]),
  );

  let sortOrder = 0;
  for (const service of serviceMap.values()) {
    const key = normalizeName(service.nameLv);
    const existing = serviceByName.get(key);
    if (existing && !isCrawlManagedNotes(existing.notes)) {
      // Manual service with same name — do not overwrite.
      continue;
    }

    if (existing) {
      await prisma.service.update({
        where: { id: existing.id },
        data: {
          descriptionLv: service.descriptionLv ?? null,
          priceFrom: service.priceFrom ?? null,
          duration: service.duration ?? null,
          category: service.category ?? null,
          notes: crawlNotes(),
          isActive: true,
          sortOrder,
        },
      });
      await syncServiceKnowledge(workspaceId, existing.id);
      servicesUpdated += 1;
    } else {
      const created = await prisma.service.create({
        data: {
          workspaceId,
          nameLv: service.nameLv,
          descriptionLv: service.descriptionLv ?? null,
          priceFrom: service.priceFrom ?? null,
          duration: service.duration ?? null,
          category: service.category ?? null,
          notes: crawlNotes(),
          isActive: true,
          sortOrder,
        },
      });
      await syncServiceKnowledge(workspaceId, created.id);
      servicesCreated += 1;
    }
    sortOrder += 1;
  }

  const existingFaqs = await prisma.fAQ.findMany({
    where: { workspaceId },
    select: { id: true, questionLv: true, category: true },
  });
  // FAQs have no notes field — treat crawl-managed as category starting with crawl:
  const faqByQuestion = new Map(
    existingFaqs.map((f) => [normalizeName(f.questionLv), f]),
  );

  let faqSort = 0;
  for (const faq of faqMap.values()) {
    const key = normalizeName(faq.questionLv);
    const existing = faqByQuestion.get(key);
    const crawlCategory = faq.category
      ? `crawl:${faq.category}`
      : "crawl:imported";

    if (existing) {
      // Manual FAQs keep a non-crawl category — leave them alone.
      if (existing.category && !existing.category.startsWith("crawl:")) {
        continue;
      }

      await prisma.fAQ.update({
        where: { id: existing.id },
        data: {
          answerLv: faq.answerLv,
          category: crawlCategory,
          isActive: true,
          sortOrder: faqSort,
        },
      });
      await syncFaqKnowledge(workspaceId, existing.id);
      faqsUpdated += 1;
    } else {
      const created = await prisma.fAQ.create({
        data: {
          workspaceId,
          questionLv: faq.questionLv,
          answerLv: faq.answerLv,
          category: crawlCategory,
          isActive: true,
          sortOrder: faqSort,
        },
      });
      await syncFaqKnowledge(workspaceId, created.id);
      faqsCreated += 1;
    }
    faqSort += 1;
  }

  return {
    servicesCreated,
    servicesUpdated,
    faqsCreated,
    faqsUpdated,
  };
}
