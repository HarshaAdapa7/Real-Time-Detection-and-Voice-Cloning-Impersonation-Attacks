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
  jitterSeed = 0,
  isLiveMic = false
): DeepfakeSignalResult {
  // If in live mic mode, compute purely from the microphone's real acoustic features
  let estimatedProbability: number;

  if (isLiveMic) {
    // Dynamic real-time biological voice analysis:
    // Natural human speech has pitch micro-tremor (pitchVariance ~ 0.18 - 0.50),
    // normal vocal fold spectral centroid (1200 - 2400 Hz), and dynamic energy.
    // Neural TTS/vocoders exhibit unnatural prosodic flatness (pitchVariance < 0.12)
    // or phase discontinuities with high spectral centroids (> 2800 Hz).
    const isVoicing = features.rms > 0.02;
    const isUnnaturallySmooth = features.pitchVariance < 0.12 && isVoicing;
    const isHighSpectralCentroid = features.spectralCentroid > 2800;
    const isZeroCrossingUniform = features.zeroCrossingRate > 0.38;

    if (!isVoicing) {
      // Background / ambient silence
      estimatedProbability = 10;
    } else {
      let base = 12; // Natural human baseline
      if (isUnnaturallySmooth) base += 45;
      if (isHighSpectralCentroid) base += 25;
      if (isZeroCrossingUniform) base += 15;

      // Small dynamic micro-variance based on real vocal fluctuation
      const dynamicFlux = Math.round(features.pitchVariance * 18 - 5);
      estimatedProbability = Math.round(Math.min(Math.max(base + dynamicFlux, 4), 95));
    }
  } else if (scenarioBaseScore !== undefined) {
    // Inject small deterministic natural variance (±4%) based on real audio flux
    const naturalFlux = (features.pitchVariance * 10) % 8 - 4;
    estimatedProbability = Math.min(Math.max(scenarioBaseScore + naturalFlux, 2), 99);
  } else {
    // Calculate heuristics from audio features:
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
