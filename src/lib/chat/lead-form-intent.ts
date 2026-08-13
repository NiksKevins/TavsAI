/**
 * Detect when a chat turn should surface the contact / lead form.
 */

const USER_LEAD_INTENT =
  /pieteikt|pierakst|vizīt|tām[ei]|vēlos|jā[,.]?\s*vēl|book|appoint|quote|yes[,.]?\s*i('d| would)? like|sākt|start free|try for free|reģistr|register|bez maksas|atstāt kontakt|kontaktinform|leave (my )?contact|share (my )?(name|phone|email)/i;

const USER_ASKS_WHAT_CONTACT =
  /kādu\s+kontakt|kāda\s+kontakt|what\s+contact|which\s+contact|ko\s+vajag.*(vārd|e-past|tālrun)|what.*(name|email|phone)/i;

const ASSISTANT_ASKED_CONTACT =
  /kontaktinform|atstājiet\s+kontakt|norādiet\s+savu|vārdu.*(?:e-past|tālrun)|(?:name).*(?:email|phone)|share your (?:name|phone|email)|fill (?:in )?the form|aizpildiet\s+form/i;

const ANSWER_ASKS_CONTACT =
  /(?:vārd\w*).*(?:e-past|tālrun)|(?:e-past\w*).*(?:tālrun|vārd)|kontaktinform|atstājiet\s+kontakt|norādiet\s+(?:savu\s+)?(?:vārd|e-past|tālrun)|please\s+(?:provide|share|leave).*(?:name|email|phone)|fill\s+(?:out\s+)?the\s+form|aizpildiet\s+formu/i;

export function userWantsLeadForm(
  message: string,
  history: { role: string; content: string }[],
): boolean {
  if (USER_LEAD_INTENT.test(message)) return true;
  if (USER_ASKS_WHAT_CONTACT.test(message)) return true;

  const lastAssistant = [...history]
    .reverse()
    .find((m) => m.role === "assistant");
  if (
    lastAssistant &&
    ASSISTANT_ASKED_CONTACT.test(lastAssistant.content) &&
    (/^(jā|ja|yes|ok|labi|vēlos|der)\b/i.test(message.trim()) ||
      USER_ASKS_WHAT_CONTACT.test(message))
  ) {
    return true;
  }
  return false;
}

export function assistantAnswerRequestsContact(answer: string): boolean {
  return ANSWER_ASKS_CONTACT.test(answer);
}

export function shouldShowLeadForm(params: {
  message: string;
  history: { role: string; content: string }[];
  answer?: string;
}): boolean {
  if (userWantsLeadForm(params.message, params.history)) return true;
  if (params.answer && assistantAnswerRequestsContact(params.answer)) {
    return true;
  }
  return false;
}
