import type {
  AnalyticsSnapshot,
  TopicKey,
} from "@/services/analytics/analytics-service";

const TOPIC_LV: Record<Exclude<TopicKey, "other">, string> = {
  price: "cenu",
  hours: "darba laiku / sestdienas pieejamību",
  booking: "pierakstiem",
  location: "atrašanās vietu",
  services: "pakalpojumiem",
};

const TOPIC_EN: Record<Exclude<TopicKey, "other">, string> = {
  price: "pricing",
  hours: "opening hours / weekend availability",
  booking: "booking",
  location: "location",
  services: "services",
};

/**
 * Natural-language insight from stored aggregates only.
 * Returns null when there is not enough data — never invents stats.
 */
export function buildBusinessInsight(
  snapshot: AnalyticsSnapshot,
  locale: "lv" | "en",
): string | null {
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
          ? "In the last 30 days"
          : "In the last 90 days";

  if (snapshot.conversations === 0 && snapshot.leads === 0) {
    return null;
  }

  const parts: string[] = [];
  const topics = snapshot.topQuestions
    .filter((t) => t.topic !== "other" && t.count > 0)
    .slice(0, 2);

  if (topics.length > 0) {
    const labels = topics.map((t) =>
      locale === "lv"
        ? TOPIC_LV[t.topic as Exclude<TopicKey, "other">]
        : TOPIC_EN[t.topic as Exclude<TopicKey, "other">],
    );
    if (locale === "lv") {
      parts.push(
        topics.length === 1
          ? `${period} klienti visbiežāk interesējās par ${labels[0]} (${topics[0].count} jautājumi).`
          : `${period} klienti visbiežāk interesējās par ${labels[0]} un ${labels[1]} (${topics[0].count} un ${topics[1].count} jautājumi).`,
      );
    } else {
      parts.push(
        topics.length === 1
          ? `${period} customers most often asked about ${labels[0]} (${topics[0].count} questions).`
          : `${period} customers most often asked about ${labels[0]} and ${labels[1]} (${topics[0].count} and ${topics[1].count} questions).`,
      );
    }
  } else if (snapshot.conversations > 0) {
    parts.push(
      locale === "lv"
        ? `${period} bija ${snapshot.conversations} sarunas.`
        : `${period} there were ${snapshot.conversations} conversations.`,
    );
  }

  if (snapshot.leads > 0) {
    const rate =
      snapshot.leadConversionRate != null
        ? Math.round(snapshot.leadConversionRate * 100)
        : null;
    if (locale === "lv") {
      parts.push(
        rate != null
          ? `Izveidoti ${snapshot.leads} lead${snapshot.leads === 1 ? "s" : "i"} (konversija ${rate}% no sarunām); kvalificēti ${snapshot.qualifiedLeads}, uzvarēti ${snapshot.wonLeads}.`
          : `Izveidoti ${snapshot.leads} leadi.`,
      );
    } else {
      parts.push(
        rate != null
          ? `${snapshot.leads} lead${snapshot.leads === 1 ? "" : "s"} created (${rate}% conversion from conversations); ${snapshot.qualifiedLeads} qualified, ${snapshot.wonLeads} won.`
          : `${snapshot.leads} leads created.`,
      );
    }
  }

  if (snapshot.humanHandoffs > 0 || snapshot.unansweredCount > 0) {
    if (locale === "lv") {
      parts.push(
        `Cilvēka nodošanas: ${snapshot.humanHandoffs}. Neatbildēti / rezerves gadījumi: ${snapshot.unansweredCount}.`,
      );
    } else {
      parts.push(
        `Human handoffs: ${snapshot.humanHandoffs}. Unanswered / fallback cases: ${snapshot.unansweredCount}.`,
      );
    }
  }

  if (snapshot.aiResolutionRate != null && snapshot.conversations > 0) {
    const pct = Math.round(snapshot.aiResolutionRate * 100);
    parts.push(
      locale === "lv"
        ? `AI atrisināšanas rādītājs: ${pct}%.`
        : `AI resolution rate: ${pct}%.`,
    );
  }

  return parts.length ? parts.join(" ") : null;
}
