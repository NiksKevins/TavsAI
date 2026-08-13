export type ChangelogLocale = "lv" | "en";

export type ChangelogEntry = {
  /** Bump this when shipping a new release users should notice. */
  id: string;
  date: string;
  title: Record<ChangelogLocale, string>;
  /** One-line first glance on the overview banner. */
  summary: Record<ChangelogLocale, string>;
  items: Record<ChangelogLocale, string>[];
};

/**
 * Newest first. When you ship user-facing changes, add an entry at the top
 * and bump `id` so dismissed users see the banner again.
 */
export const CHANGELOG: ChangelogEntry[] = [
  {
    id: "2026-08-13-leads-chat",
    date: "2026-08-13",
    title: {
      lv: "Labāka lead uztveršana no čata",
      en: "Better lead capture from chat",
    },
    summary: {
      lv: "Vārds, e-pasts un telefons no čata tagad nonāk Leadu sarakstā.",
      en: "Name, email, and phone from chat now land in your Leads list.",
    },
    items: [
      {
        lv: "Apmeklētājs var ierakstīt kontaktus vienā ziņā — botu tos saglabā kā leadu.",
        en: "Visitors can type contacts in one message — the bot saves them as a lead.",
      },
      {
        lv: "Ja lead forma ir ieslēgta, tā parādās, kad botu lūdz kontaktus.",
        en: "When the lead form is on, it appears when the bot asks for contacts.",
      },
      {
        lv: "Tukšie handoff leadu ieraksti tiek papildināti, kad kontakti tiek iesniegti.",
        en: "Empty handoff leads are filled in once contacts are provided.",
      },
    ],
  },
  {
    id: "2026-08-12-knowledge",
    date: "2026-08-12",
    title: {
      lv: "Zināšanas un indeksācija",
      en: "Knowledge and indexing",
    },
    summary: {
      lv: "Ātrāka mājaslapas indeksācija un pakalpojumu imports no crawl.",
      en: "Faster site indexing and service import from crawl.",
    },
    items: [
      {
        lv: "Indeksācijas progresa josla Pārskatā un Zināšanās.",
        en: "Indexing progress bar on Overview and Knowledge.",
      },
      {
        lv: "Pogā \"Importēt no mājaslapas\" aizpilda pakalpojumus no crawl rezultātiem.",
        en: "“Import from website” fills services from crawl results.",
      },
      {
        lv: "Crawl vairs nepaliek iestrēdzis statusā QUEUED.",
        en: "Crawls no longer get stuck in QUEUED status.",
      },
    ],
  },
  {
    id: "2026-08-01-launch",
    date: "2026-08-01",
    title: {
      lv: "TavsWebs Bot panelis",
      en: "TavsWebs Bot dashboard",
    },
    summary: {
      lv: "Sarunas, leadi, zināšanas, widget un norēķini vienā vietā.",
      en: "Conversations, leads, knowledge, widget, and billing in one place.",
    },
    items: [
      {
        lv: "Pārskats ar metriku un uzstādīšanas kontrolsarakstu.",
        en: "Overview with metrics and a setup checklist.",
      },
      {
        lv: "Widget iestrāde mājaslapā ar lead formām un handoff.",
        en: "Website widget with lead forms and human handoff.",
      },
    ],
  },
];

export const LATEST_CHANGELOG_ID = CHANGELOG[0]?.id ?? "none";

export const WHATS_NEW_STORAGE_KEY = "tavsai.whatsNew.dismissedVersion";

export function pickChangelogText(
  value: Record<ChangelogLocale, string>,
  locale: string,
): string {
  return locale === "en" ? value.en : value.lv;
}
