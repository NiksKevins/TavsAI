import { describe, expect, it } from "vitest";

import {
  heuristicExtract,
  heuristicIntent,
  heuristicSpam,
  meetsLeadCriteria,
} from "@/services/leads/lead-detection";
import { DEFAULT_MIN_LEAD_CRITERIA } from "@/config/leads";

describe("lead detection heuristics", () => {
  it("does not treat FAQ as purchase intent", () => {
    expect(heuristicIntent("Kāds ir jūsu darba laiks?")).toBe(false);
    expect(heuristicIntent("Where are you located?")).toBe(false);
  });

  it("detects purchase / booking intent", () => {
    expect(heuristicIntent("I need a new website.")).toBe(true);
    expect(heuristicIntent("I want to book a haircut.")).toBe(true);
    expect(
      heuristicIntent("How much would renovating my bathroom cost?"),
    ).toBe(true);
    expect(
      heuristicIntent("I want to bring my BMW for diagnostics."),
    ).toBe(true);
  });

  it("flags spam", () => {
    expect(heuristicSpam("aaaaaaaaaaaa")).toBe(true);
    expect(heuristicSpam("Buy crypto pump https://spam.example")).toBe(true);
  });

  it("creates no lead criteria match for FAQ without contact", () => {
    const extraction = heuristicExtract({
      messages: [{ role: "user", content: "Kāds ir darba laiks?" }],
      questions: [],
      locale: "lv",
    });
    expect(extraction.hasPurchaseIntent).toBe(false);
    expect(meetsLeadCriteria(extraction, DEFAULT_MIN_LEAD_CRITERIA)).toBe(
      false,
    );
  });

  it("extracts automotive details without inventing missing fields", () => {
    const extraction = heuristicExtract({
      messages: [
        {
          role: "user",
          content:
            "I have a 2018 BMW 320d and the suspension makes noise. Call me +371 20000000",
        },
      ],
      questions: [
        { key: "car_model", labelLv: "Modelis", labelEn: "Model", required: true },
        { key: "year", labelLv: "Gads", labelEn: "Year", required: true },
        { key: "problem", labelLv: "Problēma", labelEn: "Problem", required: true },
      ],
      locale: "en",
    });

    expect(extraction.hasPurchaseIntent).toBe(true);
    expect(extraction.fields.year).toBe("2018");
    expect(extraction.fields.car_model?.toLowerCase()).toContain("bmw");
    expect(extraction.phone).toContain("20000000");
    expect(extraction.fields.problem).toBeUndefined();
    expect(meetsLeadCriteria(extraction, DEFAULT_MIN_LEAD_CRITERIA)).toBe(true);
  });
});
