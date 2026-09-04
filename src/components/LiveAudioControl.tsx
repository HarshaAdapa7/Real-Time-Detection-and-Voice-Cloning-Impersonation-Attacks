import React, { useState } from 'react';
import { Mic, MicOff, Play, Square, Volume2, Sparkles, Activity, AlertCircle, Headphones, Radio } from 'lucide-react';
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
  isPlayingScenarioAudio?: boolean;
  onToggleScenarioAudio?: (scenario: PreloadedScenario) => void;
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
  isPlayingScenarioAudio = false,
  onToggleScenarioAudio,
}) => {
  const [filterCategory, setFilterCategory] = useState<string>('ALL');

  const filteredScenarios = PRELOADED_SCENARIOS.filter((s) => {
    if (filterCategory === 'ALL') return true;
    if (filterCategory === 'ATTACKS') return s.category !== 'Benign Business';
    if (filterCategory === 'BENIGN') return s.category === 'Benign Business';
    return true;
  });

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600">
            <Mic className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              Layer 1 & 2: Communication & Audio Ingestion
              <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded font-mono uppercase font-semibold">
                AUDIO PLAYBACK & MIC
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              Live microphone capture or audible synthetic/organic call playback with dynamic DSP analysis
            </p>
          </div>
        </div>

        {/* Live Status Pill */}
        <div className="flex items-center space-x-2 shrink-0">
          {isPlayingScenarioAudio ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-300 animate-pulse shadow-2xs">
              <Radio className="w-3.5 h-3.5 text-amber-600 animate-spin" />
              PLAYING CALL AUDIO
            </span>
          ) : isStreaming ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 animate-pulse shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              LIVE MIC ACTIVE
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              AUDIO IDLE
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

      {/* Main Controls & Volume Waveform */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center mb-5 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
        <div className="md:col-span-6 flex flex-wrap items-center gap-2.5">
          {/* Mic Toggle Button */}
          <button
            id="btn-toggle-mic"
            onClick={onToggleMic}
            className={`px-4 py-2.5 rounded-lg font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer ${
              isStreaming
                ? 'bg-rose-600 hover:bg-rose-700 text-white ring-2 ring-rose-300'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            {isStreaming ? (
              <>
                <MicOff className="w-4 h-4" />
                End Live Mic
              </>
            ) : (
              <>
                <Mic className="w-4 h-4" />
                Use My Microphone
              </>
            )}
          </button>

          {/* Hear Selected Scenario Audio Button */}
          {selectedScenario && onToggleScenarioAudio && (
            <button
              id="btn-listen-scenario"
              onClick={() => onToggleScenarioAudio(selectedScenario)}
              className={`px-4 py-2.5 rounded-lg font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer border ${
                isPlayingScenarioAudio
                  ? 'bg-amber-600 hover:bg-amber-700 text-white border-amber-700 ring-2 ring-amber-300'
                  : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300'
              }`}
            >
              {isPlayingScenarioAudio ? (
                <>
                  <Square className="w-3.5 h-3.5 fill-current" />
                  Stop Call Audio
                </>
              ) : (
                <>
                  <Headphones className="w-4 h-4 text-indigo-600" />
                  <span>Listen to Call Audio</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Live Audio Ingestion Telemetry */}
        <div className="md:col-span-6 flex flex-col justify-center space-y-2">
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
            <span>VAD: <strong className={features.silenceRatio < 0.6 ? "text-emerald-700 font-semibold" : "text-slate-500"}>{features.silenceRatio < 0.6 ? "SPEECH ACTIVE" : "SILENCE"}</strong></span>
            <span>Channel: <strong className="text-slate-900">16 kHz PCM</strong></span>
          </div>
        </div>
      </div>

      {/* Currently Active Call Acoustic Banner */}
      {selectedScenario && (
        <div className="mb-4 p-3 rounded-xl bg-indigo-50/60 border border-indigo-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs">
          <div>
            <div className="font-semibold text-slate-900 flex items-center gap-1.5">
              <Headphones className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span>Loaded Audio Sample: <strong>{selectedScenario.title}</strong></span>
            </div>
            <p className="text-[11px] text-slate-600 mt-0.5 font-mono">
              Variant: {selectedScenario.simulatedAudioVariant}
            </p>
            {selectedScenario.acousticArtifacts && (
              <p className="text-[10px] text-indigo-900/80 mt-0.5">
                <span className="font-semibold text-indigo-700">Acoustic Markers:</span> {selectedScenario.acousticArtifacts}
              </p>
            )}
          </div>

          {onToggleScenarioAudio && (
            <button
              onClick={() => onToggleScenarioAudio(selectedScenario)}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-1.5 transition shrink-0 cursor-pointer shadow-2xs"
            >
              {isPlayingScenarioAudio ? (
                <>
                  <Square className="w-3 h-3 fill-current" /> Pause
                </>
              ) : (
                <>
                  <Play className="w-3 h-3 fill-current" /> Play Call Voice
                </>
              )}
            </button>
          )}
        </div>
      )}

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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
          <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Evaluation Audio Scenarios (Click any card to select & listen):
          </span>

          {/* Scenario Filters */}
          <div className="flex items-center space-x-1.5 text-xs">
            <button
              onClick={() => setFilterCategory('ALL')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition cursor-pointer ${
                filterCategory === 'ALL'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All ({PRELOADED_SCENARIOS.length})
            </button>
            <button
              onClick={() => setFilterCategory('ATTACKS')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition cursor-pointer ${
                filterCategory === 'ATTACKS'
                  ? 'bg-rose-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Attacks & Clones
            </button>
            <button
              onClick={() => setFilterCategory('BENIGN')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition cursor-pointer ${
                filterCategory === 'BENIGN'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Benign Baselines
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {filteredScenarios.map((scen) => {
            const isSelected = selectedScenario?.id === scen.id;
            const isCurrentlyPlaying = isSelected && isPlayingScenarioAudio;
            return (
              <div
                key={scen.id}
                id={`btn-scenario-${scen.id}`}
                onClick={() => onSelectScenario(scen)}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer group ${
                  isSelected
                    ? 'bg-amber-50/70 border-amber-400 ring-1 ring-amber-400 text-slate-900 shadow-xs'
                    : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800 shadow-2xs'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <span className="text-xs font-bold text-slate-900 line-clamp-1">{scen.title}</span>
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-semibold uppercase shrink-0 ${
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

                <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                  <span>Deepfake: <strong className={scen.baseDeepfake > 60 ? "text-rose-600" : "text-emerald-700"}>{scen.baseDeepfake}%</strong></span>
                  
                  {onToggleScenarioAudio ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectScenario(scen);
                        onToggleScenarioAudio(scen);
                      }}
                      className={`px-2 py-0.5 rounded flex items-center gap-1 font-semibold transition cursor-pointer ${
                        isCurrentlyPlaying
                          ? 'bg-amber-600 text-white'
                          : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                      }`}
                    >
                      {isCurrentlyPlaying ? (
                        <>
                          <Square className="w-2.5 h-2.5 fill-current" /> Stop Audio
                        </>
                      ) : (
                        <>
                          <Headphones className="w-2.5 h-2.5" /> Hear Voice
                        </>
                      )}
                    </button>
                  ) : (
                    <span className="text-indigo-600 flex items-center gap-1 font-semibold">
                      <Play className="w-2.5 h-2.5 fill-current" /> Select
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
