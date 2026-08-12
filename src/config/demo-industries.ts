import type { Locale } from "@prisma/client";

export type DemoIndustryId = "beauty" | "auto" | "construction" | "tavswebs";

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
  tavswebs: {
    id: "tavswebs",
    labelLv: "TavsWebs Bot",
    labelEn: "TavsWebs Bot",
    businessName: "TavsWebs Bot",
    description:
      "Sistēma Latvijas biznesiem, kas atbild klientiem mājaslapā 24/7, apkopo leadus un palīdz nonākt līdz pieteikumam — lai nezaudētu apmeklētājus pēc darba laika.",
    phone: "+371 2000 0000",
    email: "hello@tavswebs.com",
    city: "Rīga",
    websiteUrl: "https://bot.tavswebs.com",
    assistantName: "Tavs",
    greetingLv:
      "Sveiki! Esmu Tavs no TavsWebs Bot. Varu pastāstīt, kā sistēma saglabā klientus pēc darba laika, kādas ir cenas un kā sākt bez maksas.",
    greetingEn:
      "Hi! I’m Tavs from TavsWebs Bot. I can explain how the system keeps customers after hours, what’s included, pricing, and how to start free.",
    suggestionsLv: [
      "Kā tas strādā?",
      "Cik tas maksā?",
      "Vēlos sākt bez maksas",
    ],
    suggestionsEn: [
      "How does it work?",
      "How much does it cost?",
      "I want to start free",
    ],
    knowledge: [
      {
        title: "Ko klients saņem",
        source: "business",
        priority: 100,
        content:
          "TavsWebs Bot ir sistēma jūsu mājaslapā, kas atbild uz klientu jautājumiem visu diennakti, apkopo kontaktus (leadus) un palīdz cilvēkiem pieteikties vai pierakstīties. Mērķis: nezaudēt apmeklētājus pēc darba laika un ietaupīt komandas laiku uz atkārtotiem jautājumiem. Darbojas latviešu un angļu valodā. Nav jauna aplikācija klientiem — tikai čata poga jūsu esošajā mājaslapā.",
      },
      {
        title: "Kā tas strādā",
        source: "faq",
        priority: 95,
        content:
          "Četri soļi: 1) Pievienojat mājaslapas URL. 2) Sistēma apgūst saturu (lapas, FAQ, dokumentus, pakalpojumus). 3) Ievietojat vienu koda fragmentu savā vietnē. 4) Apmeklētāji sāk saņemt atbildes, un leadi nonāk jūsu panelī. Smagas integrācijas nav vajadzīgas.",
      },
      {
        title: "Cenas",
        source: "services",
        priority: 100,
        content:
          "Free: €0, līdz 100 sarunām mēnesī. Starter: €19/mēn, 500 sarunas. Business: €39/mēn, 2000 sarunas (ieteicamais plāns). Pro: €79/mēn, 10 000 sarunas. Var sākt bez maksas, kredītkarte nav vajadzīga. Jaunināt var jebkurā brīdī no paneļa.",
      },
      {
        title: "Kas iekļauts",
        source: "faq",
        priority: 90,
        content:
          "Iekļauts: atbildes no jūsu zināšanu bāzes, leadu forma un panelis, cilvēka nodošana ar kontekstu, widget pielāgošana, latviešu un angļu valoda. Ar Google Calendar var palīdzēt pierakstīt vizītes. Leadi satur vārdu, tālruni un sarunas kontekstu.",
      },
      {
        title: "Kam piemērots",
        source: "business",
        priority: 85,
        content:
          "Piemērots Latvijas pakalpojumu biznesiem — skaistumkopšana, auto serviss, būvniecība, medicīna, juridiskie un citi uzņēmumi ar biežiem jautājumiem par cenām, darba laiku un pieejamību. Demo vietnē bot.tavswebs.com var izmēģināt arī citas nozares piemērus.",
      },
      {
        title: "Kā sākt",
        source: "faq",
        priority: 98,
        content:
          "Sāciet bez maksas vietnē bot.tavswebs.com/register. Kartes nav vajadzīgas. Pēc reģistrācijas pievienojat mājaslapu, palaidiet crawl un ievietojat widget kodu. Ja vēlaties, atstājiet vārdu un tālruni — TavsWebs komanda var sazināties un palīdzēt ar uzstādīšanu. E-pasts: hello@tavswebs.com. Galvenā vietne: tavswebs.com.",
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
