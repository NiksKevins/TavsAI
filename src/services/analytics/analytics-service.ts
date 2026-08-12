import { prisma } from "@/lib/db";

export type AnalyticsRange = 7 | 30 | 90;

export type TopicKey =
  | "price"
  | "hours"
  | "booking"
  | "location"
  | "services"
  | "other";

export type DailyPoint = { date: string; count: number };

export type AnalyticsSnapshot = {
  range: AnalyticsRange;
  from: Date;
  to: Date;
  conversations: number;
  leads: number;
  qualifiedLeads: number;
  wonLeads: number;
  humanHandoffs: number;
  aiResolutionRate: number | null;
  leadConversionRate: number | null;
  conversationsOverTime: DailyPoint[];
  leadsOverTime: DailyPoint[];
  outcomes: { status: string; count: number }[];
  leadStatusBreakdown: { status: string; count: number }[];
  topQuestions: { topic: TopicKey; count: number }[];
  unansweredCount: number;
  fallbackCount: number;
};

export function resolveAnalyticsRange(
  value: string | undefined,
): AnalyticsRange {
  if (value === "7" || value === "90") return Number(value) as AnalyticsRange;
  return 30;
}

export function rangeWindow(range: AnalyticsRange, now = new Date()) {
  const to = now;
  const from = new Date(now);
  from.setUTCDate(from.getUTCDate() - (range - 1));
  from.setUTCHours(0, 0, 0, 0);
  return { from, to };
}

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function fillDailySeries(
  from: Date,
  to: Date,
  rows: { day: Date; count: bigint | number }[],
): DailyPoint[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    map.set(dayKey(new Date(row.day)), Number(row.count));
  }
  const points: DailyPoint[] = [];
  const cursor = new Date(from);
  cursor.setUTCHours(0, 0, 0, 0);
  const end = new Date(to);
  end.setUTCHours(0, 0, 0, 0);
  while (cursor <= end) {
    const key = dayKey(cursor);
    points.push({ date: key, count: map.get(key) ?? 0 });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return points;
}

export async function getAnalyticsSnapshot(
  workspaceId: string,
  range: AnalyticsRange,
): Promise<AnalyticsSnapshot> {
  const { from, to } = rangeWindow(range);

  const [
    conversations,
    leads,
    qualifiedLeads,
    wonLeads,
    humanHandoffs,
    outcomes,
    leadStatusBreakdown,
    conversationDays,
    leadDays,
    topQuestions,
    unansweredCount,
    fallbackCount,
  ] = await Promise.all([
    prisma.conversation.count({
      where: { workspaceId, createdAt: { gte: from, lte: to } },
    }),
    prisma.lead.count({
      where: { workspaceId, createdAt: { gte: from, lte: to } },
    }),
    prisma.lead.count({
      where: {
        workspaceId,
        createdAt: { gte: from, lte: to },
        status: "QUALIFIED",
      },
    }),
    prisma.lead.count({
      where: {
        workspaceId,
        createdAt: { gte: from, lte: to },
        status: "WON",
      },
    }),
    countHumanHandoffs(workspaceId, from, to),
    prisma.conversation.groupBy({
      by: ["status"],
      where: { workspaceId, createdAt: { gte: from, lte: to } },
      _count: { _all: true },
    }),
    prisma.lead.groupBy({
      by: ["status"],
      where: { workspaceId, createdAt: { gte: from, lte: to } },
      _count: { _all: true },
    }),
    prisma.$queryRaw<{ day: Date; count: bigint }[]>`
      SELECT date_trunc('day', "createdAt" AT TIME ZONE 'UTC') AS day,
             COUNT(*)::bigint AS count
      FROM "Conversation"
      WHERE "workspaceId" = ${workspaceId}::uuid
        AND "createdAt" >= ${from}
        AND "createdAt" <= ${to}
      GROUP BY 1
      ORDER BY 1
    `,
    prisma.$queryRaw<{ day: Date; count: bigint }[]>`
      SELECT date_trunc('day', "createdAt" AT TIME ZONE 'UTC') AS day,
             COUNT(*)::bigint AS count
      FROM "Lead"
      WHERE "workspaceId" = ${workspaceId}::uuid
        AND "createdAt" >= ${from}
        AND "createdAt" <= ${to}
      GROUP BY 1
      ORDER BY 1
    `,
    getTopQuestionTopics(workspaceId, from, to),
    countUnanswered(workspaceId, from, to),
    prisma.conversationMessage.count({
      where: {
        workspaceId,
        role: "ASSISTANT",
        createdAt: { gte: from, lte: to },
        metadata: { path: ["usedFallback"], equals: true },
      },
    }),
  ]);

  const aiResolutionRate =
    conversations > 0
      ? Math.max(0, (conversations - humanHandoffs) / conversations)
      : null;
  const leadConversionRate =
    conversations > 0 ? leads / conversations : null;

  return {
    range,
    from,
    to,
    conversations,
    leads,
    qualifiedLeads,
    wonLeads,
    humanHandoffs,
    aiResolutionRate,
    leadConversionRate,
    conversationsOverTime: fillDailySeries(from, to, conversationDays),
    leadsOverTime: fillDailySeries(from, to, leadDays),
    outcomes: outcomes.map((o) => ({
      status: o.status,
      count: o._count._all,
    })),
    leadStatusBreakdown: leadStatusBreakdown.map((o) => ({
      status: o.status,
      count: o._count._all,
    })),
    topQuestions,
    unansweredCount,
    fallbackCount,
  };
}

