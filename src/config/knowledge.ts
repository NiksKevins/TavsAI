import type { KnowledgeDocumentType } from "@prisma/client";

/** Lower number = higher priority when sources conflict. */
export const KNOWLEDGE_SOURCE_PRIORITY: Record<KnowledgeDocumentType, number> = {
  BUSINESS_INFORMATION: 10,
  SERVICE: 20,
  FAQ: 30,
  MANUAL: 40,
  WEBSITE_PAGE: 50,
  UPLOAD: 60,
};

export const KNOWLEDGE_UPLOAD = {
  maxBytes: 5 * 1024 * 1024,
  allowedMime: new Set([
    "text/plain",
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
  ]),
  allowedExt: new Set([".txt", ".pdf", ".docx", ".doc"]),
} as const;

export function sourceLabel(type: KnowledgeDocumentType): string {
  switch (type) {
    case "BUSINESS_INFORMATION":
      return "BUSINESS_INFORMATION";
    case "SERVICE":
      return "SERVICE";
    case "FAQ":
      return "FAQ";
    case "MANUAL":
      return "MANUAL";
    case "WEBSITE_PAGE":
      return "WEBSITE";
    case "UPLOAD":
      return "DOCUMENT";
    default:
      return "MANUAL";
  }
}
