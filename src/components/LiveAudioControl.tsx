import React, { useState, useMemo } from 'react';
import { 
  Mic, 
  MicOff, 
  Play, 
  Square, 
  Volume2, 
  Sparkles, 
  Activity, 
  AlertCircle, 
  Headphones, 
  Radio, 
  Search, 
  ShieldAlert, 
  ShieldCheck, 
  CheckCircle2, 
  Globe 
} from 'lucide-react';
import { AudioFeatures, PreloadedScenario, ScenarioCategory } from '../types';
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

const CATEGORY_TABS: Array<{ id: string; label: string; count: (scenarios: PreloadedScenario[]) => number }> = [
  { id: 'ALL', label: 'All Test Cases', count: (s) => s.length },
  { id: 'Executive Wire Fraud', label: 'Executive Wire Fraud', count: (s) => s.filter((x) => x.category === 'Executive Wire Fraud').length },
  { id: 'Credential Phishing', label: 'Credential Phishing', count: (s) => s.filter((x) => x.category === 'Credential Phishing').length },
  { id: 'Acoustic Replay', label: 'Acoustic Replay', count: (s) => s.filter((x) => x.category === 'Acoustic Replay').length },
  { id: 'Context Escalation', label: 'Context Escalation', count: (s) => s.filter((x) => x.category === 'Context Escalation').length },
  { id: 'Distress Extortion', label: 'Distress Extortion', count: (s) => s.filter((x) => x.category === 'Distress Extortion').length },
  { id: 'Vendor Redirection', label: 'Vendor Redirection', count: (s) => s.filter((x) => x.category === 'Vendor Redirection').length },
  { id: 'Multilingual Voice', label: 'Multilingual Voice', count: (s) => s.filter((x) => x.category === 'Multilingual Voice').length },
  { id: 'Benign Business', label: 'Benign Baselines (Pass)', count: (s) => s.filter((x) => x.category === 'Benign Business').length },
];

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
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredScenarios = useMemo(() => {
    return PRELOADED_SCENARIOS.filter((s) => {
      // Category match
      if (filterCategory !== 'ALL' && s.category !== filterCategory) {
        return false;
      }
      // Search query match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = s.title.toLowerCase().includes(q);
        const matchesDesc = s.description.toLowerCase().includes(q);
        const matchesAction = s.action.toLowerCase().includes(q);
        const matchesTranscript = s.sampleTranscript.toLowerCase().includes(q);
        const matchesLang = s.language?.toLowerCase().includes(q);
        const matchesCat = s.category.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc && !matchesAction && !matchesTranscript && !matchesLang && !matchesCat) {
          return false;
        }
      }
      return true;
    });
  }, [filterCategory, searchQuery]);

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

      {/* Currently Active Call Acoustic & Test Banner */}
      {selectedScenario && (
        <div className="mb-4 p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-2xs">
          <div className="space-y-1">
            <div className="font-semibold text-slate-900 flex flex-wrap items-center gap-2">
              <Headphones className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span>Active Test Case: <strong className="text-indigo-950">{selectedScenario.title}</strong></span>
              
              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-indigo-100/80 text-indigo-800 border border-indigo-200">
                {selectedScenario.category}
              </span>

              {selectedScenario.expectedDecision && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-md font-mono font-bold flex items-center gap-1 ${
                    selectedScenario.expectedDecision === 'BLOCK'
                      ? 'bg-rose-100 text-rose-800 border border-rose-200'
                      : selectedScenario.expectedDecision === 'VERIFY'
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}
                >
                  {selectedScenario.expectedDecision === 'BLOCK' ? (
                    <ShieldAlert className="w-3 h-3 text-rose-600" />
                  ) : selectedScenario.expectedDecision === 'VERIFY' ? (
                    <AlertCircle className="w-3 h-3 text-amber-600" />
                  ) : (
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  )}
                  Ground-Truth Target: {selectedScenario.expectedDecision}
                </span>
              )}

              {selectedScenario.language && selectedScenario.language !== 'English' && (
                <span className="text-[10px] px-2 py-0.5 rounded font-medium bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                  <Globe className="w-2.5 h-2.5" />
                  {selectedScenario.language}
                </span>
              )}
            </div>

            <p className="text-[11px] text-slate-600 font-mono">
              <span className="font-semibold text-slate-700">Audio Profile:</span> {selectedScenario.simulatedAudioVariant}
            </p>
            {selectedScenario.acousticArtifacts && (
              <p className="text-[10px] text-indigo-950">
                <span className="font-semibold text-indigo-700">Acoustic Markers:</span> {selectedScenario.acousticArtifacts}
              </p>
            )}
          </div>

          {onToggleScenarioAudio && (
            <button
              onClick={() => onToggleScenarioAudio(selectedScenario)}
              className={`px-3.5 py-2 rounded-lg font-semibold text-xs flex items-center gap-2 transition shrink-0 cursor-pointer shadow-xs ${
                isPlayingScenarioAudio
                  ? 'bg-amber-600 hover:bg-amber-700 text-white animate-pulse'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
            >
              {isPlayingScenarioAudio ? (
                <>
                  <Square className="w-3.5 h-3.5 fill-current" /> Stop Audio
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" /> Play Call Voice
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

      {/* Preset Red-Team Attack Scenarios & Test Suite */}
      <div>
        <div className="flex flex-col gap-3 mb-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Evaluation Audio & Threat Category Test Cases
              </span>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Select any threat or benign scenario to evaluate the real-time trust pipeline model against ground-truth decisions.
              </p>
            </div>

            {/* Quick Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search test cases, languages..."
                className="w-full pl-8 pr-2.5 py-1 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-slate-800 placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-[11px]"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            {CATEGORY_TABS.map((cat) => {
              const count = cat.count(PRELOADED_SCENARIOS);
              const isActive = filterCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setFilterCategory(cat.id)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-slate-900 text-white font-semibold shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200/80 text-slate-600'
                  }`}
                >
                  <span>{cat.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold ${
                      isActive ? 'bg-slate-700 text-slate-200' : 'bg-slate-200/80 text-slate-600'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Scenarios Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredScenarios.length === 0 ? (
            <div className="col-span-full py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-500 text-xs">
              No test cases match "{searchQuery}". Try clearing your search query.
            </div>
          ) : (
            filteredScenarios.map((scen) => {
              const isSelected = selectedScenario?.id === scen.id;
              const isCurrentlyPlaying = isSelected && isPlayingScenarioAudio;

              const isBlock = scen.expectedDecision === 'BLOCK';
              const isVerify = scen.expectedDecision === 'VERIFY';
              const isAllow = scen.expectedDecision === 'ALLOW';

              return (
                <div
                  key={scen.id}
                  id={`btn-scenario-${scen.id}`}
                  onClick={() => onSelectScenario(scen)}
                  className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer group ${
                    isSelected
                      ? 'bg-amber-50/80 border-amber-400 ring-2 ring-amber-300/80 text-slate-900 shadow-xs'
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800 shadow-2xs'
                  }`}
                >
                  <div>
                    {/* Top Row: Category + Expected Decision Badge */}
                    <div className="flex items-center justify-between gap-1.5 mb-2">
                      <span
                        className={`text-[9px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider shrink-0 ${
                          scen.category === 'Executive Wire Fraud'
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : scen.category === 'Credential Phishing'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : scen.category === 'Acoustic Replay'
                            ? 'bg-purple-100 text-purple-800 border border-purple-200'
                            : scen.category === 'Context Escalation'
                            ? 'bg-orange-100 text-orange-800 border border-orange-200'
                            : scen.category === 'Distress Extortion'
                            ? 'bg-red-100 text-red-800 border border-red-200'
                            : scen.category === 'Vendor Redirection'
                            ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                            : scen.category === 'Multilingual Voice'
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {scen.category}
                      </span>

                      {scen.expectedDecision && (
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded-md font-mono font-bold flex items-center gap-1 ${
                            isBlock
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : isVerify
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {isBlock ? (
                            <ShieldAlert className="w-2.5 h-2.5 text-rose-600" />
                          ) : isVerify ? (
                            <AlertCircle className="w-2.5 h-2.5 text-amber-600" />
                          ) : (
                            <ShieldCheck className="w-2.5 h-2.5 text-emerald-600" />
                          )}
                          EXPECT: {scen.expectedDecision}
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <div className="flex items-start justify-between gap-1 mb-1">
                      <span className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition leading-snug">
                        {scen.title}
                      </span>
                      {scen.language && scen.language !== 'English' && (
                        <span className="shrink-0 text-[10px] bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.2 rounded font-medium flex items-center gap-1">
                          <Globe className="w-2.5 h-2.5" />
                          {scen.language}
                        </span>
                      )}
                    </div>

                    {/* Description */}
                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                      {scen.description}
                    </p>

                    {/* Action Preview */}
                    <div className="mt-2 text-[10px] text-slate-600 bg-slate-50 p-1.5 rounded border border-slate-100 truncate">
                      <span className="font-semibold text-slate-700">Action:</span> {scen.action}
                    </div>
                  </div>

                  {/* Footer Stats & Audio Button */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                    <div className="flex items-center space-x-2">
                      <span>
                        Deepfake:{' '}
                        <strong className={scen.baseDeepfake > 60 ? 'text-rose-600' : 'text-emerald-700'}>
                          {scen.baseDeepfake}%
                        </strong>
                      </span>
                      <span>
                        Sim:{' '}
                        <strong className={scen.baseSpeakerSim < 60 ? 'text-rose-600' : 'text-emerald-700'}>
                          {scen.baseSpeakerSim}%
                        </strong>
                      </span>
                    </div>

                    {onToggleScenarioAudio ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectScenario(scen);
                          onToggleScenarioAudio(scen);
                        }}
                        className={`px-2.5 py-1 rounded-md flex items-center gap-1.5 font-semibold text-[11px] transition cursor-pointer ${
                          isCurrentlyPlaying
                            ? 'bg-amber-600 text-white shadow-xs'
                            : isSelected
                            ? 'bg-indigo-600 text-white shadow-xs hover:bg-indigo-700'
                            : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                        }`}
                      >
                        {isCurrentlyPlaying ? (
                          <>
                            <Square className="w-2.5 h-2.5 fill-current" /> Stop Audio
                          </>
                        ) : (
                          <>
                            <Headphones className="w-2.5 h-2.5" /> Listen
                          </>
                        )}
                      </button>
                    ) : (
                      <span className="text-indigo-600 flex items-center gap-1 font-semibold text-[11px]">
                        <Play className="w-2.5 h-2.5 fill-current" /> Select
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
