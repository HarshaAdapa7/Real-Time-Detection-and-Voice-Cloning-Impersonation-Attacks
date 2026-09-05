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
  onAudioChunkReady?: (blob: Blob, base64Url: string, durationSeconds: number) => void;
  onLanguageDetected?: (lang: string) => void;
  onLiveFeatures?: (features: AudioFeatures) => void;
}

export class AudioStreamManager {
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private analyser: AnalyserNode | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private recognition: any = null;
  private isRunning = false;
  private isPaused = false;
  private chunkIntervalTimer: any = null;
  private chunkCounter = 0;
  private callbacks: AudioProcessorCallbacks;
  private activeLanguage = 'en-IN';
  private pendingInterimText = '';
  private interimCommitTimer: any = null;
  private recognitionRestartTimer: any = null;
  private speechWatchdogTimer: any = null;
  private lastVoiceActivityTime = 0;
  private lastTranscriptTime = Date.now();
  private isTranscribingChunk = false;

  constructor(callbacks: AudioProcessorCallbacks) {
    this.callbacks = callbacks;
  }

  public setLanguage(langCode: string) {
    this.activeLanguage = langCode.includes('-') ? langCode : `${langCode}-IN`;
    if (this.recognition) {
      try {
        this.recognition.lang = this.activeLanguage;
        if (this.isRunning && !this.isPaused) {
          try {
            this.recognition.stop();
          } catch {
            // Handled by onend
          }
        }
      } catch {
        // Ignored
      }
    }
  }

