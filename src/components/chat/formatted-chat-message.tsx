import { Fragment, type ReactNode } from "react";

import { cn } from "@/lib/utils";

const URL_PATTERN =
  /((?:https?:\/\/)?(?:www\.)?(?:bot\.)?tavswebs\.com\/[^\s.,;!?)]+|(?:https?:\/\/)[^\s.,;!?)]+)/gi;

const REGISTER_PATH = /bot\.tavswebs\.com\/register/i;

/** Turn inline bullets / numbered steps into real list lines. */
function normalizeListBreaks(text: string): string {
  return text
    .replace(/:\s*-\s+/g, ":\n\n- ")
    .replace(/\.\s+-\s+/g, ".\n- ")
    .replace(/!\s+-\s+/g, "!\n- ")
    .replace(/\?\s+-\s+/g, "?\n- ")
    .replace(/:\s*(\d{1,2})[.)]\s+/g, ":\n\n$1. ")
    .replace(/\.\s+(\d{1,2})[.)]\s+/g, ".\n$1. ")
    .replace(/!\s+(\d{1,2})[.)]\s+/g, "!\n$1. ")
    .replace(/\?\s+(\d{1,2})[.)]\s+/g, "?\n$1. ")
    .replace(/\s+(\d{1,2})[.)]\s+(?=\S)/g, "\n$1. ")
    .trim();
}

/** Break dense thank-you / CTA prose into scannable paragraphs. */
function softParagraphBreaks(text: string): string {
  return text
    .replace(
      /\.\s+(?=(?:Vai|Ja vēl|Ja vēlēs|Would|If you|You can also|Also)\b)/gi,
      ".\n\n",
    )
    .replace(
      /((?:https?:\/\/)?(?:www\.)?(?:bot\.)?tavswebs\.com\/register)\.?/gi,
      "\n\n$1\n\n",
    )
    .replace(/\n{3,}/g, "\n\n");
}

function hrefFor(raw: string): string {
  return /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
}

const LINK_RE =
  /^(?:https?:\/\/)?(?:www\.)?(?:bot\.)?tavswebs\.com\/[^\s]+$/i;
const HTTP_RE = /^https?:\/\/[^\s]+$/i;

function isLinkToken(part: string): boolean {
  return LINK_RE.test(part) || HTTP_RE.test(part);
}

function renderInline(
  text: string,
  keyPrefix: string,
  registerCta?: string,
): ReactNode[] {
  const chunks = text.split(/(\*\*[^*]+\*\*)/g);
  const nodes: ReactNode[] = [];

  chunks.forEach((chunk, i) => {
    const bold = chunk.match(/^\*\*([^*]+)\*\*$/);
    if (bold) {
      nodes.push(
        <strong
          key={`${keyPrefix}-b-${i}`}
          className="font-semibold text-foreground"
        >
          {bold[1]}
        </strong>,
      );
      return;
    }

    const parts = chunk.split(URL_PATTERN);
    parts.forEach((part, j) => {
      if (!part) return;
      if (isLinkToken(part)) {
        const href = hrefFor(part);
        const isRegister = REGISTER_PATH.test(part);
        nodes.push(
          <a
            key={`${keyPrefix}-a-${i}-${j}`}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "font-medium text-primary underline decoration-primary/30 underline-offset-2 transition-colors hover:decoration-primary",
              isRegister &&
                registerCta &&
                "mt-1 inline-flex w-full items-center justify-center rounded-xl bg-primary px-3 py-2 text-center text-[13px] font-semibold text-primary-foreground no-underline shadow-sm hover:bg-primary/90 hover:text-primary-foreground",
            )}
          >
            {isRegister && registerCta
              ? registerCta
              : part.replace(/^https?:\/\//i, "")}
          </a>,
        );
        return;
      }
      nodes.push(
        <Fragment key={`${keyPrefix}-t-${i}-${j}`}>{part}</Fragment>,
      );
    });
  });

  return nodes;
}

type Block =
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "cta"; href: string };

/** Peel a follow-up sentence stuck to the end of a list item. */
function peelTrailingProse(item: string): { item: string; prose?: string } {
  const match = item.match(
    /^(.+[.!?])\s+((?:Var|Vai|Ja|Tad|Would|If|You|Can|Do|Also|Feel|Let|I can|We|Smagas)\b.+)$/i,
  );
  if (!match) return { item };
  return { item: match[1], prose: match[2] };
}

