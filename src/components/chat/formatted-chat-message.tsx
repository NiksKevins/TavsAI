import { Fragment, type ReactNode } from "react";

import {
  hrefFor,
  parseChatBlocks,
  REGISTER_PATH,
} from "@/lib/chat/chat-markdown";
import { cn } from "@/lib/utils";

const URL_PATTERN =
  /((?:https?:\/\/)?(?:www\.)?(?:bot\.)?tavswebs\.com\/[^\s.,;!?)]+|(?:https?:\/\/)[^\s.,;!?)]+)/gi;

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
  const chunks = text.split(/(\*\*[^*\n]+?\*\*|\*[^*\n]+?\*)/g);
  const nodes: ReactNode[] = [];

  chunks.forEach((chunk, i) => {
    const bold = chunk.match(/^\*\*([^*\n]+?)\*\*$/);
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
    const italic = chunk.match(/^\*([^*\n]+?)\*$/);
    if (italic) {
      nodes.push(
        <em key={`${keyPrefix}-i-${i}`} className="italic">
          {italic[1]}
        </em>,
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
  registerCta?: string;
}) {
  const blocks = parseChatBlocks(content);

  if (blocks.length === 0) return null;

  return (
    <div
      className={cn(
        "space-y-2.5 text-[13px] leading-relaxed sm:text-sm",
        className,
      )}
    >
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
        const isSection = /:$/.test(block.text) && block.text.length < 40;
        return (
          <p
            key={`p-${i}`}
            className={cn(
              "text-pretty",
              isSection && "pt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground",
            )}
          >
            {renderInline(block.text, `p-${i}`, registerCta)}
          </p>
        );
      })}
    </div>
  );
}
