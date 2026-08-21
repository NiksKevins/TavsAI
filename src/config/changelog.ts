export type ChangelogLocale = "lv" | "en";

export type ChangelogImage = {
  src: string;
  alt: Record<ChangelogLocale, string>;
  caption?: Record<ChangelogLocale, string>;
};

export type ChangelogEntry = {
  /** Bump this when shipping a new release users should notice. */
  id: string;
  date: string;
  title: Record<ChangelogLocale, string>;
  /** One-line first glance on the overview banner. */
  summary: Record<ChangelogLocale, string>;
  items: Record<ChangelogLocale, string>[];
  /** Screenshots from the live product UI. */
  images?: ChangelogImage[];
};

/**
 * Newest first. When you ship user-facing changes, add an entry at the top
 * and bump `id` so dismissed users see the banner again.
 */
export const CHANGELOG: ChangelogEntry[] = [
  {
    id: "2026-08-22-dashboard-polish",
    date: "2026-08-22",
    title: {
      lv: "Ērtāks panelis",
      en: "Smoother dashboard",
    },
    summary: {
      lv: "Jaunumi kā lapa, ātrāki leadi un skaidrākas integrācijas.",
      en: "What's new as a page, faster leads, clearer integrations.",
    },
    items: [
      {
        lv: "Jaunumi tagad ir atsevišķa lapa — vairs ne uznirstošais logs.",
        en: "What's new is its own page — no more popup.",
      },
      {
        lv: "Leadu tabulā klikšķiniet jebkurā rindas vietā, lai atvērtu detaļas.",
        en: "Click anywhere on a leads row to open the detail.",
      },
      {
        lv: "Integrācijās oficiālie Google Calendar, Outlook un Calendly logotipi.",
        en: "Official Google Calendar, Outlook, and Calendly logos on Integrations.",
      },
      {
        lv: "Navigācija grupēta: Darbs, Bots un Konts — sadaļas var sakļaut.",
        en: "Nav grouped into Work, Bot, and Account — sections collapse.",
      },
      {
        lv: "Tukši „Bez vārda” leadi no handoff vairs netiek radīti bez kontakta.",
        en: "Empty unnamed handoff leads are no longer created without contact info.",
      },
    ],
    images: [
      {
        src: "/changelog/integrations.png",
        alt: {
          lv: "Integrāciju lapa ar Google Calendar, Outlook un Calendly logotipiem",
          en: "Integrations page with Google Calendar, Outlook, and Calendly logos",
        },
        caption: {
          lv: "Integrācijas — oficiālie logotipi",
          en: "Integrations — official logos",
        },
      },
      {
        src: "/changelog/leads-table.png",
        alt: {
          lv: "Leadu tabula ar klientu, statusu un avotu",
          en: "Leads table with customer, status, and source",
        },
        caption: {
          lv: "Leadi — visa rinda ir klikšķināma",
          en: "Leads — whole row is clickable",
        },
      },
    ],
  },
  {
    id: "2026-08-13-leads-chat",
    date: "2026-08-13",
    title: {
      lv: "Leadi no čata",
      en: "Leads from chat",
    },
    summary: {
      lv: "Kontakti no čata tagad nonāk Leadu sarakstā.",
      en: "Chat contacts now show up in Leads.",
    },
    items: [
      {
        lv: "Vārds, e-pasts un telefons no ziņas tiek saglabāti.",
        en: "Name, email, and phone from a message are saved.",
      },
    ],
    images: [
      {
        src: "/changelog/leads-table.png",
        alt: {
          lv: "Leadu saraksts ar vārdu, tālruni un e-pastu no čata",
          en: "Leads list with name, phone, and email captured from chat",
        },
        caption: {
          lv: "Leadi — kontakti no čata (piem. widget_lead_form)",
          en: "Leads — contacts from chat (e.g. widget_lead_form)",
        },
      },
    ],
  },
  {
    id: "2026-08-12-knowledge",
    date: "2026-08-12",
    title: {
      lv: "Ātrāka indeksācija",
      en: "Faster indexing",
    },
    summary: {
      lv: "Mājaslapas saturs un pakalpojumi — vieglāk importēt.",
      en: "Website content and services — easier to import.",
    },
    items: [
      {
        lv: "Progresa josla un imports no mājaslapas.",
        en: "Progress bar and import from your website.",
      },
    ],
  },
  {
    id: "2026-08-01-launch",
    date: "2026-08-01",
    title: {
      lv: "Panelis",
      en: "Dashboard",
    },
    summary: {
      lv: "Sarunas, leadi un widget vienā vietā.",
      en: "Chats, leads, and widget in one place.",
    },
    items: [
      {
        lv: "Pārskats, zināšanas un norēķini.",
        en: "Overview, knowledge, and billing.",
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
