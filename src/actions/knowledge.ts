"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireWorkspaceRole } from "@/lib/authz";
import { writeAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/db";
import {
  extractTextFromUpload,
  scanUploadForMalware,
  storeUploadSafely,
  validateKnowledgeUpload,
} from "@/lib/knowledge/upload";
import {
  ingestUploadedDocument,
  reindexWorkspaceKnowledge,
  syncBusinessInformationKnowledge,
  syncFaqKnowledge,
  syncServiceKnowledge,
} from "@/services/knowledge/sync-service";
import {
  generateAssistantReply,
} from "@/services/ai/ai-service";
import { retrieveRelevantChunks } from "@/services/knowledge/retrieval-service";
import { hasOpenAIKey } from "@/services/ai/openai-client";

export type KnowledgeActionResult =
  | { ok: true; message?: string; data?: unknown }
  | { ok: false; error: string };

function revalidateKnowledge() {
  revalidatePath("/dashboard/knowledge");
  revalidatePath("/dashboard/knowledge/website");
  revalidatePath("/dashboard/knowledge/services");
  revalidatePath("/dashboard/knowledge/faqs");
  revalidatePath("/dashboard/knowledge/documents");
  revalidatePath("/dashboard/knowledge/business");
  revalidatePath("/dashboard/knowledge/test");
  revalidatePath("/dashboard/analytics");
  revalidatePath("/dashboard/analytics/unanswered");
}

export async function updateBusinessInformationAction(
  _prev: KnowledgeActionResult | null,
  formData: FormData,
): Promise<KnowledgeActionResult> {
  const { workspace, user } = await requireWorkspaceRole("ADMIN");

  const schema = z.object({
    displayName: z.string().trim().max(160).optional(),
    description: z.string().trim().max(4000).optional(),
    phone: z.string().trim().max(40).optional(),
    email: z.string().trim().email().optional().or(z.literal("")),
    address: z.string().trim().max(240).optional(),
    city: z.string().trim().max(120).optional(),
    websiteUrl: z.string().trim().url().optional().or(z.literal("")),
    openingHours: z.string().trim().max(2000).optional(),
    socialLinks: z.string().trim().max(2000).optional(),
    languages: z.string().trim().max(120).optional(),
    policies: z.string().trim().max(4000).optional(),
  });

  const parsed = schema.safeParse({
    displayName: formData.get("displayName") || undefined,
    description: formData.get("description") || undefined,
    phone: formData.get("phone") || undefined,
    email: formData.get("email") || "",
    address: formData.get("address") || undefined,
    city: formData.get("city") || undefined,
    websiteUrl: formData.get("websiteUrl") || "",
    openingHours: formData.get("openingHours") || undefined,
    socialLinks: formData.get("socialLinks") || undefined,
    languages: formData.get("languages") || undefined,
    policies: formData.get("policies") || undefined,
  });

  if (!parsed.success) return { ok: false, error: "invalid_input" };

  let openingHours: object | undefined;
  let socialLinks: object | undefined;
  try {
    if (parsed.data.openingHours?.trim()) {
      openingHours = JSON.parse(parsed.data.openingHours);
    }
    if (parsed.data.socialLinks?.trim()) {
      socialLinks = JSON.parse(parsed.data.socialLinks);
    }
  } catch {
    return { ok: false, error: "invalid_json" };
  }

  const languages = (parsed.data.languages || "lv")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  await prisma.businessInformation.upsert({
    where: { workspaceId: workspace.id },
    create: {
      workspaceId: workspace.id,
      displayName: parsed.data.displayName,
      description: parsed.data.description,
      phone: parsed.data.phone,
      email: parsed.data.email || null,
      address: parsed.data.address,
      city: parsed.data.city,
      websiteUrl: parsed.data.websiteUrl || null,
      openingHours: openingHours ?? undefined,
      socialLinks: socialLinks ?? undefined,
      languages,
      policies: parsed.data.policies,
    },
    update: {
      displayName: parsed.data.displayName,
      description: parsed.data.description,
      phone: parsed.data.phone,
      email: parsed.data.email || null,
      address: parsed.data.address,
      city: parsed.data.city,
      websiteUrl: parsed.data.websiteUrl || null,
      openingHours: openingHours ?? undefined,
      socialLinks: socialLinks ?? undefined,
      languages,
      policies: parsed.data.policies,
    },
  });

  await syncBusinessInformationKnowledge(workspace.id);
  await writeAuditLog({
    workspaceId: workspace.id,
    userId: user.id,
    action: "UPDATE",
    entityType: "BusinessInformation",
    entityId: workspace.id,
  });
  revalidateKnowledge();
  return { ok: true };
}

export async function saveServiceAction(
  _prev: KnowledgeActionResult | null,
  formData: FormData,
): Promise<KnowledgeActionResult> {
  const { workspace, user } = await requireWorkspaceRole("ADMIN");
  const id = String(formData.get("id") || "") || null;

  const schema = z.object({
    nameLv: z.string().trim().min(2).max(160),
    descriptionLv: z.string().trim().max(4000).optional(),
    priceFrom: z.string().optional(),
    duration: z.string().trim().max(80).optional(),
    category: z.string().trim().max(80).optional(),
    notes: z.string().trim().max(2000).optional(),
    isActive: z.boolean(),
  });

  const parsed = schema.safeParse({
    nameLv: formData.get("nameLv"),
    descriptionLv: formData.get("descriptionLv") || undefined,
    priceFrom: formData.get("priceFrom") || undefined,
    duration: formData.get("duration") || undefined,
    category: formData.get("category") || undefined,
    notes: formData.get("notes") || undefined,
    isActive: formData.get("isActive") === "on",
  });
  if (!parsed.success) return { ok: false, error: "invalid_input" };

  const priceFrom =
    parsed.data.priceFrom && parsed.data.priceFrom.trim()
      ? parsed.data.priceFrom.trim()
      : null;

  let service;
  if (id) {
    const existing = await prisma.service.findFirst({
      where: { id, workspaceId: workspace.id },
    });
    if (!existing) return { ok: false, error: "not_found" };
    service = await prisma.service.update({
      where: { id: existing.id },
      data: {
        nameLv: parsed.data.nameLv,
        descriptionLv: parsed.data.descriptionLv,
        priceFrom,
        duration: parsed.data.duration || null,
        category: parsed.data.category || null,
        notes: parsed.data.notes || null,
        isActive: parsed.data.isActive,
      },
    });
  } else {
    service = await prisma.service.create({
      data: {
        workspaceId: workspace.id,
        nameLv: parsed.data.nameLv,
        descriptionLv: parsed.data.descriptionLv,
        priceFrom,
        duration: parsed.data.duration || null,
        category: parsed.data.category || null,
        notes: parsed.data.notes || null,
        isActive: parsed.data.isActive,
      },
    });
  }

  await syncServiceKnowledge(workspace.id, service.id);
  await writeAuditLog({
    workspaceId: workspace.id,
    userId: user.id,
    action: id ? "UPDATE" : "CREATE",
    entityType: "Service",
    entityId: service.id,
  });
  revalidateKnowledge();
  return { ok: true };
}

export async function deleteServiceAction(serviceId: string) {
  const { workspace, user } = await requireWorkspaceRole("ADMIN");
  const service = await prisma.service.findFirst({
    where: { id: serviceId, workspaceId: workspace.id },
  });
  if (!service) return { ok: false as const, error: "not_found" };

  await prisma.knowledgeDocument.deleteMany({
    where: {
      workspaceId: workspace.id,
      type: "SERVICE",
      metadata: { path: ["entityKey"], equals: `service:${serviceId}` },
    },
  });
  await prisma.service.delete({ where: { id: serviceId } });
  await writeAuditLog({
    workspaceId: workspace.id,
    userId: user.id,
    action: "DELETE",
    entityType: "Service",
    entityId: serviceId,
  });
  revalidateKnowledge();
  return { ok: true as const };
}

export async function saveFaqAction(
  _prev: KnowledgeActionResult | null,
  formData: FormData,
): Promise<KnowledgeActionResult> {
  const { workspace, user } = await requireWorkspaceRole("ADMIN");
  const id = String(formData.get("id") || "") || null;

  const schema = z.object({
    questionLv: z.string().trim().min(2).max(400),
    answerLv: z.string().trim().min(2).max(5000),
    category: z.string().trim().max(80).optional(),
    isActive: z.boolean(),
  });

  const parsed = schema.safeParse({
    questionLv: formData.get("questionLv"),
    answerLv: formData.get("answerLv"),
    category: formData.get("category") || undefined,
    isActive: formData.get("isActive") === "on",
  });
  if (!parsed.success) return { ok: false, error: "invalid_input" };

  let faq;
  if (id) {
    const existing = await prisma.fAQ.findFirst({
      where: { id, workspaceId: workspace.id },
    });
    if (!existing) return { ok: false, error: "not_found" };
    faq = await prisma.fAQ.update({
      where: { id: existing.id },
      data: {
        questionLv: parsed.data.questionLv,
        answerLv: parsed.data.answerLv,
        category: parsed.data.category || null,
        isActive: parsed.data.isActive,
      },
    });
  } else {
    faq = await prisma.fAQ.create({
      data: {
        workspaceId: workspace.id,
        questionLv: parsed.data.questionLv,
        answerLv: parsed.data.answerLv,
        category: parsed.data.category || null,
        isActive: parsed.data.isActive,
      },
    });
  }

  await syncFaqKnowledge(workspace.id, faq.id);
  await writeAuditLog({
    workspaceId: workspace.id,
    userId: user.id,
    action: id ? "UPDATE" : "CREATE",
    entityType: "FAQ",
    entityId: faq.id,
  });
  revalidateKnowledge();
  return { ok: true };
}

export async function deleteFaqAction(faqId: string) {
  const { workspace, user } = await requireWorkspaceRole("ADMIN");
  const faq = await prisma.fAQ.findFirst({
    where: { id: faqId, workspaceId: workspace.id },
  });
  if (!faq) return { ok: false as const, error: "not_found" };

  await prisma.knowledgeDocument.deleteMany({
    where: {
      workspaceId: workspace.id,
      type: "FAQ",
      metadata: { path: ["entityKey"], equals: `faq:${faqId}` },
    },
  });
  await prisma.fAQ.delete({ where: { id: faqId } });
  await writeAuditLog({
    workspaceId: workspace.id,
    userId: user.id,
    action: "DELETE",
    entityType: "FAQ",
    entityId: faqId,
  });
  revalidateKnowledge();
  return { ok: true as const };
}

export async function uploadKnowledgeDocumentAction(
  _prev: KnowledgeActionResult | null,
  formData: FormData,
): Promise<KnowledgeActionResult> {
  const { workspace, user } = await requireWorkspaceRole("ADMIN");
  const file = formData.get("file");
  if (!(file instanceof File)) return { ok: false, error: "missing_file" };

  const buffer = Buffer.from(await file.arrayBuffer());
  const validation = validateKnowledgeUpload({
    fileName: file.name,
    mimeType: file.type,
    size: buffer.byteLength,
  });
  if (!validation.ok) return { ok: false, error: validation.error };

  const scan = await scanUploadForMalware({
    buffer,
    fileName: file.name,
  });
  if (!scan.clean) return { ok: false, error: "malware_detected" };

  let text = "";
  try {
    text = await extractTextFromUpload({
      buffer,
      ext: validation.ext,
    });
  } catch {
    return { ok: false, error: "extract_failed" };
  }

  if (!text.trim()) return { ok: false, error: "empty_text" };

  const storagePath = await storeUploadSafely({
    workspaceId: workspace.id,
    fileName: file.name,
    buffer,
  });

  await ingestUploadedDocument({
    workspaceId: workspace.id,
    title: file.name,
    text,
    mimeType: validation.mimeType,
    fileName: file.name,
    storagePath,
  });

  await writeAuditLog({
    workspaceId: workspace.id,
    userId: user.id,
    action: "CREATE",
    entityType: "KnowledgeDocument",
    entityId: workspace.id,
    metadata: { type: "UPLOAD", title: file.name },
  });

  revalidateKnowledge();
  return { ok: true };
}

export async function deleteUploadDocumentAction(documentId: string) {
  const { workspace, user } = await requireWorkspaceRole("ADMIN");
  const doc = await prisma.knowledgeDocument.findFirst({
    where: { id: documentId, workspaceId: workspace.id, type: "UPLOAD" },
  });
  if (!doc) return { ok: false as const, error: "not_found" };
  const { deleteStoredUpload } = await import("@/lib/knowledge/upload");
  const meta =
    doc.metadata && typeof doc.metadata === "object"
      ? (doc.metadata as { storagePath?: string })
      : null;
  await deleteStoredUpload(meta?.storagePath);
  await prisma.knowledgeDocument.delete({ where: { id: doc.id } });
  await writeAuditLog({
    workspaceId: workspace.id,
    userId: user.id,
    action: "DELETE",
    entityType: "KnowledgeDocument",
    entityId: doc.id,
    metadata: { type: "UPLOAD", title: doc.title },
  });
  revalidateKnowledge();
  return { ok: true as const };
}

export async function reindexKnowledgeAction(): Promise<KnowledgeActionResult> {
  const { workspace } = await requireWorkspaceRole("ADMIN");
  const result = await reindexWorkspaceKnowledge(workspace.id);
  revalidateKnowledge();
  return {
    ok: true,
    message: `reindexed:${result.documents}:${result.embedded}:${result.skipped}`,
    data: result,
  };
}

export async function importFromWebsiteAction(): Promise<KnowledgeActionResult> {
  const { workspace } = await requireWorkspaceRole("ADMIN");
  const pages = await prisma.knowledgeDocument.count({
    where: { workspaceId: workspace.id, type: "WEBSITE_PAGE", status: "READY" },
  });
  if (pages === 0) {
    return { ok: false, error: "no_website_pages" };
  }

  const { importStructuredKnowledgeFromCrawl } = await import(
    "@/services/knowledge/import-from-crawl"
  );
  const imported = await importStructuredKnowledgeFromCrawl(workspace.id);
  revalidateKnowledge();
  return {
    ok: true,
    message: `imported:${imported.servicesCreated}:${imported.servicesUpdated}:${imported.faqsCreated}:${imported.faqsUpdated}`,
    data: imported,
  };
}

export async function testKnowledgeAiAction(
  _prev: KnowledgeActionResult | null,
  formData: FormData,
): Promise<KnowledgeActionResult> {
  const { workspace } = await requireWorkspaceRole("MEMBER");
  const question = String(formData.get("question") || "").trim();
  if (!question || question.length > 500) {
    return { ok: false, error: "invalid_question" };
  }

  if (!hasOpenAIKey()) {
    // Still show retrieval sources even without generation.
    try {
      const sources = await retrieveRelevantChunks({
        workspaceId: workspace.id,
        query: question,
      });
      return {
        ok: true,
        data: {
          answer:
            "OPENAI_API_KEY nav iestatīts — rādām tikai atrastos avotus.",
          sources: sources.map((s) => ({
            title: s.title,
            source: s.source,
            similarity: s.similarity,
            excerpt: s.content.slice(0, 240),
          })),
        },
      };
    } catch {
      return { ok: false, error: "retrieval_failed" };
    }
  }

  try {
    const [result, sources] = await Promise.all([
      generateAssistantReply({
        workspaceId: workspace.id,
        message: question,
        locale: workspace.primaryLocale,
      }),
      retrieveRelevantChunks({
        workspaceId: workspace.id,
        query: question,
      }),
    ]);

    return {
      ok: true,
      data: {
        answer: result.answer,
        usedFallback: result.usedFallback,
        sources: sources.map((s) => ({
          title: s.title,
          source: s.source,
          similarity: s.similarity,
          excerpt: s.content.slice(0, 240),
        })),
      },
    };
  } catch (error) {
    console.error("[knowledge/test]", error);
    return { ok: false, error: "test_failed" };
  }
}
