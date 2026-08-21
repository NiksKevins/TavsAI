import { describe, expect, it } from "vitest";

import {
  assertSafePublicUrl,
  isPrivateOrReservedIp,
  UnsafeUrlError,
} from "@/lib/crawl/url-safety";
import {
  isOriginDenied,
  widgetCorsHeaders,
} from "@/lib/widget/security";
import { scanUploadForMalware } from "@/lib/knowledge/upload";

describe("SSRF url safety", () => {
  it("flags private and metadata ranges", () => {
    expect(isPrivateOrReservedIp("127.0.0.1")).toBe(true);
    expect(isPrivateOrReservedIp("10.0.0.5")).toBe(true);
    expect(isPrivateOrReservedIp("172.16.0.1")).toBe(true);
    expect(isPrivateOrReservedIp("192.168.1.1")).toBe(true);
    expect(isPrivateOrReservedIp("169.254.169.254")).toBe(true);
    expect(isPrivateOrReservedIp("::1")).toBe(true);
    expect(isPrivateOrReservedIp("fd12::1")).toBe(true);
    expect(isPrivateOrReservedIp("8.8.8.8")).toBe(false);
  });

  it("rejects localhost and loopback URLs", async () => {
    await expect(assertSafePublicUrl("http://127.0.0.1/")).rejects.toBeInstanceOf(
      UnsafeUrlError,
    );
    await expect(assertSafePublicUrl("http://localhost/")).rejects.toBeInstanceOf(
      UnsafeUrlError,
    );
    await expect(
      assertSafePublicUrl("http://169.254.169.254/latest/meta-data/"),
    ).rejects.toBeInstanceOf(UnsafeUrlError);
  });
});

describe("widget CORS", () => {
  it("does not open CORS when allow-list is empty", () => {
    const headers = widgetCorsHeaders("https://evil.example", []);
    expect(headers.get("Access-Control-Allow-Origin")).toBeNull();
    expect(isOriginDenied("https://evil.example", headers)).toBe(true);
  });

  it("allows configured origins", () => {
    const headers = widgetCorsHeaders("https://shop.lv", [
      "https://shop.lv",
    ]);
    expect(headers.get("Access-Control-Allow-Origin")).toBe("https://shop.lv");
  });

  it("allows the app origin even when a customer allow-list is set", () => {
    const prev = process.env.NEXT_PUBLIC_APP_URL;
    process.env.NEXT_PUBLIC_APP_URL = "https://bot.tavswebs.com";
    try {
      const headers = widgetCorsHeaders("https://bot.tavswebs.com", [
        "https://tavswebs.com",
      ]);
      expect(headers.get("Access-Control-Allow-Origin")).toBe(
        "https://bot.tavswebs.com",
      );
      expect(isOriginDenied("https://bot.tavswebs.com", headers)).toBe(false);
    } finally {
      process.env.NEXT_PUBLIC_APP_URL = prev;
    }
  });

  it("does not reflect Origin when allow-list contains only *", () => {
    const headers = widgetCorsHeaders("https://evil.example", ["*"]);
    expect(headers.get("Access-Control-Allow-Origin")).toBeNull();
  });
});

describe("upload malware magic", () => {
  it("rejects PE executables", async () => {
    const buf = Buffer.from([0x4d, 0x5a, 0x90, 0x00, 0x03]);
    const result = await scanUploadForMalware({
      buffer: buf,
      fileName: "malware.pdf",
    });
    expect(result.clean).toBe(false);
  });

  it("accepts PDF magic", async () => {
    const buf = Buffer.from("%PDF-1.4 demo");
    const result = await scanUploadForMalware({
      buffer: buf,
      fileName: "doc.pdf",
    });
    expect(result.clean).toBe(true);
  });
});
