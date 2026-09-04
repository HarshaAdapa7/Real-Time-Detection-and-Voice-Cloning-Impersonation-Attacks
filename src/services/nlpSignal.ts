/**
 * Layer 4: Conversation Intelligence / Social-Engineering NLP Signal
 *
 * REAL VS SIMULATED STATUS: [REAL GEMINI LLM CALL]
 * This is the genuinely functional intelligence layer that passes the live
 * transcribed conversation chunk to the server-side Gemini API (Google GenAI SDK gemini-3.8-flash).
 *
 * Gemini scores:
 * - Urgency cues (artificial deadlines, panic induction)
 * - Secrecy / isolation demands (avoiding second opinions, skipping callbacks)
 * - Explicit financial wire/account requests or credential/OTP solicitation
 * - Comprehensive social engineering fraud risk score (0-100)
 */

import { NlpSignalResult } from '../types';

export async function evaluateConversationRisk(
  transcript: string,
  claimedContext?: {
    claimedIdentity?: string;
    requestedAction?: string;
    amount?: number;
  }
): Promise<NlpSignalResult> {
  if (!transcript || transcript.trim().length === 0) {
    return {
      transcript: "",
      socialEngineeringRisk: 0,
      urgencyScore: 0,
      secrecyScore: 0,
      financialRequestDetected: false,
      otpCredentialRequestDetected: false,
      detectedCues: ["Awaiting speech input..."],
      coercionTone: "Silent",
      reasoning: "No conversation transcript recorded yet.",
      isRealGemini: false,
    };
  }

  try {
    const response = await fetch("/api/nlp-risk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        transcript,
        claimedContext,
      }),
    });

    if (!response.ok) {
      throw new Error(`NLP API HTTP ${response.status}`);
    }

    const data = await response.json();
    return {
      transcript,
      socialEngineeringRisk: data.socialEngineeringRisk ?? 30,
      urgencyScore: data.urgencyScore ?? 20,
      secrecyScore: data.secrecyScore ?? 15,
      financialRequestDetected: Boolean(data.financialRequestDetected),
      otpCredentialRequestDetected: Boolean(data.otpCredentialRequestDetected),
      detectedCues: Array.isArray(data.detectedCues) ? data.detectedCues : [],
      coercionTone: data.coercionTone || "Neutral",
      reasoning: data.reasoning || "Analyzed via conversation intelligence pipeline.",
      isRealGemini: Boolean(data.isRealGemini),
    };
  } catch (err) {
    console.warn("Client fallback for NLP evaluation:", err);
    // Instant fallback
    const textLower = transcript.toLowerCase();
    const hasUrgency = /(urgent|immediate|right now|hurry|emergency|asap|fast|quick|critical)/i.test(textLower);
    const hasSecrecy = /(secret|don't tell|between us|confidential|do not tell anyone|private line|quiet)/i.test(textLower);
    const hasFinancial = /(transfer|wire|neft|rtgs|rupees|rs\.|lakh|crore|send money|account|beneficiary|payment)/i.test(textLower);
    const hasCredentials = /(otp|pin|password|cvv|credentials|card number|auth code|verification code)/i.test(textLower);

    let score = 20;
    const cues: string[] = [];
    if (hasUrgency) { score += 25; cues.push("Urgent delivery demand"); }
    if (hasSecrecy) { score += 30; cues.push("Secrecy request"); }
    if (hasFinancial) { score += 20; cues.push("Financial fund transfer intent"); }
    if (hasCredentials) { score += 30; cues.push("OTP / Credential harvesting"); }

    return {
      transcript,
      socialEngineeringRisk: Math.min(score, 95),
      urgencyScore: hasUrgency ? 80 : 15,
      secrecyScore: hasSecrecy ? 85 : 10,
      financialRequestDetected: hasFinancial,
      otpCredentialRequestDetected: hasCredentials,
      detectedCues: cues.length > 0 ? cues : ["Standard natural phrasing"],
      coercionTone: hasUrgency ? "High Urgency" : "Standard",
      reasoning: "Local fallback analysis: Identified conversational indicators based on keyword extraction.",
      isRealGemini: false,
    };
  }
}
