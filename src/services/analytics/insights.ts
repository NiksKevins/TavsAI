import type {
  AnalyticsSnapshot,
  TopicKey,
} from "@/services/analytics/analytics-service";

const TOPIC_LV: Record<Exclude<TopicKey, "other">, string> = {
  price: "Cena",
  hours: "Darba laiks",
  booking: "Pieraksti",
  location: "Atrašanās vieta",
  services: "Pakalpojumi",
};

const TOPIC_LV_ABOUT: Record<Exclude<TopicKey, "other">, string> = {
  price: "cenu",
  hours: "darba laiku",
  booking: "pierakstiem",
  location: "atrašanās vietu",
  services: "pakalpojumiem",
};

const TOPIC_EN: Record<Exclude<TopicKey, "other">, string> = {
  price: "Pricing",
  hours: "Opening hours",
  booking: "Booking",
  location: "Location",
  services: "Services",
};

export type InsightHighlight = {
  label: string;
  value: string;
  hint?: string;
};

export type BusinessInsight = {
  period: string;
  summary: string;
  highlights: InsightHighlight[];
};

/**
 * Structured insight from stored aggregates only.
 * Returns null when there is not enough data — never invents stats.
 */
export function buildBusinessInsight(
  snapshot: AnalyticsSnapshot,
  locale: "lv" | "en",
): BusinessInsight | null {
  const period =
    locale === "lv"
      ? snapshot.range === 7
        ? "Šonedēļ"
        : snapshot.range === 30
          ? "Pēdējās 30 dienās"
          : "Pēdējās 90 dienās"
      : snapshot.range === 7
        ? "This week"
        : snapshot.range === 30
          ? "Last 30 days"
          : "Last 90 days";

  if (snapshot.conversations === 0 && snapshot.leads === 0) {
    return null;
  }

  const topics = snapshot.topQuestions
    .filter((t) => t.topic !== "other" && t.count > 0)
    .slice(0, 2);

  const highlights: InsightHighlight[] = [];

  if (topics.length > 0) {
    highlights.push({
      label: locale === "lv" ? "Biežākie jautājumi" : "Top questions",
      value: topics
        .map((t) => {
          const name =
            locale === "lv"
              ? TOPIC_LV[t.topic as Exclude<TopicKey, "other">]
              : TOPIC_EN[t.topic as Exclude<TopicKey, "other">];
          return `${name} (${t.count})`;
        })
        .join(" · "),
    });
  }

  if (snapshot.leads > 0) {
    const rate =
      snapshot.leadConversionRate != null
        ? Math.round(snapshot.leadConversionRate * 100)
        : null;
    highlights.push({
      label: locale === "lv" ? "Leadi" : "Leads",
      value: String(snapshot.leads),
      hint:
        rate != null
          ? locale === "lv"
            ? `${rate}% no sarunām`
            : `${rate}% of chats`
          : undefined,
    });
    highlights.push({
      label: locale === "lv" ? "Kvalificēti / uzvarēti" : "Qualified / won",
      value: `${snapshot.qualifiedLeads} / ${snapshot.wonLeads}`,
    });
  }

  if (snapshot.humanHandoffs > 0) {
    highlights.push({
      label: locale === "lv" ? "Nodošanas cilvēkam" : "Human handoffs",
      value: String(snapshot.humanHandoffs),
    });
  }

  if (snapshot.unansweredCount > 0) {
    highlights.push({
      label: locale === "lv" ? "Neatbildēti" : "Unanswered",
      value: String(snapshot.unansweredCount),
      hint: locale === "lv" ? "rezerves atbildes" : "fallback replies",
    });
  }

  if (snapshot.aiResolutionRate != null && snapshot.conversations > 0) {
    highlights.push({
      label: locale === "lv" ? "AI atrisināšana" : "AI resolution",
      value: `${Math.round(snapshot.aiResolutionRate * 100)}%`,
    });
  }

  let summary: string;
  if (topics.length > 0) {
    const names = topics.map((t) =>
      locale === "lv"
        ? TOPIC_LV_ABOUT[t.topic as Exclude<TopicKey, "other">]
        : TOPIC_EN[t.topic as Exclude<TopicKey, "other">].toLowerCase(),
    );
    summary =
      locale === "lv"
        ? topics.length === 1
          ? `${period} klienti visbiežāk jautāja par ${names[0]}.`
          : `${period} klienti visbiežāk jautāja par ${names[0]} un ${names[1]}.`
        : topics.length === 1
          ? `${period}, customers most often asked about ${names[0]}.`
          : `${period}, customers most often asked about ${names[0]} and ${names[1]}.`;
  } else {
    summary =
      locale === "lv"
        ? `${period} bija ${snapshot.conversations} sarunas.`
        : `${period}: ${snapshot.conversations} conversations.`;
  }

  return { period, summary, highlights };
}
