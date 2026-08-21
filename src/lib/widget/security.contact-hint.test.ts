import { describe, expect, it } from "vitest";

import { extractContactHint } from "@/lib/widget/security";

describe("extractContactHint", () => {
  it("parses pure email and phone", () => {
    expect(extractContactHint("niks@example.com")).toEqual({
      email: "niks@example.com",
    });
    expect(extractContactHint("25547113")?.phone).toBe("25547113");
  });

  it("parses combined name, email, phone dumps", () => {
    const hint = extractContactHint(
      "niks kevins markitāns, nikskevinsm@gmail.com, 25547113",
    );
    expect(hint?.email).toBe("nikskevinsm@gmail.com");
    expect(hint?.phone).toContain("25547113");
    expect(hint?.name?.toLowerCase()).toContain("niks");
  });

  it("ignores long non-contact messages", () => {
    expect(
      extractContactHint(
        "kādu kontaktinformāciju vajag ? man nav noteikts termiņš un es tikai vaicāju",
      ),
    ).toBeNull();
  });

  it("parses name-only intros", () => {
    expect(extractContactHint("Mani sauc Jānis Bērziņš")).toEqual({
      name: "Jānis Bērziņš",
    });
    expect(extractContactHint("My name is Jane Doe")?.name).toBe("Jane Doe");
  });
});
