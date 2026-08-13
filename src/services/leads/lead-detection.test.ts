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

  it("extracts name email phone from a combined contact dump", () => {
    const extraction = heuristicExtract({
      messages: [
        {
          role: "user",
          content: "Vajag jaunu mājaslapu",
        },
        {
          role: "user",
          content:
            "niks kevins markitāns, nikskevinsm@gmail.com, 25547113",
        },
      ],
      questions: [],
      locale: "lv",
    });

    expect(extraction.hasPurchaseIntent).toBe(true);
    expect(extraction.name?.toLowerCase()).toContain("niks");
    expect(extraction.email).toBe("nikskevinsm@gmail.com");
    expect(extraction.phone).toContain("25547113");
    expect(meetsLeadCriteria(extraction, DEFAULT_MIN_LEAD_CRITERIA)).toBe(
      true,
    );
  });
});