async function countHumanHandoffs(
  workspaceId: string,
  from: Date,
  to: Date,
): Promise<number> {
  const rows = await prisma.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*)::bigint AS count
    FROM "Conversation" c
    WHERE c."workspaceId" = ${workspaceId}::uuid
      AND c."createdAt" >= ${from}
      AND c."createdAt" <= ${to}
      AND (
        c.status = 'HANDED_OFF'
        OR EXISTS (
          SELECT 1 FROM "ConversationMessage" m
          WHERE m."conversationId" = c.id
            AND m.metadata @> '{"handoff": true}'::jsonb
        )
        OR EXISTS (
          SELECT 1 FROM "Lead" l
          WHERE l."conversationId" = c.id
            AND l.source IN ('handoff', 'widget_handoff', 'handoff_fallback')
        )
      )
  `;
  return Number(rows[0]?.count ?? 0);
}

async function countUnanswered(
  workspaceId: string,
  from: Date,
  to: Date,
): Promise<number> {
  const rows = await prisma.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*)::bigint AS count
    FROM "ConversationMessage" m
    WHERE m."workspaceId" = ${workspaceId}::uuid
      AND m.role = 'ASSISTANT'
      AND m."createdAt" >= ${from}
      AND m."createdAt" <= ${to}
      AND (
        m.metadata @> '{"usedFallback": true}'::jsonb
        OR m.metadata @> '{"handoff": true}'::jsonb
      )
      AND NOT (m.metadata @> '{"upgradeRequired": true}'::jsonb)
  `;
  return Number(rows[0]?.count ?? 0);
}

async function getTopQuestionTopics(
  workspaceId: string,
  from: Date,
  to: Date,
): Promise<{ topic: TopicKey; count: number }[]> {
  const rows = await prisma.$queryRaw<{ topic: string; count: bigint }[]>`
    SELECT topic, COUNT(*)::bigint AS count
    FROM (
      SELECT CASE
        WHEN content ~* '(cena|cenu|cik\\s+maks|izmaks|price|cost|quote|tām)' THEN 'price'
        WHEN content ~* '(darba\\s+laik|open(ing)?\\s+hour|kad\\s+strād|sestdien|svētdien|hours)' THEN 'hours'
        WHEN content ~* '(pieteikt|pierakst|book|booking|rezerv|vizīt)' THEN 'booking'
        WHEN content ~* '(kur\\s+atrod|adres|location|map|kā\\s+atrast|where\\s+are)' THEN 'location'
        WHEN content ~* '(pakalpoj|service|ko\\s+jūs\\s+piedāv|remont|diagnostik)' THEN 'services'
        ELSE 'other'
      END AS topic
      FROM "ConversationMessage"
      WHERE "workspaceId" = ${workspaceId}::uuid
        AND role IN ('USER', 'VISITOR')
        AND "createdAt" >= ${from}
        AND "createdAt" <= ${to}
    ) t
    GROUP BY topic
    ORDER BY count DESC
  `;

  return rows
    .filter((r) => r.topic !== "other" || Number(r.count) > 0)
    .map((r) => ({
      topic: r.topic as TopicKey,
      count: Number(r.count),
    }));
}

export type UnansweredQuestion = {
  messageId: string;
  conversationId: string;
  question: string;
  answer: string;
  reason: "fallback" | "handoff" | "both";
  createdAt: Date;
};

export async function listUnansweredQuestions(
  workspaceId: string,
  range: AnalyticsRange,
  limit = 50,
): Promise<UnansweredQuestion[]> {
  const { from, to } = rangeWindow(range);

  const rows = await prisma.$queryRaw<
    {
      messageId: string;
      conversationId: string;
      answer: string;
      createdAt: Date;
      question: string | null;
      usedFallback: boolean | null;
      handoff: boolean | null;
    }[]
  >`
    SELECT
      m.id AS "messageId",
      m."conversationId",
      m.content AS answer,
      m."createdAt",
      (
        SELECT u.content
        FROM "ConversationMessage" u
        WHERE u."conversationId" = m."conversationId"
          AND u."createdAt" < m."createdAt"
          AND u.role IN ('USER', 'VISITOR')
        ORDER BY u."createdAt" DESC
        LIMIT 1
      ) AS question,
      (m.metadata->>'usedFallback')::boolean AS "usedFallback",
      (m.metadata->>'handoff')::boolean AS handoff
    FROM "ConversationMessage" m
    WHERE m."workspaceId" = ${workspaceId}::uuid
      AND m.role = 'ASSISTANT'
      AND m."createdAt" >= ${from}
      AND m."createdAt" <= ${to}
      AND (
        m.metadata @> '{"usedFallback": true}'::jsonb
        OR m.metadata @> '{"handoff": true}'::jsonb
      )
      AND NOT (m.metadata @> '{"upgradeRequired": true}'::jsonb)
    ORDER BY m."createdAt" DESC
    LIMIT ${limit}
  `;

  return rows
    .filter((r) => r.question?.trim())
    .map((r) => {
      const fb = Boolean(r.usedFallback);
      const ho = Boolean(r.handoff);
      return {
        messageId: r.messageId,
        conversationId: r.conversationId,
        question: r.question!.trim(),
        answer: r.answer,
        reason: fb && ho ? "both" : ho ? "handoff" : "fallback",
        createdAt: r.createdAt,
      };
    });
}
