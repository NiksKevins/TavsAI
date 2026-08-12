import type { Locale } from "@prisma/client";

export type DemoIndustryId = "beauty" | "auto" | "construction";

export type DemoKnowledgeChunk = {
  title: string;
  content: string;
  source: string;
  priority: number;
};

export type DemoIndustry = {
  id: DemoIndustryId;
  /** Display labels */
  labelLv: string;
  labelEn: string;
  businessName: string;
  description: string;
  phone: string;
  email: string;
  city: string;
  websiteUrl: string;
  assistantName: string;
  greetingLv: string;
  greetingEn: string;
  /** Suggested starter prompts shown in the demo UI */
  suggestionsLv: string[];
  suggestionsEn: string[];
  knowledge: DemoKnowledgeChunk[];
};

export const DEMO_INDUSTRIES: Record<DemoIndustryId, DemoIndustry> = {
  beauty: {
    id: "beauty",
    labelLv: "Skaistumkopšanas salons",
    labelEn: "Beauty salon",
    businessName: "Studio Aura",
    description:
      "Skaistumkopšanas salons Rīgā — matu krāsošana, griezumi, manikīrs un sejas kopšana.",
    phone: "+371 2000 1100",
    email: "info@studioaura.lv",
    city: "Rīga",
    websiteUrl: "https://studioaura.example.lv",
    assistantName: "Aura",
    greetingLv:
      "Sveiki! Esmu Aura no Studio Aura. Varu palīdzēt ar cenām, darba laiku un pierakstu.",
    greetingEn:
      "Hello! I’m Aura from Studio Aura. I can help with prices, hours, and bookings.",
    suggestionsLv: [
      "Cik maksā matu krāsošana?",
      "Kāds ir darba laiks?",
      "Vēlos pierakstīties uz manikīru",
    ],
    suggestionsEn: [
      "How much is hair coloring?",
      "What are your opening hours?",
      "I’d like to book a manicure",
    ],
    knowledge: [
      {
        title: "Pakalpojumi un cenas",
        source: "faq",
        priority: 100,
        content:
          "Matu griezums sievietēm no €35. Matu krāsošana (saknes) no €55. Pilna krāsošana no €75. Manikīrs no €28. Pedikīrs no €38. Sejas kopšanas procedūra no €45. Cenas var mainīties atkarībā no matu garuma.",
      },
      {
        title: "Darba laiks",
        source: "business",
        priority: 90,
        content:
          "Darba laiks: otrdiena–piektdiena 10:00–19:00, sestdiena 10:00–16:00. Svētdien un pirmdien slēgts. Adrese: Elizabetes iela 12, Rīga.",
      },
      {
        title: "Pieraksts",
        source: "faq",
        priority: 95,
        content:
          "Pieraksts iespējams telefoniski vai caur čatu. Pierakstam vajag vārdu, tālruni un vēlamo laiku. Atcelšana bez maksas līdz 24h pirms vizītes.",
      },
    ],
  },
  auto: {
    id: "auto",
    labelLv: "Auto serviss",
    labelEn: "Auto service",
    businessName: "Nord Auto Serviss",
    description:
      "Autoremonta un diagnostikas serviss Rīgā — BMW, Audi, VW un citi Eiropas zīmoli.",
    phone: "+371 2000 2200",
    email: "serviss@nordauto.lv",
    city: "Rīga",
    websiteUrl: "https://nordauto.example.lv",
    assistantName: "Nords",
    greetingLv:
      "Sveiki! Esmu Nords no Nord Auto Serviss. Palīdzēšu ar cenām, diagnostiku un vizītes pieteikumu.",
    greetingEn:
      "Hello! I’m Nords from Nord Auto Service. I can help with prices, diagnostics, and booking a visit.",
    suggestionsLv: [
      "Cik maksā BMW diagnostika?",
      "Vai remontējat Audi?",
      "Jā, vēlos pieteikties",
    ],
    suggestionsEn: [
      "How much is BMW diagnostics?",
      "Do you service Audi?",
      "Yes, I’d like to book",
    ],
    knowledge: [
      {
        title: "Diagnostika un cenas",
        source: "services",
        priority: 100,
        content:
          "Datorizētā diagnostika BMW, Audi, VW, Mercedes — €45. Eļļas maiņa no €65 (bez eļļas cenas). Bremžu disku maiņa no €120 par asi. Riepu maiņa + balansēšana no €25. Diagnostikas cena €45 tiek ieskaitīta remontā, ja klients turpina darbu tajā pašā dienā.",
      },
      {
        title: "Darba laiks un adrese",
        source: "business",
        priority: 90,
        content:
          "Darba laiks: pirmdiena–piektdiena 8:00–18:00, sestdiena 9:00–14:00. Svētdien slēgts. Adrese: Granīta iela 8, Rīga. Pieņemam iepriekšēju pieteikumu.",
      },
      {
        title: "Pieteikšanās",
        source: "faq",
        priority: 95,
        content:
          "Vizītes pieteikumam vajag: vārdu, tālruni, auto marku/modeli, un īsu problēmas aprakstu. Varat pieteikties čatā — asistents savāks kontaktus un nodos mehāniķu komandai.",
      },
    ],
  },
  construction: {
    id: "construction",
    labelLv: "Būvniecības uzņēmums",
    labelEn: "Construction company",
    businessName: "Baltic Build",
    description:
      "Dzīvokļu renovācija, vannasistabu pārbūve un fasāžu darbi Rīgā un Pierīgā.",
    phone: "+371 2000 3300",
    email: "info@balticbuild.lv",
    city: "Rīga",
    websiteUrl: "https://balticbuild.example.lv",
    assistantName: "Baiba",
    greetingLv:
      "Sveiki! Esmu Baiba no Baltic Build. Palīdzēšu ar pakalpojumiem, termiņiem un tāmes pieprasījumu.",
    greetingEn:
      "Hello! I’m Baiba from Baltic Build. I can help with services, timelines, and quote requests.",
    suggestionsLv: [
      "Cik maksā vannasistabas renovācija?",
      "Vai strādājat Pierīgā?",
      "Vēlos saņemt tāmi",
    ],
    suggestionsEn: [
      "How much is a bathroom renovation?",
      "Do you work in Pierīga?",
      "I’d like a quote",
    ],
    knowledge: [
      {
        title: "Pakalpojumi",
        source: "services",
        priority: 100,
        content:
          "Dzīvokļu renovācija no €280/m² (atkarībā no apdares). Vannasistabas pilna pārbūve tipiski €4500–€9000. Fasādes siltināšana no €95/m². Bezmaksas konsultācija objektā Rīgā un Pierīgā. Precīza tāme pēc apskates.",
      },
      {
        title: "Process",
        source: "faq",
        priority: 95,
        content:
          "1) Īss apraksts čatā. 2) Savācam kontaktus. 3) Objekta apskate. 4) Detalizēta tāme 3–5 darba dienu laikā. Strādājam ar juridiskām un fiziskām personām.",
      },
      {
        title: "Kontakti",
        source: "business",
        priority: 90,
        content:
          "Telefons +371 2000 3300, e-pasts info@balticbuild.lv. Darba laiks birojā: pirmdiena–piektdiena 9:00–17:00.",
      },
    ],
  },
};

export function getDemoIndustry(id: string): DemoIndustry | null {
  if (id in DEMO_INDUSTRIES) {
    return DEMO_INDUSTRIES[id as DemoIndustryId];
  }
  return null;
}

export function demoLocale(locale?: string): Locale {
  return locale === "en" ? "en" : "lv";
}
