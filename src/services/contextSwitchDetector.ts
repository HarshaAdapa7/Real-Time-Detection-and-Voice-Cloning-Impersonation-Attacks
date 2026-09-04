/**
 * Context-Switching & Multilingual Threat Intelligence Engine
 *
 * Implements conversational context tracking across multi-turn interactions:
 * - Session Context state machine (turns, language history, context transitions)
 * - Explicit separation of:
 *     1. LANGUAGE CHANGE (Benign linguistic variation)
 *     2. CONTEXT CHANGE (Topic / domain shift)
 *     3. SECURITY RISK ESCALATION (Threat vector introduction)
 * - Configurable Risk Memory & Context Reversal Decay
 * - Multi-lingual intent identification across Indic & English utterances
 */

import {
  SessionContext,
  ContextSwitchDetectionResult,
  TrustAction,
  RiskLevel,
  TenantConfig,
} from '../types';
import { detectLanguage } from './languageDetector';
import { evaluatePolicy } from './policyEngine';

export interface TurnEvaluationInput {
  callId: string;
  turnNumber: number;
  transcript: string;
  sessionState?: SessionContext | null;
  tenantConfig: TenantConfig;
  decayPolicy?: 'decay_gradual' | 'retain_elevated' | 'immediate_reset';
  externalBiometricScore?: number; // Voiceprint similarity (default 85)
  externalDeepfakeScore?: number;  // Deepfake probability (default 15)
  externalReplayScore?: number;    // Replay probability (default 10)
}

export interface TurnEvaluationOutput {
  sessionContext: SessionContext;
  detection: ContextSwitchDetectionResult;
  riskScore: number;
  riskLevel: RiskLevel;
  decision: TrustAction;
  intent: string;
  detectedLanguage: string;
  detectedLanguageCode: string;
  isAsrSupported: boolean;
  explanation: string;
}

/**
 * Detects the intent category from the transcript, supporting English and Indian languages.
 */
