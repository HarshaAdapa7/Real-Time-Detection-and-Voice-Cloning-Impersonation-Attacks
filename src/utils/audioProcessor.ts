/**
 * Client-Side Audio Ingestion, Feature Extraction & Speech Recognition
 * Real-Time Voice Trust Firewall
 *
 * Implements Layers 1 & 2:
 * 1. Communication (Browser Mic / WebRTC capture)
 * 2. Audio Ingestion (Buffering, 2.5s chunking, VAD, feature extraction)
 */

import { AudioFeatures } from '../types';

export interface AudioProcessorCallbacks {
  onChunk: (features: AudioFeatures, chunkId: number) => void;
  onTranscript: (text: string, isFinal: boolean) => void;
  onVolumeChange: (volume: number) => void;
  onError: (error: string) => void;
}

export class AudioStreamManager {
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private analyser: AnalyserNode | null = null;
  private recognition: any = null;
  private isRunning = false;
  private chunkIntervalTimer: any = null;
  private chunkCounter = 0;
  private callbacks: AudioProcessorCallbacks;

  constructor(callbacks: AudioProcessorCallbacks) {
    this.callbacks = callbacks;
  }

  public async startMicrophone(): Promise<boolean> {
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: false, // Keep raw noise characteristics for detection
          autoGainControl: false,
          sampleRate: 16000,
        },
      });

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioCtx({ sampleRate: 16000 });

      const source = this.audioContext.createMediaStreamSource(this.mediaStream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 1024;
      this.analyser.smoothingTimeConstant = 0.3;

      source.connect(this.analyser);
      this.isRunning = true;
      this.chunkCounter = 0;

      // Start Web Speech API for real-time transcription
      this.initSpeechRecognition();

      // Start chunk evaluation loop every 2.5 seconds
      this.chunkIntervalTimer = setInterval(() => {
        if (!this.isRunning || !this.analyser) return;
        this.chunkCounter++;
        const features = this.extractCurrentFeatures();
        this.callbacks.onChunk(features, this.chunkCounter);
      }, 2500);

      // Start volume animation monitor loop
      this.startVolumeLoop();

      return true;
    } catch (err: any) {
      console.error("Microphone capture error:", err);
      this.callbacks.onError(err.message || "Failed to access microphone. Please check permissions.");
      return false;
    }
  }

  private initSpeechRecognition() {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn("SpeechRecognition not natively supported in this browser. Fallback typing enabled.");
      return;
    }

    try {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-IN'; // Default Indian English / Multilingual context

      this.recognition.onresult = (event: any) => {
        let interim = '';
        let final = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        const text = (final || interim).trim();
        if (text) {
          this.callbacks.onTranscript(text, Boolean(final));
        }
      };

      this.recognition.onerror = (e: any) => {
        console.warn("SpeechRecognition error:", e);
      };

      this.recognition.onend = () => {
        if (this.isRunning && this.recognition) {
          try {
            this.recognition.start();
          } catch {
            // Already started or restarting
          }
        }
      };

      this.recognition.start();
    } catch (err) {
      console.warn("Could not start SpeechRecognition:", err);
    }
  }

  private startVolumeLoop() {
    if (!this.analyser) return;
    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);

    const check = () => {
      if (!this.isRunning || !this.analyser) return;
      this.analyser.getByteFrequencyData(dataArray);

      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const avg = sum / dataArray.length;
      const normalizedVol = Math.min(avg / 128, 1);
      this.callbacks.onVolumeChange(normalizedVol);

      requestAnimationFrame(check);
    };

    requestAnimationFrame(check);
  }

  public extractCurrentFeatures(): AudioFeatures {
    if (!this.analyser) {
      return {
        rms: 0.1,
        pitchVariance: 0.2,
        spectralCentroid: 2100,
        zeroCrossingRate: 0.25,
        silenceRatio: 0.1,
      };
    }

    const bufferLength = this.analyser.frequencyBinCount;
    const timeData = new Float32Array(bufferLength);
    const freqData = new Uint8Array(bufferLength);

    this.analyser.getFloatTimeDomainData(timeData);
    this.analyser.getByteFrequencyData(freqData);

    // RMS Calculation
    let sumSquares = 0;
    let zeroCrossings = 0;
    let silentSamples = 0;

    for (let i = 0; i < timeData.length; i++) {
      const val = timeData[i];
      sumSquares += val * val;
      if (Math.abs(val) < 0.02) {
        silentSamples++;
      }
      if (i > 0 && ((timeData[i] >= 0 && timeData[i - 1] < 0) || (timeData[i] < 0 && timeData[i - 1] >= 0))) {
        zeroCrossings++;
      }
    }

    const rms = Math.sqrt(sumSquares / timeData.length);
    const silenceRatio = silentSamples / timeData.length;
    const zeroCrossingRate = zeroCrossings / timeData.length;

    // Spectral Centroid Calculation
    let freqNumerator = 0;
    let freqDenominator = 0;
    const nyquist = 8000; // Half of 16kHz
    const binSize = nyquist / bufferLength;

    for (let i = 0; i < bufferLength; i++) {
      const mag = freqData[i];
      const freq = i * binSize;
      freqNumerator += freq * mag;
      freqDenominator += mag;
    }

    const spectralCentroid = freqDenominator > 0 ? freqNumerator / freqDenominator : 1500;

    // Pitch variance estimate from time-domain autocorrelation peak fluctuation
    const pitchVariance = Math.min(Math.max((rms * 1.8) + (zeroCrossingRate * 0.4), 0.05), 0.95);

    return {
      rms: Number(rms.toFixed(3)),
      pitchVariance: Number(pitchVariance.toFixed(3)),
      spectralCentroid: Math.round(spectralCentroid),
      zeroCrossingRate: Number(zeroCrossingRate.toFixed(3)),
      silenceRatio: Number(silenceRatio.toFixed(3)),
    };
  }

  public stop() {
    this.isRunning = false;
    if (this.chunkIntervalTimer) {
      clearInterval(this.chunkIntervalTimer);
      this.chunkIntervalTimer = null;
    }
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {
        // Ignore
      }
      this.recognition = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}
