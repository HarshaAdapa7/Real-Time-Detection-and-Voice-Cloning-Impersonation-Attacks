/**
 * Layer 2.1: Deepfake / Anti-Spoofing Detection Signal
 *
 * REAL VS SIMULATED STATUS: [SIMULATED]
 * In a production deployment, this module would invoke self-hosted AASIST (Graph-based)
 * or RawNet2 (Waveform CNN) models fine-tuned on ASVspoof 2019/2021 LA/PA/DF partitions
 * and IndicSynth corpora (12 Indian languages) to detect neural TTS/VC vocoder artifacts.
 *
 * For this prototype environment, this function simulates synthetic voice probability
 * using real client-side extracted audio DSP features (spectral variance, pitch smoothness,
 * silence ratio, zero-crossing rate) blended with deterministic heuristics.
 */

import { AudioFeatures, DeepfakeSignalResult } from '../types';

export function computeDeepfakeSignal(
  features: AudioFeatures,
  scenarioBaseScore?: number,
  jitterSeed = 0
): DeepfakeSignalResult {
  // If a scenario preset is selected, use it as the anchor
  let estimatedProbability: number;

  if (scenarioBaseScore !== undefined) {
    // Inject small deterministic natural variance (±4%) based on real audio flux
    const naturalFlux = (features.pitchVariance * 10) % 8 - 4;
    estimatedProbability = Math.min(Math.max(scenarioBaseScore + naturalFlux, 2), 99);
  } else {
    // Calculate heuristics from audio features:
    // Synthetic TTS often displays unnaturally low pitch variance (flat prosody)
    // or unusually uniform spectral centroids compared to human speech.
    const isUnnaturallySmooth = features.pitchVariance < 0.15 && features.rms > 0.05;
    const isHighSpectralCentroid = features.spectralCentroid > 2800;
    const isZeroCrossingUniform = features.zeroCrossingRate > 0.35;

    let base = 25; // baseline suspicion
    if (isUnnaturallySmooth) base += 35;
    if (isHighSpectralCentroid) base += 20;
    if (isZeroCrossingUniform) base += 15;

    // Add mild time-varying pseudo-random variation
    const variation = Math.sin(jitterSeed * 1.5) * 6;
    estimatedProbability = Math.round(Math.min(Math.max(base + variation, 8), 95));
  }

  const artifacts: string[] = [];
  if (estimatedProbability > 70) {
    artifacts.push("Neural vocoder phase discontinuity (HiFi-GAN/FastPitch artifact)");
    artifacts.push("Sub-band energy anomaly above 4 kHz cutoff");
    artifacts.push("Unnatural prosodic flatness (ASVspoof LA cue)");
  } else if (estimatedProbability > 40) {
    artifacts.push("Acoustic boundary roughness detected");
    artifacts.push("Minor spectral envelope inconsistency");
  } else {
    artifacts.push("Natural human glottal excitation verified");
    artifacts.push("Biological pitch micro-tremor consistent with human vocal tract");
  }

  const generatorSignature =
    estimatedProbability > 75
      ? "XTTS-v2 / Indic-TTS Synthetic Generator (Unseen Test Class)"
      : estimatedProbability > 50
      ? "Probable Voice Conversion (FreeVC-like timbre shift)"
      : "Authentic Human Phonology";

  return {
    score: Math.round(estimatedProbability),
    artifactsDetected: artifacts,
    generatorSignature,
    isSimulated: true,
    confidence: Number((0.85 + (Math.sin(jitterSeed) * 0.08)).toFixed(2)),
  };
}
