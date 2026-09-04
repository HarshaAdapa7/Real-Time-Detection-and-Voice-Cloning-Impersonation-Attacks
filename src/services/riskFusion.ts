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
}

export function fuseRiskSignals(inputs: FusionInputs): RiskFusionResult {
  const { deepfakeScore, speakerSimilarity, replayScore, nlpScore, contextScore, weights } = inputs;

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
  const finalRiskScore = Math.round(Math.min(Math.max(rawSum, 0), 100));

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
    { name: "Social Engineering & Coercion (Gemini NLP)", value: nlpContribution },
    { name: "Context / Transaction Policy Violation", value: contextContribution },
  ];
  signalMap.sort((a, b) => b.value - a.value);
  const dominantRiskFactor = signalMap[0].name;

  const formulaString = `Risk = (${deepfakeScore}×${(wNorm.deepfake).toFixed(2)}) + (${speakerMismatchRisk}×${(wNorm.speaker).toFixed(2)}) + (${replayScore}×${(wNorm.replay).toFixed(2)}) + (${nlpScore}×${(wNorm.nlp).toFixed(2)}) + (${contextScore}×${(wNorm.context).toFixed(2)}) = ${finalRiskScore}`;

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
  };
}
