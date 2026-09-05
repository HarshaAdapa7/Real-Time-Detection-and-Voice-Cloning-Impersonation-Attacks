/**
 * Layer 6: Risk Fusion Engine
 *
 * REAL VS SIMULATED STATUS: [REAL MATHEMATICAL FUSION ENGINE]
 * Combines all multi-modal evidence streams into a unified 0-100 Risk Score:
 * 1. Deepfake / Anti-Spoofing probability (w_deepfake)
 * 2. Speaker Impersonation Risk [100 - Similarity] (w_speaker)
 * 3. Replay / Channel Anomaly (w_replay)
 * 4. Conversation Intelligence / NLP Social Engineering (w_nlp)
 * 5. Context & Transaction Policy Anomaly (w_context)
 *
 * Implements transparent weighted summation with normalized contributions
 * and dominant threat vector attribution.
 */

import { RiskFusionResult, RiskLevel } from '../types';

export interface FusionInputs {
  deepfakeScore: number;       // 0-100
  speakerSimilarity: number;   // 0-100 -> Mismatch = 100 - speakerSimilarity
  replayScore: number;         // 0-100
  nlpScore: number;            // 0-100
  contextScore: number;        // 0-100
  weights: {
    deepfake: number;
    speaker: number;
    replay: number;
    nlp: number;
    context: number;
  };
  otpCredentialRequested?: boolean;
  financialDemandUrgent?: boolean;
  digitalArrestExtortion?: boolean;
  remoteAccessTrojan?: boolean;
  scamPretext?: boolean;
  threatCues?: string[];
}

