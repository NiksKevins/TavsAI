import path from "node:path";
import { mkdir, unlink, writeFile } from "node:fs/promises";

import { KNOWLEDGE_UPLOAD } from "@/config/knowledge";

export type UploadValidation =
  | { ok: true; ext: string; mimeType: string }
  | { ok: false; error: string };

export function validateKnowledgeUpload(params: {
  fileName: string;
  mimeType: string;
  size: number;
}): UploadValidation {
  if (params.size <= 0) return { ok: false, error: "empty_file" };
  if (params.size > KNOWLEDGE_UPLOAD.maxBytes) {
    return { ok: false, error: "file_too_large" };
  }

  const ext = path.extname(params.fileName).toLowerCase();
  if (!KNOWLEDGE_UPLOAD.allowedExt.has(ext)) {
    return { ok: false, error: "invalid_extension" };
  }

  const mime = params.mimeType || "application/octet-stream";
  if (
    mime !== "application/octet-stream" &&
    !KNOWLEDGE_UPLOAD.allowedMime.has(mime)
  ) {
    return { ok: false, error: "invalid_mime" };
  }

  return { ok: true, ext, mimeType: mime };
}

/**
 * Content-signature checks + hook for ClamAV / cloud scanner.
 * Rejects obvious PE/ELF/Mach-O and mismatched magic bytes.
 */
export async function scanUploadForMalware(params: {
  buffer: Buffer;
  fileName: string;
}): Promise<{ clean: boolean; engine: string; reason?: string }> {
  const ext = path.extname(params.fileName).toLowerCase();
  const buf = params.buffer;
  if (buf.length >= 2 && buf[0] === 0x4d && buf[1] === 0x5a) {
    return { clean: false, engine: "magic", reason: "pe_executable" };
  }
  if (
    buf.length >= 4 &&
    buf[0] === 0x7f &&
    buf[1] === 0x45 &&
    buf[2] === 0x4c &&
    buf[3] === 0x46
  ) {
    return { clean: false, engine: "magic", reason: "elf_executable" };
  }
  if (
    buf.length >= 4 &&
    buf[0] === 0xcf &&
    buf[1] === 0xfa &&
    buf[2] === 0xed &&
    buf[3] === 0xfe
  ) {
    return { clean: false, engine: "magic", reason: "macho_executable" };
  }

  if (ext === ".pdf") {
    const head = buf.subarray(0, 5).toString("utf8");
    if (!head.startsWith("%PDF-")) {
      return { clean: false, engine: "magic", reason: "pdf_magic_mismatch" };
    }
  }
  if (ext === ".docx") {
    if (!(buf[0] === 0x50 && buf[1] === 0x4b)) {
      return { clean: false, engine: "magic", reason: "docx_magic_mismatch" };
    }
  }

  return { clean: true, engine: "magic+noop-av" };
}

export async function extractTextFromUpload(params: {
  buffer: Buffer;
  ext: string;
}): Promise<string> {
  if (params.ext === ".txt") {
    return params.buffer.toString("utf8");
  }

  if (params.ext === ".pdf") {
    const mod = await import("pdf-parse");
    const pdfParse = (
      mod as { default?: (data: Buffer) => Promise<{ text: string }> }
    ).default;
    if (!pdfParse) throw new Error("pdf_parse_unavailable");
    const parsed = await pdfParse(params.buffer);
    return parsed.text || "";
  }

  if (params.ext === ".docx" || params.ext === ".doc") {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer: params.buffer });
    return result.value || "";
  }

  throw new Error("unsupported_type");
}

export async function storeUploadSafely(params: {
  workspaceId: string;
  fileName: string;
  buffer: Buffer;
}): Promise<string> {
  const safeName = params.fileName
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .slice(0, 120);
  const dir = path.join(
    process.cwd(),
    "storage",
    "uploads",
    params.workspaceId,
  );
  await mkdir(dir, { recursive: true });
  const fullPath = path.join(dir, `${Date.now()}-${safeName}`);
  if (!fullPath.startsWith(dir)) {
    throw new Error("invalid_storage_path");
  }
  await writeFile(fullPath, params.buffer);
  return fullPath;
}

export async function deleteStoredUpload(filePath: string | null | undefined) {
  if (!filePath) return;
  const root = path.join(process.cwd(), "storage", "uploads");
  const resolved = path.resolve(filePath);
  if (!resolved.startsWith(root)) return;
  await unlink(resolved).catch(() => undefined);
}
