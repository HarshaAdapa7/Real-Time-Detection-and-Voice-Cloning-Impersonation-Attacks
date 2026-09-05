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

export function evaluateTextHeuristics(transcript: string): NlpSignalResult {
  if (!transcript || transcript.trim().length === 0) {
    return {
      transcript: "",
      socialEngineeringRisk: 0,
      urgencyScore: 0,
      secrecyScore: 0,
      financialRequestDetected: false,
      otpCredentialRequestDetected: false,
      detectedCues: ["Awaiting voice input..."],
      coercionTone: "Silent",
      reasoning: "No conversation transcript recorded yet.",
      isRealGemini: false,
    };
  }

  const text = transcript;
  const textLower = transcript.toLowerCase();

  // 1. OTP / Credential Harvesting (English, Hindi, Telugu, Tamil, Kannada, Hinglish)
  const otpPattern =
    /(otp|one-time|verification code|security code|auth code|passcode|password|pin number|cvv|credentials|secret code|2fa|authenticator|ओटीपी|ओटिपी|पासवर्ड|पिन|कोड|రహస్య కోడ్|ఓటీపీ|పాస్‌వర్డ్|పిన్|కోడ్|கடவுச்சொல்|ஓடிபி|பின்|குறியீடு|ಗುಪ್ತ ಸಂಖ್ಯೆ|ಒಟಿಪಿ|ಪಾಸ್‌ವರ್ಡ್|ಪಿನ್|രഹസ്യ കോഡ്|otp batao|code bhejo|otp de do|otp share|otp bataiye|otp bataye|code batao|otp cheppandi|code ivvandi|otp pampandi|otp sollunga|code anupunga|otp heli|code kodi)/i;
  const hasOtp = otpPattern.test(text) || otpPattern.test(textLower);

  // 2. Financial Demand / Wire Transfer / Account Fund Exfiltration
  const financialPattern =
    /(transfer|wire|rtgs|neft|imps|upi|send money|pay now|deposit|beneficiary|vendor account|wire transfer|payment of|remit|funds|lakh|crore|rupees|rs\.|settle invoice|पैसे|रुपये|खाता|खाते|ट्रांसफर|डालो|भेजो|ఖాతాకు|రూపాయలు|లక్ష|లక్షలు|పంపండి|బదిలీ|డబ్బులు|பணம்|பரிமாற்றம்|லட்சம்|ரூபாய்|அனுப்பவும்|காசோலை|ಹಣ|ಖಾತೆಗೆ|ವರ್ಗಾವಣೆ|ಕಳುಹಿಸಿ|രൂപ|പണം|paise transfer|khate me|bhejiye|payment kardo|dabbu transfer|account lo veyyandi|panam anupunga|transfer pannunga|hana kaluhisi)/i;
  const hasFinancial = financialPattern.test(text) || financialPattern.test(textLower);

  // 3. Digital Arrest / Law Enforcement / Legal Threat Coercion (Rampant attack vector)
  const digitalArrestPattern =
    /(digital arrest|police|cbi|ed directorate|customs department|cyber crime|crime branch|court summons|fir registered|arrest warrant|warrant issued|account suspended|account blocked|sim blocked|asset seizure|jail|prison|prosecution|arrested|गिरफ्तारी|पुलिस|सीबीआई|वारंट|जेल|खाता ब्लॉक|పోలీస్|అరెస్ట్|కేసు|జైలు|ఖాతా బ్లాక్|கைது|காவல்துறை|நீதிமன்றம்|arrest kar lenge|police bhej raha|block ho jayega|suspend ho jayega|jail ki pampistam|police arrest chestam)/i;
  const hasDigitalArrest = digitalArrestPattern.test(text) || digitalArrestPattern.test(textLower);

  // 4. Urgency & Panic Induction
  const urgencyPattern =
    /(urgent|immediate|right now|within 10 minutes|within 5 minutes|two minutes|immediately|hurry|emergency|critical|asap|fast|quick|lockout|deadline|act now|तुरंत|तत्काल|जल्दी|फटाफट|अभी|ఇప్పుడే|వెంటనే|అత్యవసర|త్వరగా|உடனடியாக|தாமதமின்றி|சீக்கிரம்|விரைவாக|ತಕ್ಷಣವೇ|ತುರ್ತು|വേഗം|ഉടൻ|jaldi karo|turant bhejo|abhi ke abhi|ventane|ippude|tvaraga|udane|seekiram|thakshana)/i;
  const hasUrgency = urgencyPattern.test(text) || urgencyPattern.test(textLower);

  // 5. Secrecy & Anti-Verification Tactics
  const secrecyPattern =
    /(confidential|secret|do not tell|don't inform|between us|private line|keep this quiet|don't verify|skip callback|do not hang up|stay on line|don't tell anyone|गोपनीय|मत बताना|गुप्त|రహస్యమైన|చెప్పవద్దు|ఎవరికీ చెప్పొద్దు|ரகசியம்|கூற வேண்டாம்|ಯಾರಿಗೂ ಹೇಳಬೇಡಿ|രഹസ്യമായി|kisi ko mat batana|secret hai|line mat kaatna|phone mat kaato|evariki cheppoddu|secret ga unchandi|call cut cheyoddu)/i;
  const hasSecrecy = secrecyPattern.test(text) || secrecyPattern.test(textLower);

  // 6. Authority Impersonation
  const authorityPattern =
    /(it security|cfo|ceo|director|cyber cell|security department|bank manager|police inspector|enforcement officer|compliance officer|headquarters|सीईओ|सीएफओ|प्रबंधक|పోలీస్|మేనేజర్|అధికారి|இயக்குனர்|அதிகாரி|ಅಧಿಕಾರಿ)/i;
  const hasAuthority = authorityPattern.test(text) || authorityPattern.test(textLower);

  // 7. Call Merging & Conference Bridge Hijack Scam (New Attack Vector Mandate)
  const callMergePattern =
    /(call merge|merging call|merge the call|merge this call|conference call|conference bridge|bridge the call|put on conference|add to conference|conferencing in|connecting third party|dialing supervisor|patching in|senior officer on line|merge another call|add another call|\*21\*|\*401\*|\*\*21\*|call forwarding|కాల్ మెర్జ్|కాన్ఫరెన్స్ కాల్|కాల్ కలుపుతున్నాను|మరొక అధికారిని కలుపుతాను|సీనియర్ మేనేజర్ ను కాన్ఫరెన్స్|కాల్ ఫార్వర్డ్|కాల్ జోడించండి|కాల్ మెర్జ్ చేయండి|कॉल मर्ज|कॉन्फ्रेंस कॉल|कॉल जोड़ रहा हूँ|सीनियर ऑफिसर को लाइन पर ले रहा हूँ|कॉन्फ्रेंस पर जोड़ें|कॉल फॉरवर्ड करें|कॉल मर्ज करो|कॉल जोड़ो|கால் மெர்ஜ்|கான்பரன்ஸ் கால்|ಕಾಲ್ ಮರ್ಜ್|ಕಾನ್ಫರೆನ್ಸ್ ಕಾಲ್|call merge kar raha|conference par le raha|call merge cheyyandi|conference lo pettandi|call kaluputunnanu)/i;
  const hasCallMerge = callMergePattern.test(text) || callMergePattern.test(textLower);

  let score = 10;
  const cues: string[] = [];

  if (hasCallMerge) {
    score = 96;
    cues.push("🚨 P0 CRITICAL: Unauthorized Call Merging / Conference Bridge Hijack Scam detected");
  } else if (hasOtp) {
    score = 96;
    cues.push("🚨 P0 CRITICAL: Sensitive OTP / Passcode / 2FA Credential Solicitation detected");
  } else if (hasDigitalArrest) {
    score = 92;
    cues.push("🚨 P0 CRITICAL: Law Enforcement / Digital Arrest Extortion & Arrest Threat detected");
  } else if (hasFinancial && hasUrgency) {
    score = 90;
    cues.push("🚨 P0 CRITICAL: High-Urgency Coercive Financial Wire / Account Transfer demand");
  } else if (hasFinancial && hasAuthority) {
    score = 86;
    cues.push("⚠️ HIGH THREAT: Authority Impersonation requesting unauthorized financial disbursement");
  } else if (hasFinancial) {
    score = 76;
    cues.push("⚠️ FINANCIAL RISK: Direct funds transfer / remittance instructions detected");
  } else if (hasSecrecy && hasUrgency) {
    score = 78;
    cues.push("⚠️ MANIPULATION: Combined high-pressure secrecy isolation & immediate time deadline");
  } else if (hasSecrecy) {
    score = 65;
    cues.push("⚠️ ISOLATION: Explicit demand to withhold information from verification channels");
  } else if (hasUrgency) {
    score = 52;
    cues.push("⚠️ URGENCY: Artificial panic induction and accelerated action window");
  } else if (hasAuthority) {
    score = 45;
    cues.push("ℹ️ AUTHORITY: Executive or security credentials asserted");
  }

  const coercionTone =
    hasCallMerge
      ? "Call Merging / Conference Hijack Fraud"
      : hasOtp || hasDigitalArrest
      ? "Aggressive Extortion / Phishing"
      : hasUrgency && hasSecrecy
      ? "Coercive & Manipulative"
      : hasUrgency
      ? "High Urgency Panic"
      : hasFinancial
      ? "Transactional Demand"
      : "Standard";

  const reasoning =
    cues.length > 0
      ? `Real-time multi-lingual conversational analyzer: ${cues[0]}`
      : "Standard natural conversational flow without security flags.";

  return {
    transcript,
    socialEngineeringRisk: Math.min(Math.max(score, 5), 99),
    urgencyScore: hasUrgency ? 88 : hasDigitalArrest ? 85 : 15,
    secrecyScore: hasSecrecy ? 90 : 10,
    financialRequestDetected: hasFinancial,
    otpCredentialRequestDetected: hasOtp,
    detectedCues: cues.length > 0 ? cues : ["Standard natural conversational cadence"],
    coercionTone,
    reasoning,
    isRealGemini: false,
  };
}

export async function evaluateConversationRisk(
  transcript: string,
  claimedContext?: {
    claimedIdentity?: string;
    requestedAction?: string;
    amount?: number;
  }
): Promise<NlpSignalResult> {
  if (!transcript || transcript.trim().length === 0) {
    return evaluateTextHeuristics("");
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
    return evaluateTextHeuristics(transcript);
  }
}