export function fuseRiskSignals(inputs: FusionInputs): RiskFusionResult {
  const {
    deepfakeScore,
    speakerSimilarity,
    replayScore,
    nlpScore,
    contextScore,
    weights,
    otpCredentialRequested,
    financialDemandUrgent,
    digitalArrestExtortion,
    remoteAccessTrojan,
    scamPretext,
    threatCues = [],
  } = inputs;

  const speakerMismatchRisk = Math.max(0, 100 - speakerSimilarity);

  // Normalize weights if sum != 1.0
  const totalWeight = weights.deepfake + weights.speaker + weights.replay + weights.nlp + weights.context;
  const wNorm = {
    deepfake: weights.deepfake / totalWeight,
    speaker: weights.speaker / totalWeight,
    replay: weights.replay / totalWeight,
    nlp: weights.nlp / totalWeight,
    context: weights.context / totalWeight,
  };

  const deepfakeContribution = Number((deepfakeScore * wNorm.deepfake).toFixed(1));
  const speakerContribution = Number((speakerMismatchRisk * wNorm.speaker).toFixed(1));
  const replayContribution = Number((replayScore * wNorm.replay).toFixed(1));
  const nlpContribution = Number((nlpScore * wNorm.nlp).toFixed(1));
  const contextContribution = Number((contextScore * wNorm.context).toFixed(1));

  const rawSum = deepfakeContribution + speakerContribution + replayContribution + nlpContribution + contextContribution;
  let finalRiskScore = Math.round(Math.min(Math.max(rawSum, 0), 100));

  // --- ZERO-TRUST DEFENSE-IN-DEPTH: CRITICAL THREAT CIRCUIT BREAKERS ---
  // In real telecom & banking security, P0 attack vectors (e.g. demanding OTP/passwords,
  // high-urgency financial wire exfiltration, digital arrest coercion, or extreme synthetic voice)
  // must NEVER be diluted or masked by benign acoustic silence or baseline profile matching.
  let circuitBreakerTriggered: string | undefined;

  const hasOtpEvidence =
    Boolean(otpCredentialRequested) ||
    (nlpScore >= 75 && threatCues.some((c) => /otp|credential|password|pin|verification code|one-time/i.test(c)));

  const hasDigitalArrestEvidence =
    Boolean(digitalArrestExtortion) ||
    (nlpScore >= 65 && threatCues.some((c) => /digital arrest|police|cbi|customs|court|warrant|fir|law enforcement|arrest/i.test(c)));

  const hasUrgentWireEvidence =
    Boolean(financialDemandUrgent) ||
    (nlpScore >= 75 && (contextScore >= 45 || threatCues.some((c) => /wire|transfer|rtgs|neft|lakh|rupees|paise|crore|send money/i.test(c))));

  const hasRemoteAccessEvidence =
    Boolean(remoteAccessTrojan) ||
    (nlpScore >= 70 && threatCues.some((c) => /anydesk|teamviewer|rustdesk|apk|remote access|screen share/i.test(c)));

  const hasScamPretextEvidence =
    Boolean(scamPretext) ||
    (nlpScore >= 70 && threatCues.some((c) => /electricity bill|power cut|kyc|lottery|task job/i.test(c)));

  if (hasOtpEvidence) {
    finalRiskScore = Math.max(finalRiskScore, 92);
    circuitBreakerTriggered = '⚡ P0 Security Circuit-Breaker: Unauthorized OTP / Credential Harvesting solicitation detected (Risk Floor locked at 92% -> Immediate BLOCK)';
  } else if (hasDigitalArrestEvidence) {
    finalRiskScore = Math.max(finalRiskScore, 89);
    circuitBreakerTriggered = '⚡ P0 Security Circuit-Breaker: Law Enforcement / Digital Arrest Coercion Extortion detected (Risk Floor locked at 89% -> Immediate BLOCK)';
  } else if (hasRemoteAccessEvidence) {
    finalRiskScore = Math.max(finalRiskScore, 88);
    circuitBreakerTriggered = '⚡ P0 Security Circuit-Breaker: Remote Access Trojan / Screen Sharing solicitation (Risk Floor locked at 88% -> Immediate BLOCK)';
  } else if (hasUrgentWireEvidence) {
    finalRiskScore = Math.max(finalRiskScore, 86);
    circuitBreakerTriggered = '⚡ P0 Security Circuit-Breaker: High-Urgency Unverified Financial Transfer solicitation detected (Risk Floor locked at 86% -> Immediate BLOCK)';
  } else if (hasScamPretextEvidence) {
    finalRiskScore = Math.max(finalRiskScore, 82);
    circuitBreakerTriggered = '⚡ Pretext Security Circuit-Breaker: Utility disconnection / KYC urgency trope detected (Risk locked at 82% -> Immediate BLOCK)';
  } else if (deepfakeScore >= 70) {
    finalRiskScore = Math.max(finalRiskScore, 85);
    circuitBreakerTriggered = `⚡ Acoustic Circuit-Breaker: High Synthetic Vocal Tract / Neural Vocoder detected (${deepfakeScore}% -> Immediate BLOCK)`;
  } else if (replayScore >= 75) {
    finalRiskScore = Math.max(finalRiskScore, 82);
    circuitBreakerTriggered = `⚡ Acoustic Circuit-Breaker: High Loudspeaker Replay Channel Loop detected (${replayScore}% -> Immediate BLOCK)`;
  } else if (speakerMismatchRisk >= 65 && contextScore >= 40) {
    finalRiskScore = Math.max(finalRiskScore, 78);
    circuitBreakerTriggered = `⚡ Identity Circuit-Breaker: Severe Biometric Disparity for Privileged Caller Role (${speakerMismatchRisk}% Mismatch)`;
  } else if (nlpScore >= 78) {
    finalRiskScore = Math.max(finalRiskScore, 78);
    circuitBreakerTriggered = `⚡ NLP Security Circuit-Breaker: High Social Engineering & Coercion Intent (${nlpScore}%)`;
  }

  // Determine Risk Level
  let riskLevel: RiskLevel;
  if (finalRiskScore <= 25) {
    riskLevel = 'LOW';
  } else if (finalRiskScore <= 55) {
    riskLevel = 'MEDIUM';
  } else if (finalRiskScore <= 75) {
    riskLevel = 'HIGH';
  } else {
    riskLevel = 'CRITICAL';
  }

  // Find dominant threat vector
  const signalMap = [
    { name: "Voice Deepfake / Synthetic Artifacts", value: deepfakeContribution },
    { name: "Speaker Biometric Mismatch", value: speakerContribution },
    { name: "Replay / Acoustic Channel Anomaly", value: replayContribution },
    { name: "Social Engineering & Coercion (Gemini NLP)", value: circuitBreakerTriggered ? 90 : nlpContribution },
    { name: "Context / Transaction Policy Violation", value: contextContribution },
  ];
  signalMap.sort((a, b) => b.value - a.value);
  const dominantRiskFactor = circuitBreakerTriggered ? circuitBreakerTriggered.split(':')[1]?.trim() || signalMap[0].name : signalMap[0].name;

  let formulaString = `Risk = (${deepfakeScore}×${(wNorm.deepfake).toFixed(2)}) + (${speakerMismatchRisk}×${(wNorm.speaker).toFixed(2)}) + (${replayScore}×${(wNorm.replay).toFixed(2)}) + (${nlpScore}×${(wNorm.nlp).toFixed(2)}) + (${contextScore}×${(wNorm.context).toFixed(2)}) = ${rawSum.toFixed(1)}`;
  if (circuitBreakerTriggered) {
    formulaString += ` -> Elevated to ${finalRiskScore} (Active Circuit-Breaker)`;
  }

  return {
    finalRiskScore,
    riskLevel,
    weightedBreakdown: {
      deepfakeContribution,
      speakerContribution,
      replayContribution,
      nlpContribution,
      contextContribution,
    },
    weights: wNorm,
    dominantRiskFactor,
    formulaString,
    circuitBreakerTriggered,
    isCircuitBreakerActive: Boolean(circuitBreakerTriggered),
  };
}
