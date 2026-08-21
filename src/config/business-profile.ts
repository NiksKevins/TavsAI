export const WEEKDAY_KEYS = [
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
  "sun",
] as const;

export type WeekdayKey = (typeof WEEKDAY_KEYS)[number];

export type OpeningHoursMap = Partial<Record<WeekdayKey, string>>;

export const SOCIAL_PLATFORMS = [
  {
    key: "facebook",
    label: "Facebook",
    placeholder: "https://facebook.com/…",
    color: "#1877F2",
  },
  {
    key: "instagram",
    label: "Instagram",
    placeholder: "https://instagram.com/…",
    color: "#E4405F",
  },
  {
    key: "tiktok",
    label: "TikTok",
    placeholder: "https://tiktok.com/@…",
    color: "#111111",
  },
  {
    key: "linkedin",
    label: "LinkedIn",
    placeholder: "https://linkedin.com/company/…",
    color: "#0A66C2",
  },
  {
    key: "youtube",
    label: "YouTube",
    placeholder: "https://youtube.com/@…",
    color: "#FF0000",
  },
  {
    key: "x",
    label: "X (Twitter)",
    placeholder: "https://x.com/…",
    color: "#111111",
  },
  {
    key: "whatsapp",
    label: "WhatsApp",
    placeholder: "https://wa.me/371…",
    color: "#25D366",
  },
  {
    key: "telegram",
    label: "Telegram",
    placeholder: "https://t.me/…",
    color: "#26A5E4",
  },
] as const;

export type SocialPlatformKey = (typeof SOCIAL_PLATFORMS)[number]["key"];

export type SocialLinksMap = Partial<Record<SocialPlatformKey, string>>;

export const BUSINESS_LANGUAGES = [
  { key: "lv", labelLv: "Latviešu", labelEn: "Latvian" },
  { key: "en", labelLv: "Angļu", labelEn: "English" },
  { key: "ru", labelLv: "Krievu", labelEn: "Russian" },
  { key: "de", labelLv: "Vācu", labelEn: "German" },
  { key: "lt", labelLv: "Lietuviešu", labelEn: "Lithuanian" },
  { key: "et", labelLv: "Igauņu", labelEn: "Estonian" },
] as const;

const SOCIAL_ALIASES: Record<string, SocialPlatformKey> = {
  facebook: "facebook",
  fb: "facebook",
  instagram: "instagram",
  ig: "instagram",
  tiktok: "tiktok",
  linkedin: "linkedin",
  youtube: "youtube",
  yt: "youtube",
  x: "x",
  twitter: "x",
  whatsapp: "whatsapp",
  wa: "whatsapp",
  telegram: "telegram",
  tg: "telegram",
};

const DAY_ALIASES: Record<string, WeekdayKey> = {
  mon: "mon",
  monday: "mon",
  pirmdiena: "mon",
  tue: "tue",
  tuesday: "tue",
  otrdiena: "tue",
  wed: "wed",
  wednesday: "wed",
  trešdiena: "wed",
  thu: "thu",
  thursday: "thu",
  ceturtdiena: "thu",
  fri: "fri",
  friday: "fri",
  piektdiena: "fri",
  sat: "sat",
  saturday: "sat",
  sestdiena: "sat",
  sun: "sun",
  sunday: "sun",
  svētdiena: "sun",
};

export function parseOpeningHours(raw: unknown): OpeningHoursMap {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: OpeningHoursMap = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    const day = DAY_ALIASES[key.toLowerCase()];
    if (!day || typeof value !== "string") continue;
    const trimmed = value.trim();
    if (trimmed) out[day] = trimmed;
  }
  return out;
}

export function parseSocialLinks(raw: unknown): SocialLinksMap {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: SocialLinksMap = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    const platform = SOCIAL_ALIASES[key.toLowerCase()];
    if (!platform || typeof value !== "string") continue;
    const trimmed = value.trim();
    if (trimmed) out[platform] = trimmed;
  }
  return out;
}

export function openingHoursFromFormData(formData: FormData): OpeningHoursMap {
  const out: OpeningHoursMap = {};
  for (const day of WEEKDAY_KEYS) {
    const closed = formData.get(`hours_${day}_closed`) === "on";
    if (closed) {
      out[day] = "closed";
      continue;
    }
    const value = String(formData.get(`hours_${day}`) || "").trim();
    if (value) out[day] = value;
  }
  return out;
}

export function socialLinksFromFormData(formData: FormData): SocialLinksMap {
  const out: SocialLinksMap = {};
  for (const platform of SOCIAL_PLATFORMS) {
    const raw = String(formData.get(`social_${platform.key}`) || "").trim();
    if (!raw) continue;
    out[platform.key] = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  }
  return out;
}

export function languagesFromFormData(formData: FormData): string[] {
  const selected = formData
    .getAll("languages")
    .map((v) => String(v).trim().toLowerCase())
    .filter(Boolean);
  if (selected.length > 0) return [...new Set(selected)];
  const legacy = String(formData.get("languagesText") || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return legacy.length > 0 ? [...new Set(legacy)] : ["lv"];
}

export function formatOpeningHoursForKnowledge(
  hours: OpeningHoursMap,
  locale: "lv" | "en" = "lv",
): string | null {
  const labels =
    locale === "en"
      ? {
          mon: "Mon",
          tue: "Tue",
          wed: "Wed",
          thu: "Thu",
          fri: "Fri",
          sat: "Sat",
          sun: "Sun",
          closed: "closed",
        }
      : {
          mon: "Pirmdiena",
          tue: "Otrdiena",
          wed: "Trešdiena",
          thu: "Ceturtdiena",
          fri: "Piektdiena",
          sat: "Sestdiena",
          sun: "Svētdiena",
          closed: "slēgts",
        };

  const lines = WEEKDAY_KEYS.map((day) => {
    const value = hours[day]?.trim();
    if (!value) return null;
    const display =
      value.toLowerCase() === "closed" ? labels.closed : value;
    return `${labels[day]}: ${display}`;
  }).filter(Boolean);

  return lines.length ? lines.join("\n") : null;
}

export function formatSocialLinksForKnowledge(
  links: SocialLinksMap,
): string | null {
  const lines = SOCIAL_PLATFORMS.map((platform) => {
    const url = links[platform.key]?.trim();
    if (!url) return null;
    return `${platform.label}: ${url}`;
  }).filter(Boolean);
  return lines.length ? lines.join("\n") : null;
}
