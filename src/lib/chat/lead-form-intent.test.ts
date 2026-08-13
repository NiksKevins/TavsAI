import { describe, expect, it } from "vitest";

import {
  assistantAnswerRequestsContact,
  shouldShowLeadForm,
  userWantsLeadForm,
} from "@/lib/chat/lead-form-intent";

describe("lead form intent", () => {
  it("shows form when user asks what contact info is needed", () => {
    expect(
      userWantsLeadForm("kādu kontaktinformāciju vajag ?", [
        {
          role: "assistant",
          content:
            "Lai turpinātu, lūdzu, norādiet savu kontaktinformāciju.",
        },
      ]),
    ).toBe(true);
  });

  it("shows form when assistant answer asks for name/email/phone", () => {
    expect(
      assistantAnswerRequestsContact(
        "Lūdzu, norādiet savu vārdu, e-pasta adresi un tālruņa numuru.",
      ),
    ).toBe(true);
    expect(
      shouldShowLeadForm({
        message: "ok",
        history: [],
        answer:
          "Lūdzu, norādiet savu vārdu, e-pasta adresi un tālruņa numuru, lai varam ar jums sazināties.",
      }),
    ).toBe(true);
  });

  it("still shows form on booking intent", () => {
    expect(userWantsLeadForm("Jā, vēlos pieteikties", [])).toBe(true);
  });
});
