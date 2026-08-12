const REGISTER_PATH = /bot\.tavswebs\.com\/register/i;

const SECTION_LABEL =
  /^(Cenas|Kā sākt|Kas iekļauts|Priekšrocības|Pricing|How to start|What you get|Benefits)\s*:?\s*$/i;

/** Normalize model output into line-oriented markdown-ish text. */
export function normalizeChatMarkdown(text: string): string {
  let t = text.replace(/\r\n/g, "\n").trim();

  t = t.replace(
    /\s+((?:Cenas|Kā sākt|Kas iekļauts|Priekšrocības|Pricing|How to start|What you get|Benefits))\s*:\s*/gi,
    "\n\n$1:\n",
  );

  t = t.replace(/:\s*(?=\d{1,2}[.)]\s+)/g, ":\n\n");
  t = t.replace(/:\s*(?=[-•*]\s+)/g, ":\n\n");
  t = t.replace(/([^\n])\s+(\d{1,2})[.)]\s+/g, "$1\n$2. ");
  t = t.replace(/([^\n])\s+[-•]\s+(?=\S)/g, "$1\n- ");
  t = t.replace(/([^\n])\s+\*\s+(?=\*\*)/g, "$1\n- ");

  t = t
    .split("\n")
    .map((line) => line.trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n");

  return t.trim();
}

export function hrefFor(raw: string): string {
  return /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
}

export type ChatBlock =
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "cta"; href: string };

function peelEmbeddedSection(item: string): { item: string; rest?: string } {
  const match = item.match(
    /^(.+?[.!?])\s+((?:Cenas|Kā sākt|Kas iekļauts|Pricing|How to start|What you get)\s*:[\s\S]+)$/i,
  );
  if (!match) return { item };
  return { item: match[1], rest: match[2] };
}

function peelTrailingProse(item: string): { item: string; prose?: string } {
  const match = item.match(
    /^(.+[.!?])\s+((?:Var|Vai|Ja|Tad|Would|If|You|Can|Do|Also|Feel|Let|I can|We|Smagas)\b.+)$/i,
  );
  if (!match) return { item };
  return { item: match[1], prose: match[2] };
}

export function parseChatBlocks(text: string, depth = 0): ChatBlock[] {
  const lines = normalizeChatMarkdown(text).split("\n");
  const blocks: ChatBlock[] = [];
  let paragraph: string[] = [];
  let listItems: string[] = [];
  let listKind: "ul" | "ol" | null = null;
  let pendingRest: string[] = [];

  const flushParagraph = () => {
    const joined = paragraph.join(" ").trim();
    paragraph = [];
    if (!joined) return;

    const onlyUrl = joined.match(
      /^((?:https?:\/\/)?(?:www\.)?(?:bot\.)?tavswebs\.com\/[^\s]+)$/i,
    );
    if (onlyUrl && REGISTER_PATH.test(onlyUrl[1])) {
      blocks.push({ type: "cta", href: hrefFor(onlyUrl[1]) });
      return;
    }
    blocks.push({ type: "p", text: joined });
  };

  const flushList = () => {
    if (listItems.length && listKind) {
      blocks.push({ type: listKind, items: listItems });
    }
    listItems = [];
    listKind = null;
  };

  const pushItem = (kind: "ul" | "ol", rawItem: string) => {
    flushParagraph();
    if (listKind && listKind !== kind) flushList();
    listKind = kind;

    const sectioned = peelEmbeddedSection(rawItem);
    const peeled = peelTrailingProse(sectioned.item);
    listItems.push(peeled.item);
    if (sectioned.rest) pendingRest.push(sectioned.rest);
    if (peeled.prose) pendingRest.push(peeled.prose);
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      flushList();
      flushParagraph();
      continue;
    }

    if (SECTION_LABEL.test(line)) {
      flushList();
      flushParagraph();
      blocks.push({ type: "p", text: line.replace(/:$/, "") + ":" });
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

  if (depth < 4) {
    for (const rest of pendingRest) {
      blocks.push(...parseChatBlocks(rest, depth + 1));
    }
  }

  return blocks;
}

export { REGISTER_PATH };
