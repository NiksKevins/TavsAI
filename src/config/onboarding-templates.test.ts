import { describe, expect, it } from "vitest";

import { buildOnboardingAssistantDraft } from "@/config/onboarding-templates";

describe("onboarding templates", () => {
  it("builds automotive draft with diagnostics suggestion", () => {
    const draft = buildOnboardingAssistantDraft({
      industry: "AUTOMOTIVE",
      businessName: "Nord Auto",
    });
    expect(draft.name).toBe("Nords");
    expect(draft.greetingLv).toContain("Nord Auto");
    expect(draft.suggestedQuestions.some((q) => /diagnostik/i.test(q))).toBe(
      true,
    );
    expect(draft.leadFields.length).toBeGreaterThan(0);
  });

  it("uses business token for OTHER industry name", () => {
    const draft = buildOnboardingAssistantDraft({
      industry: "OTHER",
      businessName: "Sia Kalns",
    });
    expect(draft.name).toBe("Sia");
  });
});