export function classifyIntentAndContext(transcript: string): {
  intent: string;
  contextCategory: string;
  baseIntentRisk: number;
  coercionCues: string[];
} {
  const textLower = transcript.toLowerCase();
  const cues: string[] = [];

  // OTP / 2FA Credential Solicitation
  const otpPattern =
    /(otp|one-time|verification code|auth code|ओटीपी|ओटिपी|ఓటీపీ|కోడ్|ஓடிபி|ஒடிபி|ಒಟಿಪಿ|രഹസ്യ കോഡ്|पासवर्ड)/i;
  const hasOtp = otpPattern.test(transcript) || otpPattern.test(textLower);

  // Password / PIN Solicitation
  const pinPattern =
    /(password|pin|pin number|cvv|credentials|पासवर्ड|पिन|రహస్య సంఖ్య|పాస్‌వర్డ్|கடவுச்சொல்|ಗುಪ್ತ ಸಂಖ್ಯೆ)/i;
  const hasPin = pinPattern.test(transcript) || pinPattern.test(textLower);

  // Financial / Fund Transfer Demand
  const transferPattern =
    /(transfer|wire|rtgs|neft|rupees|lakh|crore|send money|vendor account|transfer to account|wire transfer|payment of|beneficiary|रुपये|ट्रांसफर|पैसे|ఖాతాకు|రూపాయలు|లక్ష|పంపండి|லாபம்|பணம்|பரிமாற்றம்|லட்சம்|ரூபாய்|அனுப்பவும்|ಹಣ|ಖಾತೆಗೆ|ವರ್ಗಾವಣೆ|ಕಳುಹಿಸಿ|പണം)/i;
  const hasTransfer = transferPattern.test(transcript) || transferPattern.test(textLower);

  // Artificial Urgency / Coercive Pressure
  const urgencyPattern =
    /(urgent|immediate|right now|within 10 minutes|two minutes|immediately|hurry|emergency|suspended|lockout|तुरंत|तत्काल|जल्दी|ఇప్పుడే|వెంటనే|అత్యవసర|உடனடியாக|தாமதமின்றி|ತಕ್ಷಣವೇ|ತುರ್ತು|ഉടൻ)/i;
  const hasUrgency = urgencyPattern.test(transcript) || urgencyPattern.test(textLower);

  // Secrecy & Isolation Manipulation
  const secrecyPattern =
    /(confidential|secret|do not tell|don't inform|between us|private line|keep this quiet|गोपनीय|मत बताना|రహస్యమైన|చెప్పవద్దు|ரகசியம்|கூற வேண்டாம்|ಯಾರಿಗೂ ಹೇಳಬೇಡಿ|രഹസ്യമായി)/i;
  const hasSecrecy = secrecyPattern.test(transcript) || secrecyPattern.test(textLower);

  // Authority Impersonation
  const authorityPattern =
    /(it security|cfo|cyber cell|security department|bank manager|police|headquarters|सीईओ|सीएफओ|పోలీస్|మేనేజర్|அதிகாரி|ಅಧಿಕಾರಿ)/i;
  const hasAuthority = authorityPattern.test(transcript) || authorityPattern.test(textLower);

  // Account Inquiries / Routine Portal discussions
  const accountDiscussionPattern =
    /(portal|ledger|review|balance|quarterly|operations|invoice|meeting|schedule|మీటింగ్|సమావేశం|बैठक|समीक्षा|கூட்டம்|ಸಭೆ|യോഗം)/i;
  const hasAccountDiscussion = accountDiscussionPattern.test(transcript) || accountDiscussionPattern.test(textLower);

  // Priority classification
  if (hasOtp) {
    cues.push('OTP credential harvesting request');
    if (hasUrgency) cues.push('Artificial time-lock urgency');
    return {
      intent: 'otp_request',
      contextCategory: 'credential_request',
      baseIntentRisk: 88,
      coercionCues: cues,
    };
  }

  if (hasPin) {
    cues.push('Account password/PIN extraction attempt');
    return {
      intent: 'password_pin_request',
      contextCategory: 'credential_request',
      baseIntentRisk: 85,
      coercionCues: cues,
    };
  }

  if (hasTransfer) {
    cues.push('High-value financial transfer solicitation');
    if (hasAuthority) cues.push('Executive authority invocation (CFO/Director)');
    if (hasUrgency) cues.push('Immediate transaction settlement deadline');
    return {
      intent: 'bank_transfer_request',
      contextCategory: 'financial_transfer_demand',
      baseIntentRisk: 84,
      coercionCues: cues,
    };
  }

  if (hasSecrecy) {
    cues.push('Secrecy & victim isolation tactic');
    return {
      intent: 'secrecy_manipulation',
      contextCategory: 'social_engineering_isolation',
      baseIntentRisk: 68,
      coercionCues: cues,
    };
  }

  if (hasUrgency) {
    cues.push('Coercive panic induction & urgent deadline');
    return {
      intent: 'urgency_manipulation',
      contextCategory: 'urgency_manipulation',
      baseIntentRisk: 48,
      coercionCues: cues,
    };
  }

  if (hasAuthority) {
    cues.push('Security/executive authority assertion');
    return {
      intent: 'authority_impersonation',
      contextCategory: 'authority_claim',
      baseIntentRisk: 45,
      coercionCues: cues,
    };
  }

  if (hasAccountDiscussion) {
    return {
      intent: 'account_discussion',
      contextCategory: 'account_discussion',
      baseIntentRisk: 18,
      coercionCues: ['Standard corporate operational inquiry'],
    };
  }

  return {
    intent: 'normal_conversation',
    contextCategory: 'normal_conversation',
    baseIntentRisk: 12,
    coercionCues: ['Benign greeting and dialogue'],
  };
}

/**
 * Evaluates a conversational turn within session context.
 */
export function evaluateTurnInContext(input: TurnEvaluationInput): TurnEvaluationOutput {
  const {
    callId,
    turnNumber,
    transcript,
    sessionState,
    tenantConfig,
    decayPolicy = 'decay_gradual',
    externalBiometricScore = 88, // Legitimate similarity
    externalDeepfakeScore = 15,
    externalReplayScore = 12,
  } = input;

  // 1. Language Detection
  const langResult = detectLanguage(transcript);
  const isSupported = langResult.languageCode !== 'ml' && langResult.languageCode !== 'mr' && langResult.languageCode !== 'bn';

  // 2. Intent & Context Classification
  const { intent, contextCategory, baseIntentRisk, coercionCues } = classifyIntentAndContext(transcript);

  // 3. Compare with Previous Turn Context & Language
  const previousLanguage = sessionState?.detected_language || null;
  const previousContext = sessionState?.current_context || null;

  const languageSwitch = Boolean(previousLanguage && previousLanguage !== langResult.languageCode);
  const contextSwitch = Boolean(previousContext && previousContext !== contextCategory);

  // 4. Session History Accumulation
  const previousContextHistory = sessionState?.context_history || [];
  const previousLanguageHistory = sessionState?.language_history || [];
  const previousRiskHistory = sessionState?.risk_history || [];
  const previousDecisionHistory = sessionState?.decision_history || [];

  const contextHistory = [...previousContextHistory, contextCategory];
  const languageHistory = [...previousLanguageHistory, langResult.languageCode];

  // 5. Contextual Risk Fusion & Memory Retention
  // Note: Language switch by itself contributes 0 risk!
  let turnRisk = baseIntentRisk;

  // Progressive escalation bonus if switching from normal to high-risk credential/financial
  const isEscalation =
    contextSwitch &&
    (contextCategory === 'credential_request' || contextCategory === 'financial_transfer_demand');

  if (isEscalation) {
    turnRisk = Math.min(99, turnRisk + 8);
    coercionCues.push('Sudden context pivot into sensitive action authorization');
  }

  // Check history: if an OTP or Wire was already requested in this session, retain elevated risk floor
  const hadPastCriticalRequest = previousContextHistory.some(
    (c) => c === 'credential_request' || c === 'financial_transfer_demand'
  );

  let finalTurnRisk = turnRisk;
  const previousTurnRisk = previousRiskHistory.length > 0 ? previousRiskHistory[previousRiskHistory.length - 1] : 0;

  if (hadPastCriticalRequest || (previousTurnRisk > 60 && contextCategory === 'normal_conversation')) {
    if (decayPolicy === 'retain_elevated') {
      finalTurnRisk = Math.max(turnRisk, previousTurnRisk);
      coercionCues.push('Risk lock active: Prior session threat memory retained at peak');
    } else if (decayPolicy === 'decay_gradual') {
      // Memory floor: retain 65% of prior high risk even if caller pivots back to weather
      const memoryFloor = Math.round(previousTurnRisk * 0.65);
      finalTurnRisk = Math.max(turnRisk, memoryFloor);
      if (finalTurnRisk > turnRisk) {
        coercionCues.push(`Memory decay applied: retaining threat floor (${finalTurnRisk}%) after context reversal`);
      }
    }
  }

  // Cross-lingual speaker biometric stability check
  const speakerMismatch = Math.max(0, 100 - externalBiometricScore);

  // Intent Payload Weighting:
  // Direct credential solicitation (OTP/PIN) or unauthorized financial transfer
  // is an intrinsic critical threat vector that cannot be masked by benign acoustics.
  let compositeRisk: number;
  if (contextCategory === 'credential_request' || contextCategory === 'financial_transfer_demand') {
    compositeRisk = Math.max(finalTurnRisk, Math.round(
      finalTurnRisk * 0.80 +
      externalDeepfakeScore * 0.10 +
      speakerMismatch * 0.10
    ));
  } else if (contextCategory === 'social_engineering_isolation') {
    compositeRisk = finalTurnRisk;
  } else if (contextCategory === 'urgency_manipulation') {
    compositeRisk = finalTurnRisk;
  } else {
    // Normal / Benign
    compositeRisk = Math.round(
      finalTurnRisk * 0.60 +
      externalDeepfakeScore * 0.20 +
      speakerMismatch * 0.15 +
      externalReplayScore * 0.05
    );
  }

  const clampedRisk = Math.min(Math.max(compositeRisk, 5), 99);

  // 6. Policy Decision
  const policyResult = evaluatePolicy(clampedRisk, tenantConfig);

  // 7. Calculate Risk Delta
  const rawDelta = clampedRisk - (previousTurnRisk || clampedRisk);
  const riskChangeStr = rawDelta > 0 ? `+${rawDelta}` : `${rawDelta}`;

  // 8. Construct Updated Session Context
  const updatedSession: SessionContext = {
    call_id: callId || 'CALL-ACTIVE',
    turn_number: turnNumber,
    detected_language: langResult.languageCode,
    previous_language: previousLanguage,
    language_switch: languageSwitch,
    current_context: contextCategory,
    previous_context: previousContext,
    context_switch: contextSwitch,
    context_history: contextHistory,
    language_history: languageHistory,
    risk_history: [...previousRiskHistory, clampedRisk],
    decision_history: [...previousDecisionHistory, policyResult.action],
    risk_score: clampedRisk,
    decision: policyResult.action,
    risk_change: riskChangeStr,
    escalation_flags: coercionCues,
    decay_policy: decayPolicy,
  };

  const detection: ContextSwitchDetectionResult = {
    context_switch: contextSwitch,
    from: previousContext || 'initial_state',
    to: contextCategory,
    language_switch: languageSwitch,
    from_language: previousLanguage || 'none',
    to_language: langResult.languageCode,
    risk_change: riskChangeStr,
    is_security_escalation: isEscalation,
    detected_intent: intent,
    confidence: langResult.confidence,
    cues: coercionCues,
  };

  let explanation = `Turn ${turnNumber}: Detected [${langResult.languageName}] language with [${intent}] intent. `;
  if (languageSwitch) {
    explanation += `Language switched from ${previousLanguage?.toUpperCase()} to ${langResult.languageCode.toUpperCase()} (evaluated independently with 0 base penalty). `;
  }
  if (contextSwitch) {
    explanation += `Context shifted from [${previousContext}] to [${contextCategory}] (Risk delta: ${riskChangeStr}). `;
  }
  explanation += `Decision: ${policyResult.action} (Risk: ${clampedRisk}/100).`;

  return {
    sessionContext: updatedSession,
    detection,
    riskScore: clampedRisk,
    riskLevel: policyResult.riskLevel,
    decision: policyResult.action,
    intent,
    detectedLanguage: langResult.languageName,
    detectedLanguageCode: langResult.languageCode,
    isAsrSupported: isSupported,
    explanation,
  };
}
