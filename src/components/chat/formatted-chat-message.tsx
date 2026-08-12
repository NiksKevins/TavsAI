import { Fragment, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/** Turn common inline “ - Item” sequences into real list lines. */
function normalizeListBreaks(text: string): string {
  return text
    .replace(/:\s*-\s+/g, ":\n\n- ")
    .replace(/\.\s+-\s+/g, ".\n- ")
    .replace(/!\s+-\s+/g, "!\n- ")
    .replace(/\?\s+-\s+/g, "?\n- ")
    .trim();
}

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    const bold = part.match(/^\*\*([^*]+)\*\*$/);
    if (bold) {
      return (
        <strong key={`${keyPrefix}-b-${i}`} className="font-semibold text-foreground">
          {bold[1]}
        </strong>
      );
    }
    return <Fragment key={`${keyPrefix}-t-${i}`}>{part}</Fragment>;
  });
}

type Block =
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] };

/** Peel a follow-up sentence stuck to the end of a list item. */
function peelTrailingProse(item: string): { item: string; prose?: string } {
  const match = item.match(
    /^(.+[.!?])\s+((?:Var|Vai|Ja|Tad|Would|If|You|Can|Do|Also|Feel|Let|I can|We)\b.+)$/i,
  );
  if (!match) return { item };
  return { item: match[1], prose: match[2] };
}

function parseBlocks(text: string): Block[] {
  const lines = normalizeListBreaks(text).split(/\n/);
  const blocks: Block[] = [];
  let paragraph: string[] = [];
  let listItems: string[] = [];
  let pendingProse: string | null = null;

  const flushParagraph = () => {
    const joined = paragraph.join(" ").trim();
    if (joined) blocks.push({ type: "p", text: joined });
    paragraph = [];
  };

  const flushList = () => {
    if (listItems.length) blocks.push({ type: "ul", items: listItems });
    listItems = [];
    if (pendingProse) {
      blocks.push({ type: "p", text: pendingProse });
      pendingProse = null;
    }
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      flushList();
      flushParagraph();
      continue;
    }
    const bullet = line.match(/^[-*•]\s+(.+)$/);
    if (bullet) {
      flushParagraph();
      const peeled = peelTrailingProse(bullet[1]);
      listItems.push(peeled.item);
      if (peeled.prose) pendingProse = peeled.prose;
      continue;
    }
    flushList();
    paragraph.push(line);
  }
  flushList();
  flushParagraph();
  return blocks;
}

export function FormattedChatMessage({
  content,
  className,
}: {
  content: string;
  className?: string;
}) {
  const blocks = parseBlocks(content);

  if (blocks.length === 0) return null;

  return (
    <div className={cn("space-y-2 text-[13px] leading-relaxed sm:text-sm", className)}>
      {blocks.map((block, i) => {
        if (block.type === "ul") {
          return (
            <ul
              key={`ul-${i}`}
              className="my-1 space-y-1.5 border-l-2 border-primary/25 pl-3"
            >
              {block.items.map((item, j) => (
                <li key={`li-${i}-${j}`} className="relative pl-0.5">
                  <span className="absolute -left-[0.85rem] top-[0.55em] size-1 rounded-full bg-primary/70" />
                  {renderInline(item, `li-${i}-${j}`)}
                </li>
              ))}
            </ul>
          );
        }
        return (
          <p key={`p-${i}`} className="text-pretty">
            {renderInline(block.text, `p-${i}`)}
          </p>
        );
      })}
    </div>
  );
}
