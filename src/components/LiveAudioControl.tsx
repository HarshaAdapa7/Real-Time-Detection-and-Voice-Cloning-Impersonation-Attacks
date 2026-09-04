import React from 'react';
import { Mic, MicOff, Play, Volume2, Sparkles, Activity, AlertCircle } from 'lucide-react';
import { AudioFeatures, PreloadedScenario } from '../types';
import { PRELOADED_SCENARIOS } from '../data/contextDataset';

interface LiveAudioControlProps {
  isStreaming: boolean;
  onToggleMic: () => void;
  audioVolume: number;
  features: AudioFeatures;
  chunkCount: number;
  selectedScenario: PreloadedScenario | null;
  onSelectScenario: (scenario: PreloadedScenario) => void;
  audioError: string | null;
}

export const LiveAudioControl: React.FC<LiveAudioControlProps> = ({
  isStreaming,
  onToggleMic,
  audioVolume,
  features,
  chunkCount,
  selectedScenario,
  onSelectScenario,
  audioError,
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600">
            <Mic className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              Layer 1 & 2: Communication & Audio Ingestion
              <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded font-mono uppercase font-semibold">
                REAL CAPTURE
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              WebRTC microphone capture with continuous 2.5s chunk buffering & feature extraction
            </p>
          </div>
        </div>

        {/* Live Status Pill */}
        <div className="flex items-center space-x-2">
          {isStreaming ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 animate-pulse shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              LIVE CALL ACTIVE
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              CALL IDLE
            </span>
          )}
        </div>
      </div>

      {audioError && (
        <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{audioError}</span>
        </div>
      )}

      {/* Main Mic Button & Volume Waveform */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center mb-5 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
        <div className="md:col-span-5 flex flex-col sm:flex-row items-center gap-3">
          <button
            id="btn-toggle-mic"
            onClick={onToggleMic}
            className={`w-full sm:w-auto px-5 py-2.5 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer ${
              isStreaming
                ? 'bg-rose-600 hover:bg-rose-700 text-white ring-2 ring-rose-300'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            {isStreaming ? (
              <>
                <MicOff className="w-4 h-4" />
                End Live Audio Stream
              </>
            ) : (
              <>
                <Mic className="w-4 h-4" />
                Start Live Microphone Call
              </>
            )}
          </button>
        </div>

        {/* Live Audio Ingestion Telemetry */}
        <div className="md:col-span-7 flex flex-col justify-center space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span className="flex items-center gap-1.5 font-medium">
              <Volume2 className="w-3.5 h-3.5 text-indigo-600" />
              Live Ingestion Level:
            </span>
            <span className="font-mono text-indigo-600 font-bold">
              {(audioVolume * 100).toFixed(0)}% RMS
            </span>
          </div>

          {/* Volume bar meter */}
          <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden border border-slate-300/80 relative">
            <div
              className={`h-full transition-all duration-75 rounded-full ${
                audioVolume > 0.8
                  ? 'bg-rose-500'
                  : audioVolume > 0.5
                  ? 'bg-amber-500'
                  : 'bg-indigo-600'
              }`}
              style={{ width: `${Math.min(audioVolume * 100, 100)}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
            <span>Chunks Ingested: <strong className="text-slate-900">{chunkCount}</strong></span>
            <span>VAD: <strong className={features.silenceRatio < 0.6 ? "text-emerald-700 font-semibold" : "text-slate-500"}>{features.silenceRatio < 0.6 ? "SPEECH DETECTED" : "SILENCE"}</strong></span>
            <span>Rate: <strong className="text-slate-900">16 kHz PCM</strong></span>
          </div>
        </div>
      </div>

      {/* Real DSP Feature Telemetry Chips */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
          <div className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">RMS Energy</div>
          <div className="text-sm font-bold text-slate-900 font-mono mt-0.5">{features.rms.toFixed(3)}</div>
        </div>
        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
          <div className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">Pitch Variance</div>
          <div className="text-sm font-bold text-slate-900 font-mono mt-0.5">{features.pitchVariance.toFixed(3)}</div>
        </div>
        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
          <div className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">Spectral Centroid</div>
          <div className="text-sm font-bold text-slate-900 font-mono mt-0.5">{features.spectralCentroid} Hz</div>
        </div>
        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
          <div className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">Zero-Crossing Rate</div>
          <div className="text-sm font-bold text-slate-900 font-mono mt-0.5">{features.zeroCrossingRate.toFixed(3)}</div>
        </div>
      </div>

      {/* Preset Red-Team Attack Scenarios */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Load Pre-Configured Red-Team Attack Scenarios (SIH Evaluation Cases):
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {PRELOADED_SCENARIOS.map((scen) => {
            const isSelected = selectedScenario?.id === scen.id;
            return (
              <button
                key={scen.id}
                id={`btn-scenario-${scen.id}`}
                onClick={() => onSelectScenario(scen)}
                className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                  isSelected
                    ? 'bg-amber-50/70 border-amber-400 ring-1 ring-amber-400 text-slate-900 shadow-xs'
                    : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800 shadow-2xs'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-xs font-bold text-slate-900 line-clamp-1">{scen.title}</span>
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-semibold uppercase ${
                        scen.category === 'High Threat Attack'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : scen.category === 'Credential Phishing'
                          ? 'bg-orange-50 text-orange-700 border border-orange-200'
                          : scen.category === 'Impersonation Clone'
                          ? 'bg-purple-50 text-purple-700 border border-purple-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {scen.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                    {scen.description}
                  </p>
                </div>

                <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                  <span>DF: ~{scen.baseDeepfake}%</span>
                  <span className="text-indigo-600 flex items-center gap-1 font-semibold">
                    <Play className="w-2.5 h-2.5 fill-current" /> Select
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
