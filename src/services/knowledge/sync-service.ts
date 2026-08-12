import type { KnowledgeDocumentType, Prisma } from "@prisma/client";

import { sha256 } from "@/lib/crawl/hash";
import { chunkDocument } from "@/lib/crawl/chunk";
import { prisma } from "@/lib/db";
import { embedChunksForDocument } from "@/services/knowledge/embedding-service";

type SyncResult = {
  documentId: string;
  embedded: number;
  skipped: number;
};

async function replaceDocumentChunks(params: {
  workspaceId: string;
  documentId: string;
  text: string;
  metadata?: Prisma.InputJsonValue;
}) {
  const chunks = chunkDocument(params.text);
  await prisma.knowledgeChunk.deleteMany({
    where: { documentId: params.documentId, workspaceId: params.workspaceId },
  });

  if (chunks.length === 0) {
    await prisma.knowledgeDocument.update({
      where: { id: params.documentId },
      data: { status: "FAILED", errorMessage: "empty_content" },
    });
    return { embedded: 0, skipped: 0 };
  }

  await prisma.knowledgeChunk.createMany({
    data: chunks.map((chunk) => ({
      workspaceId: params.workspaceId,
      documentId: params.documentId,
      chunkIndex: chunk.chunkIndex,
      content: chunk.content,
      contentHash: sha256(chunk.content),
      tokenCount: chunk.tokenCount,
      metadata: {
        ...(chunk.metadata ?? {}),
        ...(params.metadata && typeof params.metadata === "object"
          ? (params.metadata as object)
          : {}),
      },
    })),
  });

  await prisma.knowledgeDocument.update({
    where: { id: params.documentId },
    data: {
      status: "READY",
      contentHash: sha256(params.text),
      rawText: params.text,
      errorMessage: null,
    },
  });

  try {
    return await embedChunksForDocument({
      workspaceId: params.workspaceId,
      documentId: params.documentId,
    });
  } catch (error) {
    console.error("[knowledge/embed]", error);
    return { embedded: 0, skipped: 0 };
  }
}

async function upsertTypedDocument(params: {
  workspaceId: string;
  type: KnowledgeDocumentType;
  entityKey: string;
  title: string;
  text: string;
  metadata?: Record<string, unknown>;
}): Promise<SyncResult> {
  const existing = await prisma.knowledgeDocument.findFirst({
    where: {
      workspaceId: params.workspaceId,
      type: params.type,
      metadata: { path: ["entityKey"], equals: params.entityKey },
    },
  });

  const hash = sha256(params.text);
  const meta = {
    ...(params.metadata ?? {}),
    entityKey: params.entityKey,
    source: params.type,
  };

  let documentId: string;
  if (existing) {
    if (existing.contentHash === hash && existing.status === "READY") {
      const embed = await embedChunksForDocument({
        workspaceId: params.workspaceId,
        documentId: existing.id,
      });
      return { documentId: existing.id, ...embed };
    }
    documentId = existing.id;
    await prisma.knowledgeDocument.update({
      where: { id: existing.id },
      data: {
        title: params.title,
        status: "PROCESSING",
        metadata: meta,
        mimeType: "text/plain",
      },
    });
  } else {
    const created = await prisma.knowledgeDocument.create({
      data: {
        workspaceId: params.workspaceId,
        type: params.type,
        title: params.title,
        status: "PROCESSING",
        mimeType: "text/plain",
        metadata: meta,
      },
    });
    documentId = created.id;
  }

  const result = await replaceDocumentChunks({
    workspaceId: params.workspaceId,
    documentId,
    text: params.text,
    metadata: meta,
  });

  return { documentId, ...result };
}

export async function syncBusinessInformationKnowledge(
  workspaceId: string,
): Promise<SyncResult | null> {
  const business = await prisma.businessInformation.findUnique({
    where: { workspaceId },
  });
  if (!business) return null;

  const hours =
    business.openingHours && typeof business.openingHours === "object"
      ? JSON.stringify(business.openingHours)
      : null;
  const social =
    business.socialLinks && typeof business.socialLinks === "object"
      ? JSON.stringify(business.socialLinks)
      : null;

  const lines = [
    `Business name: ${business.displayName || business.legalName || ""}`,
    business.description ? `Description: ${business.description}` : null,
    business.phone ? `Phone: ${business.phone}` : null,
    business.email ? `Email: ${business.email}` : null,
    business.address || business.city
      ? `Address: ${[business.address, business.city, business.country]
          .filter(Boolean)
          .join(", ")}`
      : null,
    business.websiteUrl ? `Website: ${business.websiteUrl}` : null,
    business.languages?.length
      ? `Languages: ${business.languages.join(", ")}`
      : null,
    hours ? `Opening hours: ${hours}` : null,
    social ? `Social links: ${social}` : null,
    business.policies ? `Policies: ${business.policies}` : null,
  ].filter(Boolean);

  if (lines.length === 0) return null;

  return upsertTypedDocument({
    workspaceId,
    type: "BUSINESS_INFORMATION",
    entityKey: `business:${workspaceId}`,
    title: business.displayName || "Business information",
    text: lines.join("\n"),
    metadata: { kind: "business_information" },
  });
}

