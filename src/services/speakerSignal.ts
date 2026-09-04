/**
 * Layer 2.2: Speaker Verification Similarity Signal
 *
 * REAL VS SIMULATED STATUS: [SIMULATED]
 * In a production architecture, this module uses an open-weight speaker embedding model
 * (SpeechBrain ECAPA-TDNN or pyannote-audio) to produce 192-d or 512-d speaker embeddings
 * from the live audio stream, and compares them against pre-enrolled speaker vectors
 * using cosine distance. Raw audio is never permanently saved (DPDP Act privacy alignment).
 *
 * For this prototype, this simulates acoustic similarity to the enrolled speaker profile.
 * High similarity (e.g. >80%) indicates the voice timbre closely matches the legitimate speaker.
 * Low similarity (e.g. <40%) indicates an unfamiliar or mismatched voice.
 * Note: Impersonation risk = 100 - similarity.
 */

import { AudioFeatures, SpeakerSignalResult } from '../types';

export function computeSpeakerSignal(
  enrolledSpeakerId: string,
  enrolledSpeakerName: string,
  features: AudioFeatures,
  scenarioBaseSimilarity?: number,
  jitterSeed = 0
): SpeakerSignalResult {
  let similarity: number;

  if (scenarioBaseSimilarity !== undefined) {
    const naturalWobble = (Math.cos(jitterSeed * 1.3) * 3);
    similarity = Math.min(Math.max(scenarioBaseSimilarity + naturalWobble, 5), 98);
  } else {
    // Basic acoustic resonance heuristic based on speaker profile frequency band
    const pitchRatio = Math.min(features.spectralCentroid / 2000, 1.5);
    const baseSim = 75 - (Math.abs(pitchRatio - 1.0) * 30);
    const variation = Math.cos(jitterSeed * 2.1) * 5;
    similarity = Math.round(Math.min(Math.max(baseSim + variation, 15), 95));
  }

  const roundedSim = Math.round(similarity);

  return {
    similarity: roundedSim,
    mismatchRisk: 100 - roundedSim,
    enrolledSpeakerId,
    enrolledSpeakerName,
    isSimulated: true,
  };
}
