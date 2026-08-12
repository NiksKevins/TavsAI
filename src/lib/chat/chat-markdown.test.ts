import { describe, expect, it } from "vitest";

import {
  normalizeChatMarkdown,
  parseChatBlocks,
} from "@/lib/chat/chat-markdown";

const SAMPLE_LV = `TavsWebs Bot sniedz: 1. Atbild uz klientu jautājumiem 24/7. 2. Apkopo leadus (vārdu, tālruni, kontekstu). 3. Palīdz pieteikties. 4. Darbojas latviešu un angļu valodā bez smagām integrācijām. Cenas: - **Free**: 0 €, līdz 100 sarunām. - **Starter**: 19 €/mēn, 500 sarunas. - **Business**: 39 €/mēn, 2000 sarunas. - **Pro**: 79 €/mēn, 10 000 sarunas. Kā sākt: 1. Reģistrējieties bot.tavswebs.com/register. 2. Pievienojiet mājaslapu. 3. Ievietojiet kodu.`;

describe("normalizeChatMarkdown", () => {
  it("breaks inline numbered and bullet lists onto their own lines", () => {
    const normalized = normalizeChatMarkdown(SAMPLE_LV);
    expect(normalized).toContain("\n1. Atbild");
    expect(normalized).toContain("\n2. Apkopo");
    expect(normalized).toContain("\n- **Free**");
    expect(normalized).toContain("Cenas:");
    expect(normalized).toContain("Kā sākt:");
  });
});

describe("parseChatBlocks", () => {
  it("produces ordered + unordered blocks with bold-ready plan names", () => {
    const blocks = parseChatBlocks(SAMPLE_LV);
    const types = blocks.map((b) => b.type);
    expect(types).toContain("ol");
    expect(types).toContain("ul");

    const ul = blocks.find((b) => b.type === "ul");
    expect(ul?.type).toBe("ul");
    if (ul?.type === "ul") {
      expect(ul.items.some((i) => i.includes("**Free**"))).toBe(true);
      expect(ul.items.length).toBeGreaterThanOrEqual(3);
    }

    const ols = blocks.filter((b) => b.type === "ol");
    expect(ols.length).toBeGreaterThanOrEqual(1);
  });
});