function parseBlocks(text: string): Block[] {
  const lines = softParagraphBreaks(normalizeListBreaks(text)).split(/\n/);
  const blocks: Block[] = [];
  let paragraph: string[] = [];
  let listItems: string[] = [];
  let listKind: "ul" | "ol" | null = null;
  let pendingProse: string | null = null;

  const flushParagraph = () => {
    const joined = paragraph.join(" ").trim();
    if (!joined) {
      paragraph = [];
      return;
    }
    const onlyUrl = joined.match(
      /^((?:https?:\/\/)?(?:www\.)?(?:bot\.)?tavswebs\.com\/[^\s]+)$/i,
    );
    if (onlyUrl && REGISTER_PATH.test(onlyUrl[1])) {
      blocks.push({ type: "cta", href: hrefFor(onlyUrl[1]) });
    } else {
      blocks.push({ type: "p", text: joined });
    }
    paragraph = [];
  };

  const flushList = () => {
    if (listItems.length && listKind) {
      blocks.push({ type: listKind, items: listItems });
    }
    listItems = [];
    listKind = null;
    if (pendingProse) {
      blocks.push({ type: "p", text: pendingProse });
      pendingProse = null;
    }
  };

  const pushItem = (kind: "ul" | "ol", rawItem: string) => {
    flushParagraph();
    if (listKind && listKind !== kind) flushList();
    listKind = kind;
    const peeled = peelTrailingProse(rawItem);
    listItems.push(peeled.item);
    if (peeled.prose) pendingProse = peeled.prose;
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      flushList();
      flushParagraph();
      continue;
    }
    const numbered = line.match(/^\d{1,2}[.)]\s+(.+)$/);
    if (numbered) {
      pushItem("ol", numbered[1]);
      continue;
    }
    const bullet = line.match(/^[-*•]\s+(.+)$/);
    if (bullet) {
      pushItem("ul", bullet[1]);
      continue;
    }
    flushList();
    paragraph.push(line);
  }
  flushList();
  flushParagraph();
  return blocks;
}

function ListItem({
  children,
  index,
  ordered,
}: {
  children: ReactNode;
  index: number;
  ordered: boolean;
}) {
  return (
    <li className="relative flex gap-2.5 pl-0.5">
      {ordered ? (
        <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md bg-primary/10 text-[11px] font-semibold tabular-nums text-primary">
          {index + 1}
        </span>
      ) : (
        <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary/70" />
      )}
      <span className="min-w-0 flex-1">{children}</span>
    </li>
  );
}

export function FormattedChatMessage({
  content,
  className,
  registerCta,
}: {
  content: string;
  className?: string;
  /** Label for register URL CTA button when present in the message. */
  registerCta?: string;
}) {
  const blocks = parseBlocks(content);

  if (blocks.length === 0) return null;

  return (
    <div className={cn("space-y-2.5 text-[13px] leading-relaxed sm:text-sm", className)}>
      {blocks.map((block, i) => {
        if (block.type === "cta") {
          return (
            <a
              key={`cta-${i}`}
              href={block.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full items-center justify-center rounded-xl bg-primary px-3 py-2.5 text-center text-[13px] font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            >
              {registerCta ?? block.href.replace(/^https?:\/\//i, "")}
            </a>
          );
        }
        if (block.type === "ul" || block.type === "ol") {
          const ListTag = block.type === "ol" ? "ol" : "ul";
          return (
            <ListTag
              key={`${block.type}-${i}`}
              className="my-1 space-y-2 border-l-2 border-primary/20 pl-3"
            >
              {block.items.map((item, j) => (
                <ListItem
                  key={`li-${i}-${j}`}
                  index={j}
                  ordered={block.type === "ol"}
                >
                  {renderInline(item, `li-${i}-${j}`, registerCta)}
                </ListItem>
              ))}
            </ListTag>
          );
        }
        return (
          <p key={`p-${i}`} className="text-pretty">
            {renderInline(block.text, `p-${i}`, registerCta)}
          </p>
        );
      })}
    </div>
  );
}
