import { getLocale, getTranslations } from "next-intl/server";

export type MarketingDict = Awaited<ReturnType<typeof getMarketingDict>>;

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
      items: [
        t("problem.items.0"),
        t("problem.items.1"),
        t("problem.items.2"),
        t("problem.items.3"),
      ],
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
      items: [
        t("industries.items.0"),
        t("industries.items.1"),
        t("industries.items.2"),
        t("industries.items.3"),
        t("industries.items.4"),
        t("industries.items.5"),
        t("industries.items.6"),
        t("industries.items.7"),
      ],
    },
    pricing: {
      eyebrow: t("pricing.eyebrow"),
      title: t("pricing.title"),
      subtitle: t("pricing.subtitle"),
      perMonth: t("pricing.perMonth"),
      conversations: t.raw("pricing.conversations"),
      recommended: t("pricing.recommended"),
      cta: t("pricing.cta"),
      features: {
        FREE: [
          t("pricing.features.FREE.0"),
          t("pricing.features.FREE.1"),
          t("pricing.features.FREE.2"),
        ],
        STARTER: [
          t("pricing.features.STARTER.0"),
          t("pricing.features.STARTER.1"),
          t("pricing.features.STARTER.2"),
        ],
        BUSINESS: [
          t("pricing.features.BUSINESS.0"),
          t("pricing.features.BUSINESS.1"),
          t("pricing.features.BUSINESS.2"),
          t("pricing.features.BUSINESS.3"),
        ],
        PRO: [
          t("pricing.features.PRO.0"),
          t("pricing.features.PRO.1"),
          t("pricing.features.PRO.2"),
          t("pricing.features.PRO.3"),
        ],
      },
    },
    faq: {
      eyebrow: t("faq.eyebrow"),
      title: t("faq.title"),
      items: [
        { q: t("faq.items.0.q"), a: t("faq.items.0.a") },
        { q: t("faq.items.1.q"), a: t("faq.items.1.a") },
        { q: t("faq.items.2.q"), a: t("faq.items.2.a") },
        { q: t("faq.items.3.q"), a: t("faq.items.3.a") },
        { q: t("faq.items.4.q"), a: t("faq.items.4.a") },
        { q: t("faq.items.5.q"), a: t("faq.items.5.a") },
      ],
    },
    finalCta: {
      title: t("finalCta.title"),
      cta: t("finalCta.cta"),
      eyebrow: t("finalCta.eyebrow"),
    },
  };
}
