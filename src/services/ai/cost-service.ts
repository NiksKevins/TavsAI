import { AI_CONFIG, MODEL_PRICING_USD_PER_1M } from "@/config/ai";
import { prisma } from "@/lib/db";

export function estimateCostUsd(params: {
  model: string;
  inputTokens: number;
  outputTokens: number;
}): number {
  const pricing =
    MODEL_PRICING_USD_PER_1M[params.model] ??
    MODEL_PRICING_USD_PER_1M[AI_CONFIG.defaultChatModel];

  const input = (params.inputTokens / 1_000_000) * pricing.input;
  const output = (params.outputTokens / 1_000_000) * pricing.output;
  return Number((input + output).toFixed(6));
}

export async function recordAiUsage(params: {
  workspaceId: string;
  conversationId?: string | null;
  model: string;
  inputTokens: number;
  outputTokens: number;
}) {
  const estimatedCost = estimateCostUsd(params);

  await prisma.aiUsageEvent.create({
    data: {
      workspaceId: params.workspaceId,
      conversationId: params.conversationId ?? null,
      model: params.model,
      inputTokens: params.inputTokens,
      outputTokens: params.outputTokens,
      estimatedCost,
    },
  });

  return estimatedCost;
}
