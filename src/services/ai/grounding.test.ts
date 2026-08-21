import { describe, expect, it } from "vitest";

import {
  canAnswerWithoutRetrieval,
  expandRetrievalQuery,
  isContactIntent,
  isPriceIntent,
} from "@/services/ai/grounding";

describe("grounding helpers", () => {
  it("detects contact and price intents", () => {
    expect(isContactIntent("Kontakti")).toBe(true);
    expect(isPriceIntent("Cenas")).toBe(true);
    expect(isContactIntent("Sveiki")).toBe(false);
  });

  it("expands short chip queries", () => {
    expect(expandRetrievalQuery("Kontakti")).toMatch(/tālrunis/i);
    expect(expandRetrievalQuery("Cenas")).toMatch(/price/i);
  });

  it("allows LLM when profile has facts for short questions", () => {
    expect(
      canAnswerWithoutRetrieval("Kontakti", {
        businessName: "TavsWebs",
        phone: "25547113",
      }),
    ).toBe(true);
    expect(
      canAnswerWithoutRetrieval("Cenas", {
        businessName: "TavsWebs",
        services: [{ name: "Mājaslapa", priceFrom: 500, currency: "EUR" }],
      }),
    ).toBe(true);
    expect(
      canAnswerWithoutRetrieval("Kontakti", { businessName: "Empty Co" }),
    ).toBe(false);
  });
});
