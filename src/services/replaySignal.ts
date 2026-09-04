/**
 * Layer 2.3: Replay / Channel Anomaly Signal
 *
 * REAL VS SIMULATED STATUS: [SIMULATED]
 * In a production deployment, this module uses DSP spectral analysis, room impulse
 * response (RIR) deconvolution, and high-frequency roll-off detection to distinguish
 * physical speaker playback (e.g., voice played through a smartphone speaker into a laptop mic)
 * from direct live acoustic human speech. It also isolates telephony compression artifacts (G.711 µ-law, GSM).
 *
 * For this prototype, this simulates replay / channel anomaly scoring based on audio features
 * and scenario parameters.
 */

import { AudioFeatures, ReplaySignalResult } from '../types';

export function computeReplaySignal(
  features: AudioFeatures,
  scenarioBaseReplay?: number,
  jitterSeed = 0
): ReplaySignalResult {
  let score: number;
  let channelProfile = "Standard VoIP / Browser MediaStream";

  if (scenarioBaseReplay !== undefined) {
    const wobble = Math.sin(jitterSeed * 1.8) * 3;
    score = Math.min(Math.max(scenarioBaseReplay + wobble, 4), 98);
  } else {
    // If silence ratio is unusually low or background noise exhibits steady room echo
    const hasDampedTreble = features.spectralCentroid < 1800 && features.rms > 0.08;
    const isUnnaturalResonance = features.zeroCrossingRate < 0.12;

    let base = 20;
    if (hasDampedTreble) base += 35;
    if (isUnnaturalResonance) base += 20;

    const variation = Math.sin(jitterSeed * 1.2) * 4;
    score = Math.round(Math.min(Math.max(base + variation, 8), 92));
  }

  const roundedScore = Math.round(score);

  if (roundedScore > 70) {
    channelProfile = "Acoustic Replay Detected (Secondary speaker transducer coloration & RIR reverberation)";
  } else if (roundedScore > 40) {
    channelProfile = "G.711 µ-law Telephony Downsampled (8 kHz voiceband filter)";
  } else {
    channelProfile = "Clean Direct Acoustic Channel (Single acoustic source verified)";
  }

  return {
    replayScore: roundedScore,
    channelProfile,
    spectralDamping: Number((roundedScore * 0.012).toFixed(2)),
    isSimulated: true,
  };
}
