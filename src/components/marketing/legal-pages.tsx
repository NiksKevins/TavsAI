import { getTranslations } from "next-intl/server";

import {
  MarketingContainer,
  MarketingPageHero,
  MarketingSection,
} from "@/components/marketing/marketing-ui";

export async function LegalPrivacyPage() {
  const t = await getTranslations("legal");
  const keys = ["controller", "data", "payments", "retention", "cookies"] as const;

  return (
    <>
      <MarketingPageHero title={t("privacyTitle")} subtitle={t("privacyIntro")} />
      <MarketingSection tone="plain" className="pt-0">
        <MarketingContainer narrow className="space-y-8">
          {keys.map((key) => (
            <section key={key}>
              <h2 className="font-display text-xl font-semibold tracking-tight">
                {t(`sections.${key}.title`)}
              </h2>
              <p className="mt-3 text-base leading-relaxed text-ink-soft">
                {t(`sections.${key}.body`)}
              </p>
            </section>
          ))}
        </MarketingContainer>
      </MarketingSection>
    </>
  );
}

export async function LegalCookiesPage() {
  const t = await getTranslations("legal");

  return (
    <>
      <MarketingPageHero
        title={t("cookiesTitle")}
        subtitle={t("sections.cookies.body")}
      />
      <MarketingSection tone="plain" className="pt-0">
        <MarketingContainer narrow className="space-y-6">
          <section>
            <h2 className="font-display text-xl font-semibold tracking-tight">
              {t("sections.payments.title")}
            </h2>
            <p className="mt-3 text-base leading-relaxed text-ink-soft">
              {t("sections.payments.body")}
            </p>
          </section>
        </MarketingContainer>
      </MarketingSection>
    </>
  );
}
