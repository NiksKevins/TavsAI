import { getLocale, getTranslations } from "next-intl/server";

export type MarketingDict = Awaited<ReturnType<typeof getMarketingDict>>;

function numbered(t: Awaited<ReturnType<typeof getTranslations>>, prefix: string, count: number) {
  return Array.from({ length: count }, (_, i) => t(`${prefix}.${i}`));
}

export async function getMarketingDict() {
  const t = await getTranslations("marketing");
  const demo = await getTranslations("marketing.demo");
  const home = await getTranslations("home");
  const locale = await getLocale();

  return {
    locale,
    brand: home("brand"),
    headline: t("hero.headline"),
    subhead: t("hero.subhead"),
    ctaPrimary: t("hero.ctaPrimary"),
    ctaSecondary: t("hero.ctaSecondary"),
    heroProof: t("hero.proof"),
    heroTrust: t("hero.trust"),
    heroTryHint: t("hero.tryHint"),
    demoTitle: demo("title"),
    demoSubtitle: demo("subtitle"),
    demoChoose: demo("choose"),
    solutionFootnote: t("solution.footnote"),
    visuals: {
      showcaseTitle: t("visuals.showcaseTitle"),
      showcaseSubtitle: t("visuals.showcaseSubtitle"),
      siteUrl: t("visuals.siteUrl"),
      siteHeadline: t("visuals.siteHeadline"),
      siteNav: [
        t("visuals.siteNav.0"),
        t("visuals.siteNav.1"),
        t("visuals.siteNav.2"),
      ],
      chatAssistant: t("visuals.chatAssistant"),
      chatBusiness: t("visuals.chatBusiness"),
      chatUserMsg: t("visuals.chatUserMsg"),
      chatBotMsg: t("visuals.chatBotMsg"),
      badge247: t("visuals.badge247"),
      badgeLead: t("visuals.badgeLead"),
      cardWidgetTitle: t("visuals.cardWidgetTitle"),
      cardWidgetBody: t("visuals.cardWidgetBody"),
      cardKnowledgeTitle: t("visuals.cardKnowledgeTitle"),
      cardKnowledgeBody: t("visuals.cardKnowledgeBody"),
      cardLeadsTitle: t("visuals.cardLeadsTitle"),
      cardLeadsBody: t("visuals.cardLeadsBody"),
      leadName: t("visuals.leadName"),
      leadPhone: t("visuals.leadPhone"),
      leadStatus: t("visuals.leadStatus"),
      knowledgeWebsite: t("visuals.knowledgeWebsite"),
      knowledgeFaq: t("visuals.knowledgeFaq"),
      knowledgeDocs: t("visuals.knowledgeDocs"),
    },
    bridge: {
      howTitle: t("homeBridge.howTitle"),
      howBody: t("homeBridge.howBody"),
      pricingTitle: t("homeBridge.pricingTitle"),
      pricingBody: t("homeBridge.pricingBody"),
      linkLabel: t("homeBridge.linkLabel"),
    },
    problem: {
      eyebrow: t("problem.eyebrow"),
      title: t("problem.title"),
      items: numbered(t, "problem.items", 5),
      hint: t("problem.hint"),
    },
    solution: {
      eyebrow: t("solution.eyebrow"),
      title: t("solution.title"),
      subtitle: t("solution.subtitle"),
      items: [
        { title: t("solution.items.0.title"), body: t("solution.items.0.body") },
        { title: t("solution.items.1.title"), body: t("solution.items.1.body") },
        { title: t("solution.items.2.title"), body: t("solution.items.2.body") },
        { title: t("solution.items.3.title"), body: t("solution.items.3.body") },
        { title: t("solution.items.4.title"), body: t("solution.items.4.body") },
        { title: t("solution.items.5.title"), body: t("solution.items.5.body") },
      ],
    },
    details: {
      eyebrow: t("details.eyebrow"),
      title: t("details.title"),
      subtitle: t("details.subtitle"),
      items: [
        { title: t("details.items.0.title"), body: t("details.items.0.body") },
        { title: t("details.items.1.title"), body: t("details.items.1.body") },
        { title: t("details.items.2.title"), body: t("details.items.2.body") },
        { title: t("details.items.3.title"), body: t("details.items.3.body") },
        { title: t("details.items.4.title"), body: t("details.items.4.body") },
        { title: t("details.items.5.title"), body: t("details.items.5.body") },
      ],
    },
    how: {
      eyebrow: t("how.eyebrow"),
      title: t("how.title"),
      steps: [
        { title: t("how.steps.0.title"), body: t("how.steps.0.body") },
        { title: t("how.steps.1.title"), body: t("how.steps.1.body") },
        { title: t("how.steps.2.title"), body: t("how.steps.2.body") },
        { title: t("how.steps.3.title"), body: t("how.steps.3.body") },
      ],
    },
    industries: {
      eyebrow: t("industries.eyebrow"),
      title: t("industries.title"),
      subtitle: t("industries.subtitle"),
      items: numbered(t, "industries.items", 8),
    },
    pricing: {
      eyebrow: t("pricing.eyebrow"),
      title: t("pricing.title"),
      subtitle: t("pricing.subtitle"),
      perMonth: t("pricing.perMonth"),
      conversations: t.raw("pricing.conversations") as string,
      recommended: t("pricing.recommended"),
      cta: t("pricing.cta"),
      setupTitle: t("pricing.setupTitle"),
      setupPrice: t("pricing.setupPrice"),
      setupOnce: t("pricing.setupOnce"),
      setupBody: t("pricing.setupBody"),
      setupIncludes: numbered(t, "pricing.setupIncludes", 4),
      setupNote: t("pricing.setupNote"),
      monthlyTitle: t("pricing.monthlyTitle"),
      features: {
        FREE: numbered(t, "pricing.features.FREE", 4),
        STARTER: numbered(t, "pricing.features.STARTER", 4),
        BUSINESS: numbered(t, "pricing.features.BUSINESS", 4),
        PRO: numbered(t, "pricing.features.PRO", 4),
      },
    },
    faq: {
      eyebrow: t("faq.eyebrow"),
      title: t("faq.title"),
      items: Array.from({ length: 10 }, (_, i) => ({
        q: t(`faq.items.${i}.q`),
        a: t(`faq.items.${i}.a`),
      })),
    },
    finalCta: {
      title: t("finalCta.title"),
      cta: t("finalCta.cta"),
      eyebrow: t("finalCta.eyebrow"),
    },
  };
}
