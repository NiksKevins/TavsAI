import { describe, expect, it } from "vitest";

import {
  formatOpeningHoursForKnowledge,
  formatSocialLinksForKnowledge,
  openingHoursFromFormData,
  parseOpeningHours,
  parseSocialLinks,
  socialLinksFromFormData,
} from "@/config/business-profile";

describe("business-profile", () => {
  it("parses legacy JSON maps and aliases", () => {
    expect(
      parseOpeningHours({ monday: "9-18", sat: "closed", foo: "x" }),
    ).toEqual({ mon: "9-18", sat: "closed" });
    expect(
      parseSocialLinks({
        Instagram: "https://instagram.com/a",
        twitter: "https://x.com/a",
      }),
    ).toEqual({
      instagram: "https://instagram.com/a",
      x: "https://x.com/a",
    });
  });

  it("builds maps from form fields", () => {
    const fd = new FormData();
    fd.set("hours_mon", "9:00–18:00");
    fd.set("hours_sun_closed", "on");
    fd.set("social_instagram", "instagram.com/demo");
    fd.set("social_facebook", "");

    expect(openingHoursFromFormData(fd)).toEqual({
      mon: "9:00–18:00",
      sun: "closed",
    });
    expect(socialLinksFromFormData(fd)).toEqual({
      instagram: "https://instagram.com/demo",
    });
  });

  it("formats knowledge text without raw JSON", () => {
    const hours = formatOpeningHoursForKnowledge(
      { mon: "9-18", sun: "closed" },
      "lv",
    );
    expect(hours).toContain("Pirmdiena: 9-18");
    expect(hours).toContain("Svētdiena: slēgts");
    expect(
      formatSocialLinksForKnowledge({
        instagram: "https://instagram.com/x",
      }),
    ).toBe("Instagram: https://instagram.com/x");
  });
});
