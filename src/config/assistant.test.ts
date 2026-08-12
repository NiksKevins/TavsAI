import { describe, expect, it } from "vitest";

import {
  isQuoteRequest,
  isRestrictedTopic,
  isSafeTone,
  matchesCustomHandoffRules,
  parseHandoffTriggers,
  temperatureForTone,
} from "@/config/assistant";

describe("assistant config helpers", () => {
  it("only allows safe tone presets", () => {
    expect(isSafeTone("professional")).toBe(true);
    expect(isSafeTone("creative")).toBe(false);
    expect(temperatureForTone("concise")).toBeLessThan(
      temperatureForTone("friendly"),
    );
  });

  it("detects quote requests for handoff", () => {
    expect(isQuoteRequest("Vai varu saņemt tāmi?")).toBe(true);
    expect(isQuoteRequest("Can I get a quote?")).toBe(true);
    expect(isQuoteRequest("Kas ir eļļas maiņa?")).toBe(false);
  });

  it("matches custom handoff rules", () => {
    expect(matchesCustomHandoffRules("Man vajag menedžeri", "menedžer")).toBe(
      true,
    );
    expect(matchesCustomHandoffRules("Hello", "/manager/i")).toBe(false);
    expect(matchesCustomHandoffRules("Call the manager", "/manager/i")).toBe(
      true,
    );
  });

  it("flags restricted topics", () => {
    expect(
      isRestrictedTopic("Vai varat sniegt juridisku padomu?", [
        "Juridiski padomi",
      ]),
    ).toBe(true);
    expect(isRestrictedTopic("Cik maksā eļļas maiņa?", ["Juridiski padomi"])).toBe(
      false,
    );
  });

  it("parses handoff triggers with defaults", () => {
    expect(parseHandoffTriggers(null).customerAsksHuman).toBe(true);
    expect(
      parseHandoffTriggers({ requestsQuote: true, cannotAnswer: false })
        .requestsQuote,
    ).toBe(true);
  });
});