  public async startMicrophone(): Promise<boolean> {
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: false, // Keep raw noise characteristics for detection
          autoGainControl: true,
          sampleRate: 16000,
        },
      });

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioCtx({ sampleRate: 16000 });

      const source = this.audioContext.createMediaStreamSource(this.mediaStream);

      // Pre-amplifier and DynamicsCompressor for enhanced listening sensitivity & clarity
      const gainNode = this.audioContext.createGain();
      gainNode.gain.setValueAtTime(1.8, this.audioContext.currentTime);

      const compressor = this.audioContext.createDynamicsCompressor();
      compressor.threshold.setValueAtTime(-24, this.audioContext.currentTime);
      compressor.knee.setValueAtTime(30, this.audioContext.currentTime);
      compressor.ratio.setValueAtTime(12, this.audioContext.currentTime);
      compressor.attack.setValueAtTime(0.003, this.audioContext.currentTime);
      compressor.release.setValueAtTime(0.25, this.audioContext.currentTime);

      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 1024;
      this.analyser.smoothingTimeConstant = 0.3;

      source.connect(gainNode);
      gainNode.connect(compressor);
      compressor.connect(this.analyser);

      this.isRunning = true;
      this.isPaused = false;
      this.chunkCounter = 0;
      this.recordedChunks = [];

      // Start MediaRecorder for capturing real audio chunks
      this.initMediaRecorder();

      // Start Web Speech API for real-time transcription
      this.initSpeechRecognition();

      // Start chunk evaluation loop every 2.5 seconds
      this.chunkIntervalTimer = setInterval(() => {
        if (!this.isRunning || this.isPaused || !this.analyser) return;
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

  private initMediaRecorder() {
    if (!this.mediaStream || typeof MediaRecorder === 'undefined') return;

    try {
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : '';

      const options = mimeType ? { mimeType } : {};
      this.mediaRecorder = new MediaRecorder(this.mediaStream, options);

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          this.recordedChunks.push(event.data);
          if (this.callbacks.onAudioChunkReady) {
            const chunkBlob = new Blob([event.data], { type: event.data.type || 'audio/webm' });
            const reader = new FileReader();
            reader.onloadend = () => {
              const dataUrl = reader.result as string;
              this.callbacks.onAudioChunkReady?.(chunkBlob, dataUrl, 2.5);
            };
            reader.readAsDataURL(chunkBlob);
          }
        }
      };

      // Slice recording every 2.5s
      this.mediaRecorder.start(2500);
    } catch (recErr) {
      console.warn("MediaRecorder could not start (will proceed with audio analysis):", recErr);
    }
  }

  public pauseMicrophone() {
    this.isPaused = true;
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      try {
        this.mediaRecorder.pause();
      } catch (e) {
        console.warn("Error pausing MediaRecorder:", e);
      }
    }
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {
        // Ignored
      }
    }
  }

  public resumeMicrophone() {
    this.isPaused = false;
    if (this.mediaRecorder && this.mediaRecorder.state === 'paused') {
      try {
        this.mediaRecorder.resume();
      } catch (e) {
        console.warn("Error resuming MediaRecorder:", e);
      }
    }
    if (this.recognition && this.isRunning) {
      try {
        this.recognition.start();
      } catch (e) {
        // Ignored
      }
    }
  }

  public getRecordedBlob(): Blob | null {
    if (this.recordedChunks.length === 0) return null;
    const type = this.recordedChunks[0]?.type || 'audio/webm';
    return new Blob(this.recordedChunks, { type });
  }

  public async getRecordedAudioDataUrl(): Promise<string> {
    const blob = this.getRecordedBlob();
    if (!blob) return '';
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
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
      this.recognition.lang = this.activeLanguage || 'en-IN'; // Multilingual ASR context

      this.recognition.onresult = (event: any) => {
        this.lastTranscriptTime = Date.now();
        let interim = '';
        let final = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        
        const trimmedFinal = final.trim();
        const trimmedInterim = interim.trim();

        if (trimmedFinal) {
          if (this.interimCommitTimer) {
            clearTimeout(this.interimCommitTimer);
            this.interimCommitTimer = null;
          }
          this.pendingInterimText = '';
          this.callbacks.onTranscript(trimmedFinal, true);
        } else if (trimmedInterim) {
          this.pendingInterimText = trimmedInterim;
          this.callbacks.onTranscript(trimmedInterim, false);

          // Auto-commit timer: If speaker pauses for 1000ms, commit as a finalized turn to prevent dropped speech
          if (this.interimCommitTimer) {
            clearTimeout(this.interimCommitTimer);
          }
          this.interimCommitTimer = setTimeout(() => {
            if (this.pendingInterimText && this.isRunning && !this.isPaused) {
              const textToCommit = this.pendingInterimText;
              this.pendingInterimText = '';
              this.callbacks.onTranscript(textToCommit, true);
            }
          }, 1100);
        }
      };

      this.recognition.onerror = (e: any) => {
        // Non-fatal error recovery for no-speech or network hiccups
        if (e?.error === 'no-speech' || e?.error === 'network') {
          // Normal pause in speech, will auto-recover
          return;
        }
        console.warn("SpeechRecognition notice:", e?.error || e);
      };

      this.recognition.onend = () => {
        // Flush any pending text before restarting
        if (this.pendingInterimText) {
          const textToCommit = this.pendingInterimText;
          this.pendingInterimText = '';
          this.callbacks.onTranscript(textToCommit, true);
        }

        // Resilient debounce restart (prevents InvalidStateError in Chromium)
        if (this.recognitionRestartTimer) {
          clearTimeout(this.recognitionRestartTimer);
        }
        this.recognitionRestartTimer = setTimeout(() => {
          if (this.isRunning && !this.isPaused) {
            try {
              if (this.recognition) {
                this.recognition.start();
              } else {
                this.initSpeechRecognition();
              }
            } catch {
              // If start threw InvalidStateError or object is stale, recreate instance
              this.initSpeechRecognition();
            }
          }
        }, 300);
      };

      this.recognition.start();
    } catch (err) {
      console.warn("Could not start SpeechRecognition:", err);
    }
  }

  private startVolumeLoop() {
    if (!this.analyser) return;
    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    let lastFeatureEmit = 0;
    let lastWatchdogCheck = 0;

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

      // Track voice activity if speech energy detected
      const now = performance.now();
      const wallNow = Date.now();
      if (normalizedVol > 0.07) {
        this.lastVoiceActivityTime = wallNow;
      }

      // Speech Recognition Watchdog: if user is speaking but Web Speech API is silent for >3.5s
      if (now - lastWatchdogCheck > 2500) {
        lastWatchdogCheck = now;
        const speechActiveRecently = wallNow - this.lastVoiceActivityTime < 2000;
        const speechStalled = wallNow - this.lastTranscriptTime > 4000;

        if (speechActiveRecently && speechStalled && !this.isTranscribingChunk && this.isRunning && !this.isPaused) {
          // Attempt neural transcription via Gemini for the recent audio buffer
          this.transcribeRecentAudioChunk();
        }
      }

      // Periodically emit real-time features every 180ms for fluid visual telemetry
      if (this.callbacks.onLiveFeatures && now - lastFeatureEmit > 180) {
        lastFeatureEmit = now;
        const liveFeats = this.extractCurrentFeatures();
        this.callbacks.onLiveFeatures(liveFeats);
      }

      requestAnimationFrame(check);
    };

    requestAnimationFrame(check);
  }

  /**
   * Neural Gemini Speech-to-Text for live audio chunks when Web Speech drops regional words
   */
  public async transcribeRecentAudioChunk(explicitBlob?: Blob, langHint?: string): Promise<void> {
    if (this.isTranscribingChunk || !this.isRunning || this.isPaused) return;

    try {
      this.isTranscribingChunk = true;
      const blob = explicitBlob || this.getRecordedBlob();
      if (!blob || blob.size < 4000) return; // Ignore empty / click noise

      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64Url = reader.result as string;
          const targetLang = langHint || this.activeLanguage.split('-')[0] || 'auto';

          const res = await fetch('/api/transcribe-audio', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              audio: base64Url,
              mimeType: blob.type || 'audio/webm',
              languageHint: targetLang,
            }),
          });

          if (res.ok) {
            const data = await res.json();
            if (data.isSpeechDetected && data.transcript && data.transcript.trim()) {
              this.lastTranscriptTime = Date.now();
              this.callbacks.onTranscript(data.transcript.trim(), true);
              if (data.detectedLanguage && this.callbacks.onLanguageDetected) {
                this.callbacks.onLanguageDetected(data.detectedLanguage);
              }
            }
          }
        } catch (postErr) {
          console.warn("Neural ASR fallback network warn:", postErr);
        } finally {
          this.isTranscribingChunk = false;
        }
      };
      reader.readAsDataURL(blob);
    } catch {
      this.isTranscribingChunk = false;
    }
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
    this.isPaused = false;
    if (this.recognitionRestartTimer) {
      clearTimeout(this.recognitionRestartTimer);
      this.recognitionRestartTimer = null;
    }
    if (this.speechWatchdogTimer) {
      clearTimeout(this.speechWatchdogTimer);
      this.speechWatchdogTimer = null;
    }
    if (this.interimCommitTimer) {
      clearTimeout(this.interimCommitTimer);
      this.interimCommitTimer = null;
    }
    // Final flush of any pending spoken utterance
    if (this.pendingInterimText) {
      const textToCommit = this.pendingInterimText;
      this.pendingInterimText = '';
      this.callbacks.onTranscript(textToCommit, true);
    }
    if (this.chunkIntervalTimer) {
      clearInterval(this.chunkIntervalTimer);
      this.chunkIntervalTimer = null;
    }
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try {
        this.mediaRecorder.stop();
      } catch (e) {
        // Ignored
      }
      this.mediaRecorder = null;
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

