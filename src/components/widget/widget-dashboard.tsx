"use client";

import { Check, Copy, ExternalLink, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { useActionState, useMemo, useState } from "react";

import {
  updateWidgetConfigAction,
  type WidgetActionResult,
} from "@/actions/widget";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const COLOR_PRESETS = [
  "#0F5C4C",
  "#1B4D6E",
  "#7A3E2B",
  "#2F3A4A",
  "#0E7490",
  "#4338CA",
  "#B45309",
  "#BE123C",
];

type Props = {
  appUrl: string;
  widget: {
    publicKey: string;
    primaryColor: string;
    position: string;
    theme: string;
    borderRadius: number;
    launcherTextLv: string | null;
    welcomeMessageLv: string | null;
    logoUrl: string | null;
    quickActions: string[];
    leadFormEnabled: boolean;
    isActive: boolean;
    lastLoadedAt: string | null;
    allowedOrigins: string[];
  };
};

export function WidgetDashboard({ appUrl, widget }: Props) {
  const t = useTranslations("widgetAdmin");
  const [copied, setCopied] = useState(false);
  const [color, setColor] = useState(widget.primaryColor);
  const [radius, setRadius] = useState(widget.borderRadius);
  const [position, setPosition] = useState(widget.position);
  const [theme, setTheme] = useState(widget.theme);
  const [leadFormEnabled, setLeadFormEnabled] = useState(widget.leadFormEnabled);
  const [isActive, setIsActive] = useState(widget.isActive);
  const [previewKey, setPreviewKey] = useState(0);
  const [state, action, pending] = useActionState<
    WidgetActionResult | null,
    FormData
  >(async (prev, formData) => {
    const result = await updateWidgetConfigAction(prev, formData);
    if (result.ok) setPreviewKey((k) => k + 1);
    return result;
  }, null);

  const snippet = useMemo(
    () =>
      `<script\n  src="${appUrl}/widget.js"\n  data-widget-id="${widget.publicKey}"\n  async\n></script>`,
    [appUrl, widget.publicKey],
  );

  const reactSnippet = useMemo(
    () =>
      `useEffect(() => {\n  const s = document.createElement("script");\n  s.src = "${appUrl}/widget.js";\n  s.async = true;\n  s.dataset.widgetId = "${widget.publicKey}";\n  document.body.appendChild(s);\n  return () => { s.remove(); };\n}, []);`,
    [appUrl, widget.publicKey],
  );

  const nextSnippet = useMemo(
    () =>
      `import Script from "next/script";\n\n<Script\n  src="${appUrl}/widget.js"\n  strategy="afterInteractive"\n  data-widget-id="${widget.publicKey}"\n/>`,
    [appUrl, widget.publicKey],
  );

  async function copy(text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            {t("title")}
          </h1>
          <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={widget.lastLoadedAt ? "success" : "secondary"}>
            {widget.lastLoadedAt
              ? t("status.installed")
              : t("status.notInstalled")}
          </Badge>
          <Badge variant={isActive ? "default" : "outline"}>
            {isActive ? t("status.live") : t("status.paused")}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
        <div className="space-y-6">
          <Card className="overflow-hidden shadow-sm">
            <CardHeader className="border-b border-border/70 bg-[linear-gradient(180deg,#fffcf8,#f7f6f3)]">
              <CardTitle>{t("install.title")}</CardTitle>
              <CardDescription>{t("install.subtitle")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <Tabs defaultValue="html">
                <TabsList className="h-auto w-full flex-wrap justify-start gap-1">
                  <TabsTrigger value="html">HTML</TabsTrigger>
                  <TabsTrigger value="wordpress">WordPress</TabsTrigger>
                  <TabsTrigger value="react">React</TabsTrigger>
                  <TabsTrigger value="next">Next.js</TabsTrigger>
                </TabsList>
                <TabsContent value="html" className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    {t("install.guides.html")}
                  </p>
                  <CodeBlock value={snippet} />
                </TabsContent>
                <TabsContent value="wordpress" className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    {t("install.guides.wordpress")}
                  </p>
                  <CodeBlock value={snippet} />
                </TabsContent>
                <TabsContent value="react" className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    {t("install.guides.react")}
                  </p>
                  <CodeBlock value={reactSnippet} />
                </TabsContent>
                <TabsContent value="next" className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    {t("install.guides.next")}
                  </p>
                  <CodeBlock value={nextSnippet} />
                </TabsContent>
              </Tabs>

              <div className="flex flex-wrap gap-2">
                <Button type="button" onClick={() => void copy(snippet)}>
                  {copied ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      {t("install.copied")}
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-4 w-4" />
                      {t("install.copy")}
                    </>
                  )}
                </Button>
                <Button asChild variant="outline">
                  <a
                    href={`/demo/widget?id=${widget.publicKey}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    {t("install.test")}
                  </a>
                </Button>
                <Button asChild variant="outline">
                  <a
                    href={`/widget-demo.html?id=${widget.publicKey}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {t("install.htmlDemo")}
                  </a>
                </Button>
              </div>
              <p className="rounded-md border border-border/80 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                {t("install.publicKeyHint")}{" "}
                <code className="text-foreground">{widget.publicKey}</code>
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <CardTitle>{t("config.title")}</CardTitle>
              </div>
              <CardDescription>{t("config.subtitle")}</CardDescription>
            </CardHeader>
            <CardContent>
              <form action={action} className="space-y-8">
                <input type="hidden" name="primaryColor" value={color} />
                <input type="hidden" name="borderRadius" value={radius} />
                <input type="hidden" name="position" value={position} />
                <input type="hidden" name="theme" value={theme} />
                {leadFormEnabled ? (
                  <input type="hidden" name="leadFormEnabled" value="on" />
                ) : null}
                {isActive ? (
                  <input type="hidden" name="isActive" value="on" />
                ) : null}

                <section className="space-y-4">
                  <SectionHeading
                    title={t("config.sections.look")}
                    hint={t("config.sections.lookHint")}
                  />

                  <div className="space-y-3">
                    <Label>{t("config.color")}</Label>
                    <p className="text-xs text-muted-foreground">
                      {t("config.colorHint")}
                    </p>
                    <div className="flex flex-wrap items-center gap-3">
                      <label className="relative inline-flex h-12 w-12 cursor-pointer overflow-hidden rounded-full border border-border shadow-inner ring-offset-background transition hover:ring-2 hover:ring-ring">
                        <span
                          className="absolute inset-0"
                          style={{ background: color }}
                        />
                        <input
                          type="color"
                          value={normalizeHex(color)}
                          onChange={(e) =>
                            setColor(e.target.value.toUpperCase())
                          }
                          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                          aria-label={t("config.color")}
                        />
                      </label>
                      <Input
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        className="max-w-[9rem] font-mono uppercase"
                        pattern="^#[0-9A-Fa-f]{6}$"
                        maxLength={7}
                      />
                      <div
                        className="hidden h-10 flex-1 rounded-md border border-border sm:block"
                        style={{
                          background: `linear-gradient(90deg, ${color}, ${color}99)`,
                        }}
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {COLOR_PRESETS.map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          title={preset}
                          onClick={() => setColor(preset)}
                          className={cn(
                            "h-8 w-8 rounded-full border border-black/10 shadow-sm transition hover:scale-105",
                            color.toUpperCase() === preset &&
                              "ring-2 ring-ring ring-offset-2",
                          )}
                          style={{ background: preset }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-3">
                      <Label>{t("config.theme")}</Label>
                      <p className="text-xs text-muted-foreground">
                        {t("config.themeHint")}
                      </p>
                      <Segmented
                        value={theme}
                        onChange={setTheme}
                        options={[
                          { value: "light", label: t("config.themeLight") },
                          { value: "dark", label: t("config.themeDark") },
                        ]}
                      />
                    </div>
                    <div className="space-y-3">
                      <Label>{t("config.position")}</Label>
                      <p className="text-xs text-muted-foreground">
                        {t("config.positionHint")}
                      </p>
                      <Segmented
                        value={position}
                        onChange={setPosition}
                        options={[
                          {
                            value: "bottom-right",
                            label: t("config.positionRight"),
                          },
                          {
                            value: "bottom-left",
                            label: t("config.positionLeft"),
                          },
                        ]}
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <Label htmlFor="borderRadiusUi">{t("config.radius")}</Label>
                        <p className="text-xs text-muted-foreground">
                          {t("config.radiusHint")}
                        </p>
                      </div>
                      <span className="rounded-md bg-muted px-2 py-1 font-mono text-xs">
                        {radius}px
                      </span>
                    </div>
                    <input
                      id="borderRadiusUi"
                      type="range"
                      min={0}
                      max={28}
                      value={radius}
                      onChange={(e) => setRadius(Number(e.target.value))}
                      className="w-full accent-primary"
                    />
                    <div
                      className="h-14 border border-border bg-card"
                      style={{
                        borderRadius: radius,
                        boxShadow: `inset 0 0 0 2px ${color}33`,
                      }}
                    />
                  </div>
                </section>

                <Separator />

                <section className="space-y-4">
                  <SectionHeading
                    title={t("config.sections.content")}
                    hint={t("config.sections.contentHint")}
                  />
                  <Field
                    label={t("config.launcher")}
                    hint={t("config.launcherHint")}
                    htmlFor="launcherTextLv"
                  >
                    <Input
                      id="launcherTextLv"
                      name="launcherTextLv"
                      defaultValue={widget.launcherTextLv ?? "Chat"}
                      maxLength={40}
                    />
                  </Field>
                  <Field
                    label={t("config.welcome")}
                    hint={t("config.welcomeHint")}
                    htmlFor="welcomeMessageLv"
                  >
                    <Textarea
                      id="welcomeMessageLv"
                      name="welcomeMessageLv"
                      defaultValue={widget.welcomeMessageLv ?? ""}
                      rows={3}
                    />
                  </Field>
                  <Field
                    label={t("config.logo")}
                    hint={t("config.logoHint")}
                    htmlFor="logoUrl"
                  >
                    <Input
                      id="logoUrl"
                      name="logoUrl"
                      defaultValue={widget.logoUrl ?? ""}
                      placeholder="https://"
                    />
                  </Field>
                  <Field
                    label={t("config.quickActions")}
                    hint={t("config.quickActionsHint")}
                    htmlFor="quickActions"
                  >
                    <Textarea
                      id="quickActions"
                      name="quickActions"
                      defaultValue={widget.quickActions.join("\n")}
                      rows={5}
                    />
                  </Field>
                  <Field
                    label={t("config.allowedOrigins")}
                    hint={t("config.allowedOriginsHint")}
                    htmlFor="allowedOrigins"
                  >
                    <Textarea
                      id="allowedOrigins"
                      name="allowedOrigins"
                      defaultValue={widget.allowedOrigins.join("\n")}
                      rows={3}
                      placeholder="https://tavswebs.com"
                    />
                  </Field>
                </section>

                <Separator />

                <section className="space-y-3">
                  <SectionHeading
                    title={t("config.sections.behavior")}
                    hint={t("config.sections.behaviorHint")}
                  />
                  <ToggleRow
                    checked={leadFormEnabled}
                    onChange={setLeadFormEnabled}
                    title={t("config.leads")}
                    description={t("config.leadsHint")}
                  />
                  <ToggleRow
                    checked={isActive}
                    onChange={setIsActive}
                    title={t("config.active")}
                    description={t("config.activeHint")}
                  />
                </section>

                {state && !state.ok ? (
                  <p className="text-sm text-destructive">{t("config.error")}</p>
                ) : null}
                {state?.ok ? (
                  <p className="text-sm text-primary">{t("config.saved")}</p>
                ) : null}

                <div className="flex flex-wrap items-center gap-3 border-t border-border pt-5">
                  <Button type="submit" disabled={pending} size="lg">
                    {pending ? t("config.saving") : t("config.save")}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    {t("config.saveHint")}
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        <Card className="overflow-hidden shadow-sm xl:sticky xl:top-6 xl:self-start">
          <CardHeader className="border-b border-border/70">
            <CardTitle>{t("preview.title")}</CardTitle>
            <CardDescription>{t("preview.subtitle")}</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="flex items-center justify-between gap-3 border-b border-border/60 bg-muted/20 px-4 py-2 text-xs text-muted-foreground">
              <span>{t("preview.liveHint")}</span>
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 font-medium text-foreground"
                style={{ background: `${color}22`, color }}
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: color }}
                />
                {color}
              </span>
            </div>
            <iframe
              key={previewKey}
              title="Widget preview"
              src={`/widget/frame?id=${widget.publicKey}&parent=${encodeURIComponent(appUrl)}`}
              className="h-[680px] w-full border-0 bg-[radial-gradient(circle_at_top,#e8eee9,#f7f6f3)]"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function normalizeHex(value: string) {
  const v = value.trim();
  if (/^#[0-9A-Fa-f]{6}$/.test(v)) return v;
  return "#0F5C4C";
}

function CodeBlock({ value }: { value: string }) {
  return (
    <pre className="overflow-x-auto rounded-lg border border-border bg-[#14201c] p-4 text-[12px] leading-relaxed text-[#e8f2ed]">
      {value}
    </pre>
  );
}

function SectionHeading({ title, hint }: { title: string; hint: string }) {
  return (
    <div>
      <h3 className="font-display text-lg font-semibold tracking-tight">
        {title}
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">{hint}</p>
    </div>
  );
}

function Field({
  label,
  hint,
  htmlFor,
  children,
}: {
  label: string;
  hint: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      <p className="text-xs text-muted-foreground">{hint}</p>
      {children}
    </div>
  );
}

function Segmented({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="grid grid-cols-2 gap-1 rounded-lg border border-border bg-muted/40 p-1">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            "rounded-md px-3 py-2 text-sm font-medium transition",
            value === option.value
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function ToggleRow({
  checked,
  onChange,
  title,
  description,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  title: string;
  description: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        "flex w-full items-start justify-between gap-4 rounded-xl border px-4 py-3 text-left transition",
        checked
          ? "border-primary/30 bg-primary/5"
          : "border-border bg-card hover:bg-muted/30",
      )}
    >
      <div>
        <div className="text-sm font-medium">{title}</div>
        <div className="mt-1 text-xs text-muted-foreground">{description}</div>
      </div>
      <span
        className={cn(
          "relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition",
          checked ? "bg-primary" : "bg-border",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition",
            checked ? "left-[22px]" : "left-0.5",
          )}
        />
      </span>
    </button>
  );
}
