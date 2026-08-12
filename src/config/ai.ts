export const AI_CONFIG = {
  embeddingModel: "text-embedding-3-small",
  embeddingDimensions: 1536,
  defaultChatModel: "gpt-4.1-mini",
  topK: 5,
  /** Cosine similarity floor (1 - distance). Below this → treat as insufficient knowledge. */
  relevanceThreshold: 0.32,
  /** Recent messages kept verbatim in the model context. */
  recentMessageLimit: 12,
  /** Soft token budget for conversation history (approx). */
  historyTokenBudget: 2500,
  maxOutputTokens: 800,
} as const;

/** USD per 1M tokens — approximate list prices for cost estimation. */
export const MODEL_PRICING_USD_PER_1M: Record<
  string,
  { input: number; output: number }
> = {
  "text-embedding-3-small": { input: 0.02, output: 0 },
  "gpt-4.1-mini": { input: 0.4, output: 1.6 },
  "gpt-4o-mini": { input: 0.15, output: 0.6 },
};

export const DEFAULT_FALLBACK_LV =
  "Šo informāciju es šobrīd nevaru droši apstiprināt. Ja vēlaties, varu palīdzēt sazināties ar uzņēmuma komandu.";

export const DEFAULT_FALLBACK_EN =
  "I cannot reliably confirm that information right now. If you like, I can help you get in touch with the team.";
