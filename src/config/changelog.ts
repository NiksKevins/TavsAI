export type ChangelogLocale = "lv" | "en";

export type ChangelogImage = {
  src: string;
  alt: Record<ChangelogLocale, string>;
  caption?: Record<ChangelogLocale, string>;
};

export type ChangelogEntry = {
  /** Bump this when shipping a user-facing release people should notice. */
  id: string;
  date: string;
  title: Record<ChangelogLocale, string>;
  /** Short line for banners / sidebar context. */
  summary: Record<ChangelogLocale, string>;
  /** Longer “why it matters” paragraph shown under the title. */
  details?: Record<ChangelogLocale, string>;
  /** Bullet points — keep each item self-contained and concrete. */
  items: Record<ChangelogLocale, string>[];
  /** HD product screenshots. */
  images?: ChangelogImage[];
};

/**
 * Newest first. When you ship user-facing changes, add an entry at the top
 * and bump `id` so dismissed users see What's new again.
 */
export const CHANGELOG: ChangelogEntry[] = [
  {
    id: "2026-08-22-dashboard-polish-hd",
    date: "2026-08-22",
    title: {
      lv: "Ērtāks panelis",
      en: "Smoother dashboard",
    },
    summary: {
      lv: "Jaunumi kā lapa, klikšķināmi leadi, oficiālie integrāciju logotipi un sakārtota navigācija.",
      en: "What's new as a page, clickable leads, official integration logos, and clearer navigation.",
    },
    details: {
      lv: "Šis atjauninājums padara ikdienas darbu panelī saprotamāku: vieglāk atrast, kas mainījies; ātrāk atvērt leadu; skaidrāk redzēt, kuras kalendāra integrācijas ir pieejamas; un ērtāk pārvietoties starp Darbs / Bots / Konts sadaļām.",
      en: "This update makes day-to-day dashboard work clearer: find what changed faster, open leads with one click, see which calendar integrations are available, and move between Work / Bot / Account sections more easily.",
    },
    items: [
      {
        lv: "Jaunumi tagad ir atsevišķa lapa (/dashboard/whats-new), nevis uznirstošais logs. Kreisajā pusē ir izlaidumu saraksts, labajā — pilns apraksts ar ekrānuzņēmumiem. Nospiediet «Jaunumi» augšējā joslā, lai atvērtu.",
        en: "What's new is now its own page (/dashboard/whats-new), not a popup. Left: release list. Right: full write-up with screenshots. Open it anytime from the «What's new» button in the top bar.",
      },
      {
        lv: "Leadu tabulā visa rinda ir klikšķināma — ne tikai klienta vārds. Klikšķis jebkurā šūnā atver lead detaļas, lai ātrāk pārskatītu kontaktu, statusu un avotu.",
        en: "In the Leads table the whole row is clickable — not just the customer name. Click any cell to open lead details and review contact, status, and source faster.",
      },
      {
        lv: "Integrācijās redzami oficiālie Google Calendar, Microsoft Outlook un Calendly logotipi. Google Calendar jau var savienot; Outlook un Calendly ir atzīmēti kā «Drīzumā» tajā pašā kartīšu formātā.",
        en: "Integrations now show official Google Calendar, Microsoft Outlook, and Calendly logos. Google Calendar can be connected today; Outlook and Calendly appear as «Coming soon» in the same card layout.",
      },
      {
        lv: "Kreisā navigācija ir grupēta: Darbs (pārskats, sarunas, leadi…), Bots (zināšanas, widget, integrācijas…) un Konts (norēķini, iestatījumi). Grupas var sakļaut, lai ekrāns būtu tīrāks.",
        en: "Left navigation is grouped: Work (overview, chats, leads…), Bot (knowledge, widget, integrations…), and Account (billing, settings). Groups collapse so the sidebar stays tidy.",
      },
      {
        lv: "Tukši «Bez vārda» leadi no handoff vairs netiek radīti, ja nav kontaktinformācijas. Sarakstā paliek tikai leadi, ar kuriem varat reāli sazināties.",
        en: "Empty «Unnamed» handoff leads are no longer created without contact info. Your list keeps only leads you can actually follow up with.",
      },
      {
        lv: "Norēķinos var pievienot vairākas maksājumu kartes un pārvaldīt tās caur Stripe portālu («Pievienot karti» / «Pārvaldīt kartes»).",
        en: "Billing lets you add multiple payment cards and manage them in the Stripe portal («Add card» / «Manage cards»).",
      },
    ],
    images: [
      {
        src: "/changelog/integrations.png",
        alt: {
          lv: "Integrāciju lapa ar Google Calendar, Outlook un Calendly",
          en: "Integrations page with Google Calendar, Outlook, and Calendly",
        },
        caption: {
          lv: "Integrācijas — oficiālie logotipi un savienojuma statuss",
          en: "Integrations — official logos and connection status",
        },
      },
      {
        src: "/changelog/leads-table.png",
        alt: {
          lv: "Leadu tabula ar filtriem un klikšķināmu rindu",
          en: "Leads table with filters and a clickable row",
        },
        caption: {
          lv: "Leadi — filtrēšana un visa rinda kā saite",
          en: "Leads — filters and whole-row click",
        },
      },
      {
        src: "/changelog/jaunumi.png",
        alt: {
          lv: "Jaunumi lapa ar sarakstu un detaļu skatu",
          en: "What's new page with list and detail view",
        },
        caption: {
          lv: "Jaunumi — saraksts pa kreisi, detaļas pa labi",
          en: "What's new — list on the left, details on the right",
        },
      },
      {
        src: "/changelog/overview.png",
        alt: {
          lv: "Pārskata panelis ar metriku un navigācijas grupām",
          en: "Overview dashboard with metrics and nav groups",
        },
        caption: {
          lv: "Pārskats un navigācija Darbs / Bots / Konts",
          en: "Overview and Work / Bot / Account navigation",
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
      lv: "Kad klients čatā atstāj vārdu, e-pastu vai telefonu — tas automātiski nonāk Leadu sarakstā.",
      en: "When a visitor leaves a name, email, or phone in chat, it appears in your Leads list automatically.",
    },
    details: {
      lv: "Mērķis ir vienkāršs: jums nevajag pārrakstīt kontaktus no sarunas. Tiklīdz bots vai widget forma ievāc kontaktinformāciju, leads parādās panelī ar avotu (piemēram, widget_lead_form vai chat_extract), lai jūs zinātu, no kurienes tas nācis.",
      en: "The goal is simple: you should not retype contacts from a conversation. As soon as the bot or widget form captures contact details, a lead appears in the dashboard with a source (for example widget_lead_form or chat_extract) so you know where it came from.",
    },
    items: [
      {
        lv: "No ziņas vai lead formas tiek saglabāts vārds, e-pasts un telefons (kas ir pieejams).",
        en: "Name, email, and phone are saved from the message or lead form (whichever is available).",
      },
      {
        lv: "Leadu tabulā zem klienta vārda redzat kontaktus un avotu — ērti filtrēt un atvērt detaļas ar vienu klikšķi.",
        en: "Under the customer name you see contact details and source — easy to filter and open with one click.",
      },
      {
        lv: "Ja kontakta nav, tukšs «Bez vārda» leads netiek radīts (skat. arī 22.08. atjauninājumu), lai saraksts nepaliktu ar tukšiem ierakstiem.",
        en: "If there is no contact info, an empty «Unnamed» lead is not created (see also the Aug 22 update), so the list does not fill with blank rows.",
      },
    ],
    images: [
      {
        src: "/changelog/leads-table.png",
        alt: {
          lv: "Leadu saraksts ar kontaktiem no čata un avotu widget_lead_form",
          en: "Leads list with chat contacts and widget_lead_form source",
        },
        caption: {
          lv: "Leadi — kontakti un avots no widget / čata",
          en: "Leads — contacts and source from widget / chat",
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
      lv: "Mājaslapas indeksācija ar progresa joslu, statistiku un skaidru statusu — plus pakalpojumu imports.",
      en: "Website indexing with a progress bar, stats, and clear status — plus service import.",
    },
    details: {
      lv: "Zināšanu sadaļā «Mājaslapa» tagad redzat, kas notiek indeksācijas laikā: cik lapas atrastas, cik apstrādātas, cik tālu process ir procentos, un cik ilgi tas jau darbojas. Pakalpojumu cilnē varat importēt piedāvājumu no vietnes un pēc tam manuāli labot.",
      en: "In Knowledge → Website you can see what indexing is doing: pages found, pages processed, percent complete, and elapsed time. In the Services tab you can import offerings from the site and edit them afterward.",
    },
    items: [
      {
        lv: "Palaidiet indeksāciju ar vietnes URL — statusa kartītē redzams fāzes teksts, procenti un laiks.",
        en: "Start indexing with your site URL — the status card shows phase text, percent, and elapsed time.",
      },
      {
        lv: "Statistika: atrastās lapas, apstrādātās lapas un limits — lai saprastu, vai process vēl turpinās vai ir sasniedzis limitu.",
        en: "Stats: pages found, pages processed, and the limit — so you know whether indexing is still running or hit the cap.",
      },
      {
        lv: "Varat indeksēt vēlreiz vai atcelt. Pakalpojumu cilnē — «Importēt no mājaslapas», tad labot nosaukumu, aprakstu, cenu un ilgumu.",
        en: "You can re-run or cancel. In Services use «Import from website», then edit name, description, price, and duration.",
      },
    ],
    images: [
      {
        src: "/changelog/knowledge-index.png",
        alt: {
          lv: "Zināšanu mājaslapas cilne ar indeksācijas progresu un statistiku",
          en: "Knowledge website tab with indexing progress and stats",
        },
        caption: {
          lv: "Indeksācija — progress, % un lapu skaits",
          en: "Indexing — progress, %, and page counts",
        },
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
      lv: "Sarunas, leadi, zināšanas, widget un norēķini — viss vienā darba panelī.",
      en: "Chats, leads, knowledge, widget, and billing — all in one workspace.",
    },
    details: {
      lv: "TavsWebs Bot panelis ir vieta, kur pārvaldāt AI asistentu savai mājaslapai: skatīt aktivitāti pārskatā, mācīt botu ar zināšanām, iestatīt widgetu, sekot leadiem un pierakstiem, kā arī pārvaldīt abonementu.",
      en: "The TavsWebs Bot dashboard is where you run your website AI assistant: monitor activity on Overview, train the bot with Knowledge, configure the widget, follow leads and bookings, and manage your subscription.",
    },
    items: [
      {
        lv: "Pārskats: galvenās metrikas (sarunas, leadi, pieraksti), grafiki un iestatīšanas kontrolsaraksts.",
        en: "Overview: key metrics (chats, leads, bookings), charts, and a setup checklist.",
      },
      {
        lv: "Zināšanas: mājaslapas indekss, pakalpojumi, BUJ, dokumenti un uzņēmuma profils — lai bots atbildētu precīzi.",
        en: "Knowledge: site index, services, FAQ, documents, and business profile — so the bot answers accurately.",
      },
      {
        lv: "Widget un Integrācijas: ieguliet čatu mājaslapā un (pēc izvēles) savienojiet kalendāru pierakstiem.",
        en: "Widget and Integrations: embed chat on your site and optionally connect a calendar for bookings.",
      },
      {
        lv: "Norēķini un iestatījumi: plāns, limitu izmantošana un darba telpas iestatījumi vienuviet.",
        en: "Billing and settings: plan, usage limits, and workspace settings in one place.",
      },
    ],
    images: [
      {
        src: "/changelog/overview.png",
        alt: {
          lv: "Pārskata panelis ar metriku, grafiku un kontrolsarakstu",
          en: "Overview dashboard with metrics, chart, and checklist",
        },
        caption: {
          lv: "Pārskats — sākuma skats pēc ielogošanās",
          en: "Overview — home view after sign-in",
        },
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