export async function syncServiceKnowledge(
  workspaceId: string,
  serviceId: string,
): Promise<SyncResult | null> {
  const service = await prisma.service.findFirst({
    where: { id: serviceId, workspaceId },
  });
  if (!service) return null;

  if (!service.isActive) {
    await prisma.knowledgeDocument.deleteMany({
      where: {
        workspaceId,
        type: "SERVICE",
        metadata: { path: ["entityKey"], equals: `service:${serviceId}` },
      },
    });
    return null;
  }

  const price =
    service.priceFrom != null
      ? `Price: from ${service.priceFrom}${service.currency}${
          service.priceTo != null ? ` to ${service.priceTo}${service.currency}` : ""
        }`
      : null;

  const text = [
    `Service: ${service.nameLv}${service.nameEn ? ` / ${service.nameEn}` : ""}`,
    service.category ? `Category: ${service.category}` : null,
    service.descriptionLv ? `Description: ${service.descriptionLv}` : null,
    service.descriptionEn ? `Description (EN): ${service.descriptionEn}` : null,
    price,
    service.duration ? `Duration: ${service.duration}` : null,
    service.notes ? `Notes: ${service.notes}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  return upsertTypedDocument({
    workspaceId,
    type: "SERVICE",
    entityKey: `service:${serviceId}`,
    title: service.nameLv,
    text,
    metadata: { serviceId, category: service.category },
  });
}

export async function syncFaqKnowledge(
  workspaceId: string,
  faqId: string,
): Promise<SyncResult | null> {
  const faq = await prisma.fAQ.findFirst({
    where: { id: faqId, workspaceId },
  });
  if (!faq) return null;

  if (!faq.isActive) {
    await prisma.knowledgeDocument.deleteMany({
      where: {
        workspaceId,
        type: "FAQ",
        metadata: { path: ["entityKey"], equals: `faq:${faqId}` },
      },
    });
    return null;
  }

  const text = [
    `FAQ`,
    faq.category ? `Category: ${faq.category}` : null,
    `Q: ${faq.questionLv}`,
    `A: ${faq.answerLv}`,
    faq.questionEn ? `Q (EN): ${faq.questionEn}` : null,
    faq.answerEn ? `A (EN): ${faq.answerEn}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  return upsertTypedDocument({
    workspaceId,
    type: "FAQ",
    entityKey: `faq:${faqId}`,
    title: faq.questionLv.slice(0, 120),
    text,
    metadata: { faqId, category: faq.category },
  });
}

export async function ingestUploadedDocument(params: {
  workspaceId: string;
  title: string;
  text: string;
  mimeType: string;
  fileName: string;
  storagePath: string;
}): Promise<SyncResult> {
  const created = await prisma.knowledgeDocument.create({
    data: {
      workspaceId: params.workspaceId,
      type: "UPLOAD",
      title: params.title,
      status: "PROCESSING",
      mimeType: params.mimeType,
      metadata: {
        entityKey: `upload:${Date.now()}`,
        fileName: params.fileName,
        storagePath: params.storagePath,
        source: "DOCUMENT",
      },
    },
  });

  return {
    documentId: created.id,
    ...(await replaceDocumentChunks({
      workspaceId: params.workspaceId,
      documentId: created.id,
      text: params.text,
      metadata: {
        fileName: params.fileName,
        source: "DOCUMENT",
      },
    })),
  };
}

/**
 * Reindex only documents that need it (missing embeddings or hash drift).
 */
export async function reindexWorkspaceKnowledge(workspaceId: string) {
  await syncBusinessInformationKnowledge(workspaceId);

  const services = await prisma.service.findMany({
    where: { workspaceId, isActive: true },
    select: { id: true },
  });
  for (const service of services) {
    await syncServiceKnowledge(workspaceId, service.id);
  }

  const faqs = await prisma.fAQ.findMany({
    where: { workspaceId, isActive: true },
    select: { id: true },
  });
  for (const faq of faqs) {
    await syncFaqKnowledge(workspaceId, faq.id);
  }

  const docs = await prisma.knowledgeDocument.findMany({
    where: {
      workspaceId,
      status: { in: ["READY", "PROCESSING", "PENDING"] },
    },
    select: { id: true },
  });

  let embedded = 0;
  let skipped = 0;
  for (const doc of docs) {
    const result = await embedChunksForDocument({
      workspaceId,
      documentId: doc.id,
    });
    embedded += result.embedded;
    skipped += result.skipped;
  }

  return { documents: docs.length, embedded, skipped };
}