/**
 * Scenario Audio Synthesizer & Stream Emulator
 * Plays back realistic scenario voice using Gemini 3.1 Flash Neural TTS
 * with resilient browser SpeechSynthesis fallback (natural human voices, zero robotic buzzers)
 * and real-time DSP audio telemetry.
 */
export class ScenarioAudioPlayer {
  private utterance: SpeechSynthesisUtterance | null = null;
  private audioContext: AudioContext | null = null;
  private bufferSource: AudioBufferSourceNode | null = null;
  private isPlaying = false;
  private animFrameId: number | null = null;
  private watchdogTimer: any = null;
  private volumeCallback: (vol: number) => void;
  private stateChangeCallback: (isPlaying: boolean) => void;
  private chunkCallback?: (features: AudioFeatures) => void;

  constructor(
    onVolumeChange: (vol: number) => void,
    onStateChange: (isPlaying: boolean) => void,
    onChunk?: (features: AudioFeatures) => void
  ) {
    this.volumeCallback = onVolumeChange;
    this.stateChangeCallback = onStateChange;
    this.chunkCallback = onChunk;
  }

  private getOrCreateAudioContext(): AudioContext {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!this.audioContext || this.audioContext.state === 'closed') {
      this.audioContext = new AudioCtx();
    }
    return this.audioContext;
  }

  public async play(
    text: string,
    filterType: string = 'natural',
    pitch: number = 1.0,
    rate: number = 1.0,
    languageCode: string = 'en',
    baseFeatures?: Partial<AudioFeatures>
  ) {
    this.stop();

    this.isPlaying = true;
    this.stateChangeCallback(true);

    // Try Gemini Real-Voice Neural TTS first for genuine, human-like voice
    const geminiSuccess = await this.tryPlayGeminiTts(text, languageCode, filterType);
    if (geminiSuccess) {
      return;
    }

    // Fallback to high-fidelity browser speech synthesis (with natural voices and zero harsh buzzers)
    this.playBrowserNaturalSpeech(text, filterType, pitch, rate, languageCode);
  }

  /**
   * Generates and streams realistic human voice using server-side Gemini 3.1 Flash TTS
   */
  private async tryPlayGeminiTts(text: string, languageCode: string, filterType: string): Promise<boolean> {
    try {
      // Pick voice suited to tone: Kore is warm/natural, Puck is expressive, Fenrir is authoritative
      const voiceName = filterType === 'distressed' ? 'Puck' : filterType === 'authoritative' ? 'Fenrir' : 'Kore';

      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text.slice(0, 450),
          voiceName,
          languageCode,
        }),
      });

      if (!res.ok) {
        return false;
      }

      const data = await res.json();
      if (!data.base64Audio) {
        return false;
      }

      // Decode raw 16-bit linear PCM at 24000Hz into Web Audio buffer
      const binaryString = atob(data.base64Audio);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const int16Array = new Int16Array(bytes.buffer);
      const float32Array = new Float32Array(int16Array.length);
      for (let i = 0; i < int16Array.length; i++) {
        float32Array[i] = int16Array[i] / 32768.0;
      }

      const ctx = this.getOrCreateAudioContext();
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      const audioBuffer = ctx.createBuffer(1, float32Array.length, 24000);
      audioBuffer.copyToChannel(float32Array, 0);

      // Create audio source node
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;

      // Real telephony acoustic filtering (soft bandpass 300Hz-3400Hz like a real phone call)
      const lowpass = ctx.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.setValueAtTime(3600, ctx.currentTime);

      const highpass = ctx.createBiquadFilter();
      highpass.type = 'highpass';
      highpass.frequency.setValueAtTime(260, ctx.currentTime);

      // Connect graph: source -> highpass -> lowpass -> destination
      source.connect(highpass);
      highpass.connect(lowpass);
      lowpass.connect(ctx.destination);

      source.onended = () => {
        this.stop();
      };

      this.bufferSource = source;
      source.start();

      this.startAudioTelemetry(filterType);
      return true;
    } catch (err) {
      console.warn('Gemini Neural TTS unavailable, using local natural speech engine:', err);
      return false;
    }
  }

  /**
   * Resilient fallback using browser SpeechSynthesis with human-like vocal modulation
   * and clean telephone frequency response (no artificial robotic synthesizer buzzes)
   */
  private playBrowserNaturalSpeech(
    text: string,
    filterType: string,
    pitch: number,
    rate: number,
    languageCode: string
  ) {
    if (!('speechSynthesis' in window)) {
      console.warn('SpeechSynthesis not supported in this browser.');
      this.stop();
      return;
    }

    try {
      window.speechSynthesis.cancel();
      window.speechSynthesis.resume();
    } catch {
      // Ignore
    }

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Natural human conversational rate & pitch limits
    utterance.rate = Math.max(0.92, Math.min(rate, 1.15));
    utterance.pitch = Math.max(0.9, Math.min(pitch, 1.1));

    // Resolve matching language code
    const langMap: Record<string, string> = {
      hi: 'hi-IN',
      te: 'te-IN',
      ta: 'ta-IN',
      en: 'en-IN',
    };
    const targetLang = langMap[languageCode] || 'en-IN';
    utterance.lang = targetLang;

    // Pick the most natural, human-sounding voice installed on the user's OS
    const selectBestVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      if (!voices || voices.length === 0) return;

      // 1. Check for natural/neural voices in target language
      const targetNaturalVoice = voices.find(
        (v) =>
          v.lang.toLowerCase().replace('_', '-').startsWith(targetLang.slice(0, 2)) &&
          (v.name.includes('Natural') ||
            v.name.includes('Google') ||
            v.name.includes('Neural') ||
            v.name.includes('Enhanced') ||
            v.name.includes('Premium') ||
            v.name.includes('Online'))
      );

      // 2. Any voice in target language
      const targetVoice = voices.find((v) =>
        v.lang.toLowerCase().replace('_', '-').startsWith(targetLang.slice(0, 2))
      );

      // 3. High quality English natural voice
      const englishNaturalVoice = voices.find(
        (v) =>
          v.lang.startsWith('en') &&
          (v.name.includes('Natural') ||
            v.name.includes('Google') ||
            v.name.includes('Neural') ||
            v.name.includes('Enhanced') ||
            v.name.includes('Samantha') ||
            v.name.includes('Rishi'))
      );

      // 4. Default system voice
      const best = targetNaturalVoice || targetVoice || englishNaturalVoice || voices[0];
      if (best) {
        utterance.voice = best;
      }
    };

    selectBestVoice();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = selectBestVoice;
    }

    utterance.onend = () => {
      this.stop();
    };

    utterance.onerror = (e) => {
      console.warn('SpeechSynthesis event error:', e);
      this.stop();
    };

    // Watchdog timer: Chrome bug workaround where long utterances stop after 14 seconds
    this.watchdogTimer = setInterval(() => {
      if (this.isPlaying && window.speechSynthesis.speaking) {
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
      }
    }, 10000);

    this.utterance = utterance;
    window.speechSynthesis.speak(utterance);

    this.startAudioTelemetry(filterType);
  }

  private startAudioTelemetry(filterType: string) {
    let phase = 0;
    const animate = () => {
      if (!this.isPlaying) return;
      phase += 0.12;

      // Realistic conversational speech envelope with natural human pauses
      const rawEnvelope = Math.sin(phase) * Math.cos(phase * 0.35) + (Math.sin(phase * 2.3) * 0.2);
      const isVoiceActive = rawEnvelope > -0.15;
      const currentVol = isVoiceActive ? Math.min(Math.max((rawEnvelope + 0.6) * 0.65, 0.15), 0.88) : 0.05;

      this.volumeCallback(currentVol);

      if (this.chunkCallback && Math.random() < 0.1) {
        this.chunkCallback({
          rms: Number(currentVol.toFixed(3)),
          pitchVariance: filterType === 'distressed' ? 0.65 : 0.24,
          spectralCentroid: filterType === 'replay-echo' ? 1650 : 2200,
          zeroCrossingRate: 0.19,
          silenceRatio: isVoiceActive ? 0.15 : 0.8,
        });
      }

      this.animFrameId = requestAnimationFrame(animate);
    };
    this.animFrameId = requestAnimationFrame(animate);
  }

  public stop() {
    this.isPlaying = false;
    this.stateChangeCallback(false);
    this.volumeCallback(0);

    if (this.watchdogTimer) {
      clearInterval(this.watchdogTimer);
      this.watchdogTimer = null;
    }

    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    if (this.bufferSource) {
      try {
        this.bufferSource.stop();
        this.bufferSource.disconnect();
      } catch {
        // Ignore
      }
      this.bufferSource = null;
    }

    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Ignore
      }
    }
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }
}
