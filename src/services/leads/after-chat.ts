import { evaluateConversationForLead } from "@/services/leads/lead-service";

/** Run after a chat turn. Never throws to the caller. */
export async function maybeProcessLeadAfterChat(params: {
  workspaceId: string;
  conversationId: string;
  locale?: "lv" | "en";
  forceHandoff?: boolean;
  source?: string;
  contactOverride?: {
    name?: string | null;
    email?: string | null;
    phone?: string | null;
  };
}) {
  try {
    return await evaluateConversationForLead(params);
  } catch (error) {
    console.error("[lead/after-chat]", error);
    return null;
  }
}
