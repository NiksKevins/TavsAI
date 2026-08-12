import { describe, expect, it } from "vitest";

import { getDemoIndustry } from "@/config/demo-industries";
import { runDemoChat } from "@/services/demo/demo-chat-service";

describe("marketing demo chat", () => {
  it("loads auto industry knowledge with BMW diagnostics price", () => {
    const auto = getDemoIndustry("auto");
    expect(auto?.businessName).toBe("Nord Auto Serviss");
    expect(
      auto?.knowledge.some((k) => k.content.includes("€45")),
    ).toBe(true);
  });

  it("returns an offline answer grounded in knowledge without OpenAI", async () => {
    const prev = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;
    try {
      const result = await runDemoChat({
        industryId: "auto",
        message: "Cik maksā BMW diagnostika?",
        locale: "lv",
      });
      expect(result.usedAi).toBe(false);
      expect(result.answer.toLowerCase()).toMatch(/€45|45/);
    } finally {
      if (prev !== undefined) process.env.OPENAI_API_KEY = prev;
    }
  });

  it("flags lead form when customer wants to book", async () => {
    const prev = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;
    try {
      const result = await runDemoChat({
        industryId: "auto",
        message: "Jā, vēlos pieteikties",
        locale: "lv",
        history: [
          {
            role: "assistant",
            content: "Diagnostika €45. Vai vēlaties pieteikt vizīti?",
          },
        ],
      });
      expect(result.showLeadForm).toBe(true);
    } finally {
      if (prev !== undefined) process.env.OPENAI_API_KEY = prev;
    }
  });
});
