import { describe, expect, it } from "vitest";

import { KNOWLEDGE_SOURCE_PRIORITY, sourceLabel } from "@/config/knowledge";
import { validateKnowledgeUpload } from "@/lib/knowledge/upload";

describe("knowledge priority", () => {
  it("ranks business info above website and documents", () => {
    expect(KNOWLEDGE_SOURCE_PRIORITY.BUSINESS_INFORMATION).toBeLessThan(
      KNOWLEDGE_SOURCE_PRIORITY.SERVICE,
    );
    expect(KNOWLEDGE_SOURCE_PRIORITY.SERVICE).toBeLessThan(
      KNOWLEDGE_SOURCE_PRIORITY.FAQ,
    );
    expect(KNOWLEDGE_SOURCE_PRIORITY.FAQ).toBeLessThan(
      KNOWLEDGE_SOURCE_PRIORITY.WEBSITE_PAGE,
    );
    expect(KNOWLEDGE_SOURCE_PRIORITY.WEBSITE_PAGE).toBeLessThan(
      KNOWLEDGE_SOURCE_PRIORITY.UPLOAD,
    );
  });

  it("maps types to public source labels", () => {
    expect(sourceLabel("WEBSITE_PAGE")).toBe("WEBSITE");
    expect(sourceLabel("UPLOAD")).toBe("DOCUMENT");
    expect(sourceLabel("BUSINESS_INFORMATION")).toBe("BUSINESS_INFORMATION");
  });
});

describe("upload validation", () => {
  it("accepts txt under size limit", () => {
    const result = validateKnowledgeUpload({
      fileName: "notes.txt",
      mimeType: "text/plain",
      size: 100,
    });
    expect(result.ok).toBe(true);
  });

  it("rejects oversized files", () => {
    const result = validateKnowledgeUpload({
      fileName: "big.pdf",
      mimeType: "application/pdf",
      size: 20 * 1024 * 1024,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("file_too_large");
  });

  it("rejects bad extensions", () => {
    const result = validateKnowledgeUpload({
      fileName: "x.exe",
      mimeType: "application/octet-stream",
      size: 10,
    });
    expect(result.ok).toBe(false);
  });
});
