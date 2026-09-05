/**
 * Real-Time Voice Trust Firewall
 * Lead Full-Stack Engineer Prototype for Smart India Hackathon (SIH)
 *
 * Nine-Layer Architecture:
 * 1. Communication (Browser Mic / WebRTC)
 * 2. Audio Ingestion (Buffering, 2.5s Chunking, VAD)
 * 3. Audio Intelligence (Deepfake, Speaker Verification, Replay/Channel)
 * 4. Conversation Intelligence (ASR Transcription + Gemini 3.8 Flash NLP)
 * 5. Context Engine (Caller History, Employee Role, Policy Rules)
 * 6. Risk Fusion Engine (0–100 Weighted Mathematical Integration)
 * 7. Policy Engine (Multi-Tenant Configurable Thresholds)
 * 8. Response / Prevention (Simulated Step-Up OTP, Callback, SOC Containment)
 * 9. Integration & Outbound API Layer (Mock CBS & Telecom REST Consumer)
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Header, AppTab } from './components/Header';
import { PipelineVisualizer } from './components/PipelineVisualizer';
import { LiveAudioControl } from './components/LiveAudioControl';
import { ConversationIntelPanel } from './components/ConversationIntelPanel';
import { ContextEnginePanel } from './components/ContextEnginePanel';
import { RiskDecisionGauge } from './components/RiskDecisionGauge';
import { SignalBreakdownCard } from './components/SignalBreakdownCard';
import { IntegrationApiPanel } from './components/IntegrationApiPanel';
import { AuditLogView } from './components/AuditLogView';
import { PolicyConfigModal } from './components/PolicyConfigModal';
import { ResearchDisclosureModal } from './components/ResearchDisclosureModal';
import { LiveVoiceIntelligence } from './components/LiveVoiceIntelligence';
import { EvaluationAudioLibrary } from './components/EvaluationAudioLibrary';

import { 
  TenantConfig, 
  TenantId, 
  AudioFeatures, 
  PreloadedScenario, 
  ContextProfile,
  NlpSignalResult,
  AuditRecord,
  DbStatus
} from './types';
import { Database, HardDrive, CheckCircle2, Server } from 'lucide-react';

import { DEFAULT_TENANTS, evaluatePolicy } from './services/policyEngine';
import { computeDeepfakeSignal } from './services/deepfakeSignal';
import { computeSpeakerSignal } from './services/speakerSignal';
import { computeReplaySignal } from './services/replaySignal';
import { evaluateConversationRisk, evaluateTextHeuristics } from './services/nlpSignal';
import { evaluateContextRisk } from './services/contextSignal';
import { fuseRiskSignals } from './services/riskFusion';
import { classifySpokenSector, DetectedSector } from './services/sectorClassifier';
import { ENROLLED_PROFILES, PRELOADED_SCENARIOS } from './data/contextDataset';
import { AudioStreamManager, ScenarioAudioPlayer } from './utils/audioProcessor';

export default function App() {
  // Navigation & View State
  const [activeTab, setActiveTab] = useState<AppTab>('firewall');
  const [selectedLayer, setSelectedLayer] = useState<number | null>(null);
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
  const [isDisclosureModalOpen, setIsDisclosureModalOpen] = useState(false);

  // Tenant Configuration State (Layer 7)
  const [currentTenant, setCurrentTenant] = useState<TenantConfig>(DEFAULT_TENANTS['tenant-bank']);

  // Audio Stream & Ingestion State (Layers 1 & 2)
  const [isStreaming, setIsStreaming] = useState(false);
  const [isPlayingScenarioAudio, setIsPlayingScenarioAudio] = useState(false);
  const [audioVolume, setAudioVolume] = useState(0);
  const [chunkCount, setChunkCount] = useState(0);
  const [audioFeatures, setAudioFeatures] = useState<AudioFeatures>({
    rms: 0.08,
    pitchVariance: 0.18,
    spectralCentroid: 2150,
    zeroCrossingRate: 0.22,
    silenceRatio: 0.2,
  });
  const [audioError, setAudioError] = useState<string | null>(null);

  // Scenarios State
  const [selectedScenario, setSelectedScenario] = useState<PreloadedScenario | null>(PRELOADED_SCENARIOS[0]);

  // Conversation Intelligence State (Layer 4)
  const [transcript, setTranscript] = useState<string>(PRELOADED_SCENARIOS[0].sampleTranscript);
  const [isAnalyzingNlp, setIsAnalyzingNlp] = useState(false);
  const [nlpResult, setNlpResult] = useState<NlpSignalResult>({
    transcript: PRELOADED_SCENARIOS[0].sampleTranscript,
    socialEngineeringRisk: 88,
    urgencyScore: 92,
    secrecyScore: 85,
    financialRequestDetected: true,
    otpCredentialRequestDetected: false,
    detectedCues: [
      "Explicit urgency ('right now', 'emergency')",
      "Secrecy / isolation demand ('keep this strictly confidential')",
      "Urgent fund dispatch request ('25 lakh rupees via RTGS')"
    ],
    coercionTone: "High Urgency & Manipulative",
    reasoning: "Demands immediate ₹25,00,000 transfer while commanding silence and bypassing standard verification.",
    isRealGemini: true,
  });

  // Dynamic Spoken Sector & Real-Time Indications (Automatic Detection from Voice)
  const [micLanguage, setMicLanguage] = useState<string>('en-IN');
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [detectedSector, setDetectedSector] = useState<DetectedSector>(() => classifySpokenSector(PRELOADED_SCENARIOS[0].sampleTranscript));
  const [liveAlerts, setLiveAlerts] = useState<Array<{ id: string; timestamp: string; type: 'info' | 'warning' | 'danger' | 'success'; text: string }>>([
    { id: '1', timestamp: 'Ready', type: 'info', text: 'Voice Trust Engine online. Dynamic sector & threat analysis active.' },
    { id: '2', timestamp: 'Calibrated', type: 'success', text: 'Banking & Financial Services policy profile calibrated.' },
  ]);

  const addLiveAlert = useCallback((type: 'info' | 'warning' | 'danger' | 'success', text: string) => {
    const time = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLiveAlerts((prev) => {
      if (prev.some((a) => a.text === text)) return prev;
      return [{ id: `${Date.now()}-${Math.random()}`, timestamp: time, type, text }, ...prev.slice(0, 6)];
    });
  }, []);

  // Context Engine State (Layer 5)
  const [selectedProfile, setSelectedProfile] = useState<ContextProfile>(ENROLLED_PROFILES[0]);
  const [callerPhone, setCallerPhone] = useState<string>(ENROLLED_PROFILES[0].phone);
  const [requestedAction, setRequestedAction] = useState<string>(PRELOADED_SCENARIOS[0].action);
  const [requestedAmount, setRequestedAmount] = useState<number>(PRELOADED_SCENARIOS[0].amount);
  const [isAfterHours, setIsAfterHours] = useState(false);
  const [isSpoofedCallerId, setIsSpoofedCallerId] = useState(false);

  // Step-Up Resolution State (Layer 8)
  const [stepUpResolved, setStepUpResolved] = useState(false);

  // Historical Audit State & Database Sync (Layer 8 & Audit Log)
  const [auditRecords, setAuditRecords] = useState<AuditRecord[]>([]);
  const [dbStatus, setDbStatus] = useState<DbStatus | null>(null);
  const [isInitializingSchema, setIsInitializingSchema] = useState(false);
  const [isSavingDb, setIsSavingDb] = useState(false);
  const [dbNotification, setDbNotification] = useState<string | null>(null);

  // Database Synchronization functions
  const fetchDbStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/db/status');
      if (res.ok) {
        const data = await res.json();
        setDbStatus(data);
      }
    } catch (err) {
      console.error('Failed to fetch DB status', err);
    }
  }, []);

  const fetchAuditLogs = useCallback(async () => {
    try {
      const res = await fetch('/api/audit-logs');
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.records)) {
          setAuditRecords(data.records);
        }
      }
    } catch (err) {
      console.error('Failed to fetch audit logs', err);
    }
  }, []);

  const handleInitSchema = async () => {
    setIsInitializingSchema(true);
    try {
      const res = await fetch('/api/db/init-schema', { method: 'POST' });
      const result = await res.json();
      await fetchDbStatus();
      await fetchAuditLogs();
      setDbNotification(result.message || 'PostgreSQL schemas created & verified successfully.');
      setTimeout(() => setDbNotification(null), 5000);
    } catch (err: any) {
      console.error('Failed to initialize schema', err);
      setDbNotification('Error creating schemas: ' + (err.message || 'Unknown error'));
      setTimeout(() => setDbNotification(null), 5000);
    } finally {
      setIsInitializingSchema(false);
    }
  };

  // Audio Stream Manager ref
  const audioManagerRef = useRef<AudioStreamManager | null>(null);
  const scenarioPlayerRef = useRef<ScenarioAudioPlayer | null>(null);

  // Toggle scenario audio playback so users can hear the conversation
  const handleToggleScenarioAudio = (scen: PreloadedScenario) => {
    // If clicking Stop on the currently playing scenario, stop it
    if (isPlayingScenarioAudio && selectedScenario?.id === scen.id) {
      if (scenarioPlayerRef.current) {
        scenarioPlayerRef.current.stop();
      }
      setIsPlayingScenarioAudio(false);
      setAudioVolume(0);
      return;
    }

    // Stop previous audio playback if any
    if (scenarioPlayerRef.current) {
      scenarioPlayerRef.current.stop();
    }

    // Stop live mic if active
    if (isStreaming && audioManagerRef.current) {
      audioManagerRef.current.stop();
      audioManagerRef.current = null;
      setIsStreaming(false);
    }

    // Select scenario and load transcript & details
    handleSelectScenario(scen);

    if (!scenarioPlayerRef.current) {
      scenarioPlayerRef.current = new ScenarioAudioPlayer(
        (vol) => setAudioVolume(vol),
        (playing) => setIsPlayingScenarioAudio(playing),
        (feats) => setAudioFeatures(feats)
      );
    }

    const cfg = scen.ttsVoiceConfig || {};
    scenarioPlayerRef.current.play(
      scen.sampleTranscript,
      cfg.voiceFilter || 'natural',
      cfg.pitch || 1.0,
      cfg.rate || 1.0,
      scen.languageCode || 'en'
    );
  };

  // Layer 3 Signals (Deepfake, Speaker, Replay)
  // When live microphone is active (isStreaming), use isLiveMic = true to calculate dynamic acoustic score from user's voice
  const deepfakeResult = computeDeepfakeSignal(
    audioFeatures,
    isStreaming ? undefined : selectedScenario?.baseDeepfake,
    chunkCount,
    isStreaming
  );

  const speakerResult = computeSpeakerSignal(
    selectedProfile.id,
    selectedProfile.name,
    audioFeatures,
    isStreaming ? undefined : selectedScenario?.baseSpeakerSim,
    chunkCount
  );

  const replayResult = computeReplaySignal(
    audioFeatures,
    isStreaming ? undefined : selectedScenario?.baseReplay,
    chunkCount
  );

  // Layer 5 Context Engine
  const contextResult = evaluateContextRisk(
    selectedProfile,
    callerPhone,
    requestedAction,
    requestedAmount,
    isAfterHours ? 23 : 14
  );

  // Layer 6 Risk Fusion Engine
  const fusionResult = fuseRiskSignals({
    deepfakeScore: deepfakeResult.score,
    speakerSimilarity: speakerResult.similarity,
    replayScore: replayResult.replayScore,
    nlpScore: nlpResult.socialEngineeringRisk,
    contextScore: contextResult.contextRiskScore,
    weights: currentTenant.weights,
  });

  // Layer 7 Policy Engine Decision
  const policyDecision = evaluatePolicy(fusionResult.finalRiskScore, currentTenant);

  // Trigger Gemini Analysis for Conversation Intelligence (Layer 4)
  const handleRunGeminiAnalysis = useCallback(async () => {
    if (!transcript.trim()) return;
    setIsAnalyzingNlp(true);
    try {
      const res = await evaluateConversationRisk(transcript, {
        claimedIdentity: `${selectedProfile.name} (${selectedProfile.role})`,
        requestedAction,
        amount: requestedAmount,
      });
      setNlpResult(res);
    } catch (err) {
      console.error("NLP evaluation failed:", err);
    } finally {
      setIsAnalyzingNlp(false);
    }
  }, [transcript, selectedProfile, requestedAction, requestedAmount]);

  // Microphone language change handler
  const handleMicLanguageChange = (lang: string) => {
    setMicLanguage(lang);
    if (audioManagerRef.current) {
      audioManagerRef.current.setLanguage(lang);
    }
    addLiveAlert('info', `🌐 Microphone recognition language updated to ${lang}`);
  };

  // Microphone toggle handler
  const handleToggleMic = async () => {
    if (isStreaming) {
      // Stop stream
      if (audioManagerRef.current) {
        audioManagerRef.current.stop();
        audioManagerRef.current = null;
      }
      setIsStreaming(false);
      setAudioVolume(0);

      // Log to audit on call completion
      const newAudit: AuditRecord = {
        id: `call-${Date.now().toString(36)}`,
        timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST',
        durationSeconds: Math.max(chunkCount * 2.5, 5),
        caller: callerPhone,
        claimedTarget: `${selectedProfile.name} (${selectedProfile.role})`,
        requestedAction,
        transcript: transcript || "(No transcript captured)",
        finalRiskScore: fusionResult.finalRiskScore,
        decision: policyDecision.action,
        stepUpAction: policyDecision.stepUpAction,
        tenantName: currentTenant.name.split('(')[0].trim(),
        breakdown: {
          deepfake: deepfakeResult.score,
          speakerMismatch: speakerResult.mismatchRisk,
          replay: replayResult.replayScore,
          nlp: nlpResult.socialEngineeringRisk,
          context: contextResult.contextRiskScore,
        },
        wasRealGemini: nlpResult.isRealGemini,
      };

      setAuditRecords((prev) => [newAudit, ...prev]);

      // Persist to PostgreSQL backend
      fetch('/api/audit-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAudit),
      })
        .then(() => {
          fetchDbStatus();
          fetchAuditLogs();
        })
        .catch((err) => console.error('Auto-persist mic session error:', err));
    } else {
      // Start stream
      setAudioError(null);
      setChunkCount(0);
      setStepUpResolved(false);

      const manager = new AudioStreamManager({
        onChunk: (features, count) => {
          setAudioFeatures(features);
          setChunkCount(count);
        },
        onLiveFeatures: (features) => {
          setAudioFeatures(features);
        },
        onTranscript: (liveText, isFinal) => {
          if (!liveText) return;

          setInterimTranscript(liveText);

          let cumulative = transcript;
          if (isFinal) {
            cumulative = `${transcript} ${liveText}`.trim();
            setTranscript(cumulative);
            setInterimTranscript('');
          } else {
            cumulative = `${transcript} ${liveText}`.trim();
          }

          const textToAnalyze = cumulative || liveText;

          // 1. Dynamic Spoken Sector Classification from user input
          const sector = classifySpokenSector(textToAnalyze);
          setDetectedSector(sector);
          if (sector.id !== 'GENERAL_ROUTINE') {
            setCurrentTenant((prev) => ({
              ...prev,
              weights: sector.defaultWeights,
            }));
            addLiveAlert('info', `⚡ Auto-tuned sector to ${sector.name} (${sector.confidence}% confidence)`);
          }

          // 2. Real-time fast conversational heuristics (0ms instantaneous updates)
          const fastNlp = evaluateTextHeuristics(textToAnalyze);
          setNlpResult(fastNlp);

          if (fastNlp.urgencyScore > 50) {
            addLiveAlert('warning', '⚠️ Urgency Coercion: Immediate pressure detected in speech');
          }
          if (fastNlp.financialRequestDetected) {
            addLiveAlert('danger', '🚨 Financial Exfiltration: Transfer instruction detected');
          }
          if (fastNlp.otpCredentialRequestDetected) {
            addLiveAlert('danger', '🛡️ Credential Intercept: OTP or sensitive authentication code request');
          }
          if (fastNlp.secrecyScore > 60) {
            addLiveAlert('warning', '🔒 Secrecy Demand: Request to isolate victim or maintain silence');
          }
        },
        onVolumeChange: (vol) => {
          setAudioVolume(vol);
        },
        onError: (errText) => {
          setAudioError(errText);
          setIsStreaming(false);
        },
      });

      manager.setLanguage(micLanguage);
      const started = await manager.startMicrophone();
      if (started) {
        audioManagerRef.current = manager;
        setIsStreaming(true);
      }
    }
  };

  // Scenario selection
  const handleSelectScenario = (scen: PreloadedScenario) => {
    setSelectedScenario(scen);
    setTranscript(scen.sampleTranscript);
    setRequestedAction(scen.action);
    setRequestedAmount(scen.amount);
    setStepUpResolved(false);

    // Auto-detect sector for the selected scenario
    const sector = classifySpokenSector(scen.sampleTranscript);
    setDetectedSector(sector);
    if (sector.id !== 'GENERAL_ROUTINE') {
      setCurrentTenant((prev) => ({
        ...prev,
        weights: sector.defaultWeights,
      }));
      addLiveAlert('info', `⚡ Calibrated sector to ${sector.name} (${sector.confidence}% match)`);
    }

    // Immediate fast heuristics
    const fastNlp = evaluateTextHeuristics(scen.sampleTranscript);
    setNlpResult(fastNlp);

    // Find profile
    const prof = ENROLLED_PROFILES.find((p) => p.id === scen.claimedSpeaker) || ENROLLED_PROFILES[0];
    setSelectedProfile(prof);
    setCallerPhone(prof.phone);
    setIsSpoofedCallerId(false);
    setIsAfterHours(scen.id === 'scen-after-hours-anomaly');

    // Trigger instant evaluation of transcript
    setIsAnalyzingNlp(true);
    evaluateConversationRisk(scen.sampleTranscript, {
      claimedIdentity: `${prof.name} (${prof.role})`,
      requestedAction: scen.action,
      amount: scen.amount,
    }).then((res) => {
      setNlpResult(res);
      setIsAnalyzingNlp(false);
    });
  };

  // Caller ID spoof toggle
  const handleToggleSpoofedCallerId = () => {
    if (isSpoofedCallerId) {
      setCallerPhone(selectedProfile.phone);
      setIsSpoofedCallerId(false);
    } else {
      setCallerPhone('+91-91080-99881'); // Random spoofed mobile number
      setIsSpoofedCallerId(true);
    }
  };

  // Switch tenant
  const handleSwitchTenant = (tenantId: TenantId) => {
    setCurrentTenant(DEFAULT_TENANTS[tenantId]);
  };

  // Resolve step-up simulation
  const handleResolveStepUp = () => {
    setStepUpResolved(true);
  };

  // Clear audit log (synced with database)
  const handleClearAudit = async () => {
    setAuditRecords([]);
    try {
      await fetch('/api/audit-logs', { method: 'DELETE' });
      await fetchDbStatus();
      setDbNotification('Audit log successfully cleared from database.');
      setTimeout(() => setDbNotification(null), 4000);
    } catch (err) {
      console.error('Failed to clear audit from DB:', err);
    }
  };

  // Explicitly persist current scenario/evaluation to PostgreSQL
  const handlePersistCurrentEvaluation = async () => {
    setIsSavingDb(true);
    const rec: AuditRecord = {
      id: `eval-${Date.now().toString(36)}`,
      timestamp: new Date().toLocaleTimeString(),
      durationSeconds: Math.max(chunkCount * 2.5, 8),
      caller: callerPhone,
      claimedTarget: `${selectedProfile.name} (${selectedProfile.role})`,
      requestedAction,
      transcript: transcript || '(No transcript captured)',
      finalRiskScore: fusionResult.finalRiskScore,
      decision: policyDecision.action,
      stepUpAction: policyDecision.stepUpAction,
      tenantName: currentTenant.name.split('(')[0].trim(),
      breakdown: {
        deepfake: deepfakeResult.score,
        speakerMismatch: speakerResult.mismatchRisk,
        replay: replayResult.replayScore,
        nlp: nlpResult.socialEngineeringRisk,
        context: contextResult.contextRiskScore,
      },
      wasRealGemini: nlpResult.isRealGemini,
    };

    try {
      const res = await fetch('/api/audit-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rec),
      });
      const data = await res.json();
      await fetchAuditLogs();
      await fetchDbStatus();
      setDbNotification(`Evaluation successfully persisted to ${data.persistedInDb ? 'PostgreSQL' : 'Store'} (ID: ${data.id})`);
      setTimeout(() => setDbNotification(null), 5000);
    } catch (err: any) {
      console.error('Failed to persist evaluation:', err);
      setAuditRecords((prev) => [rec, ...prev]);
      setDbNotification('Evaluation logged locally.');
      setTimeout(() => setDbNotification(null), 4000);
    } finally {
      setIsSavingDb(false);
    }
  };

  // Initial load: fetch DB status and logs
  useEffect(() => {
    fetchDbStatus();
    fetchAuditLogs();
  }, [fetchDbStatus, fetchAuditLogs]);

  // Cleanup mic and scenario audio on unmount
  useEffect(() => {
    return () => {
      if (audioManagerRef.current) {
        audioManagerRef.current.stop();
      }
      if (scenarioPlayerRef.current) {
        scenarioPlayerRef.current.stop();
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation & App Header */}
      <Header
        currentTenant={currentTenant}
        onSelectTenant={handleSwitchTenant}
        onOpenPolicyConfig={() => setIsPolicyModalOpen(true)}
        onOpenAuditLog={() => setActiveTab('audit')}
        onOpenDisclosures={() => setIsDisclosureModalOpen(true)}
        onOpenApiInspector={() => setActiveTab('api')}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Database Notification Toast */}
        {dbNotification && (
          <div className="mb-4 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl px-4 py-2.5 text-xs font-medium flex items-center justify-between shadow-xs">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{dbNotification}</span>
            </div>
            <button
              onClick={() => setDbNotification(null)}
              className="text-emerald-700 hover:text-emerald-900 cursor-pointer font-bold ml-3"
            >
              ✕
            </button>
          </div>
        )}

        {/* Real vs Simulated Honest Architecture Banner */}
        <div className="mb-5 bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-50 shrink-0" />
            <div className="text-xs">
              <span className="text-slate-700">
                <strong className="text-slate-900">SIH Operational Framing: </strong>
                Voice Authenticity ≠ Action Authorization. Fusing acoustic anti-spoofing signals with Gemini-powered intent and corporate context.
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs shrink-0">
            <span className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono text-[11px] font-semibold">
              REAL: Mic + Gemini 3.8 Flash + Risk Math
            </span>
            <span className="px-2.5 py-1 rounded-md bg-amber-50 text-amber-700 border border-amber-200 font-mono text-[11px] font-semibold">
              SIMULATED: AASIST / Replay / CBS Outbound
            </span>
          </div>
        </div>

        {/* Tab 1: Live Firewall Pipeline */}
        {activeTab === 'firewall' && (
          <>
            {/* Nine-Layer Visual Pipeline Stepper */}
            <PipelineVisualizer
              isStreaming={isStreaming}
              activeChunkCount={chunkCount}
              deepfakeScore={deepfakeResult.score}
              speakerMismatch={speakerResult.mismatchRisk}
              replayScore={replayResult.replayScore}
              nlpScore={nlpResult.socialEngineeringRisk}
              contextScore={contextResult.contextRiskScore}
              fusedScore={fusionResult.finalRiskScore}
              currentDecision={policyDecision.action}
              selectedLayer={selectedLayer}
              onSelectLayer={(idx) => setSelectedLayer(selectedLayer === idx ? null : idx)}
            />

            {/* Main Interactive Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column (Inputs: Audio Ingestion, Conversation Intel, Context Engine) */}
              <div className="lg:col-span-7 space-y-6">
                {/* Layers 1 & 2: Communication & Audio Ingestion */}
                <LiveAudioControl
                  isStreaming={isStreaming}
                  onToggleMic={handleToggleMic}
                  audioVolume={audioVolume}
                  features={audioFeatures}
                  chunkCount={chunkCount}
                  selectedScenario={selectedScenario}
                  onSelectScenario={handleSelectScenario}
                  audioError={audioError}
                  isPlayingScenarioAudio={isPlayingScenarioAudio}
                  onToggleScenarioAudio={handleToggleScenarioAudio}
                  detectedSector={detectedSector}
                  liveAlerts={liveAlerts}
                  interimTranscript={interimTranscript}
                  deepfakeScore={deepfakeResult.score}
                  fusedRiskScore={fusionResult.finalRiskScore}
                  micLanguage={micLanguage}
                  onChangeMicLanguage={handleMicLanguageChange}
                />

                {/* Layer 4: Conversation Intelligence (Gemini NLP) */}
                <ConversationIntelPanel
                  transcript={transcript}
                  onChangeTranscript={setTranscript}
                  nlpResult={nlpResult}
                  isAnalyzing={isAnalyzingNlp}
                  onRunGeminiAnalysis={handleRunGeminiAnalysis}
                />

                {/* Layer 5: Context Engine */}
                <ContextEnginePanel
                  selectedProfile={selectedProfile}
                  onSelectProfile={(p) => {
                    setSelectedProfile(p);
                    setCallerPhone(p.phone);
                    setIsSpoofedCallerId(false);
                  }}
                  callerPhone={callerPhone}
                  onChangeCallerPhone={setCallerPhone}
                  requestedAction={requestedAction}
                  onChangeRequestedAction={setRequestedAction}
                  requestedAmount={requestedAmount}
                  onChangeRequestedAmount={setRequestedAmount}
                  isAfterHours={isAfterHours}
                  onToggleAfterHours={() => setIsAfterHours(!isAfterHours)}
                  isSpoofedCallerId={isSpoofedCallerId}
                  onToggleSpoofedCallerId={handleToggleSpoofedCallerId}
                  contextResult={contextResult}
                />
              </div>

              {/* Right Column (Decisions: Gauge, Decision Banner, Signal Breakdown) */}
              <div className="lg:col-span-5 space-y-6">
                {/* Layers 6, 7 & 8: Unified Risk Gauge, Decision & Step-Up */}
                <RiskDecisionGauge
                  fusionResult={fusionResult}
                  policyDecision={policyDecision}
                  currentTenant={currentTenant}
                  onSimulateResolveStepUp={handleResolveStepUp}
                  stepUpResolved={stepUpResolved}
                  selectedScenario={selectedScenario}
                />

                {/* Quick Database Persistence Action (Layer 8 Audit Storage) */}
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-2 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 shrink-0">
                      <Database className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-900">
                        PostgreSQL Database Sync
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {dbStatus?.connected
                          ? `Connected (${dbStatus.host}) • ${dbStatus?.tables?.voice_evaluations ?? auditRecords.length} records in DB`
                          : 'Persist this live decision & signal payload directly to DB'}
                      </div>
                    </div>
                  </div>

                  <button
                    id="btn-persist-to-db"
                    onClick={handlePersistCurrentEvaluation}
                    disabled={isSavingDb}
                    className="w-full sm:w-auto px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs disabled:opacity-60 shrink-0"
                  >
                    <Database className="w-3.5 h-3.5" />
                    {isSavingDb ? 'Saving to Database...' : 'Save Evaluation to DB'}
                  </button>
                </div>

                {/* Layers 3 & 6: Detailed Signal Breakdown Cards */}
                <SignalBreakdownCard
                  deepfakeResult={deepfakeResult}
                  speakerResult={speakerResult}
                  replayResult={replayResult}
                  nlpResult={nlpResult}
                  contextResult={contextResult}
                  fusionResult={fusionResult}
                />
              </div>
            </div>
          </>
        )}

        {/* Tab: Live Microphone Capture & Real-Time Security Intelligence */}
        {activeTab === 'live_intel' && (
          <LiveVoiceIntelligence
            currentTenant={currentTenant}
            onNavigateToEvaluation={() => setActiveTab('evaluation_library')}
          />
        )}

        {/* Tab: Evaluation Audio Library & Automatic Dataset Integration */}
        {activeTab === 'evaluation_library' && (
          <EvaluationAudioLibrary />
        )}

        {/* Tab 2: Outbound Integration & API Inspector (Layer 9) */}
        {activeTab === 'api' && (
          <IntegrationApiPanel
            currentTenant={currentTenant}
            signals={{
              deepfakeScore: deepfakeResult.score,
              speakerSimScore: speakerResult.similarity,
              replayScore: replayResult.replayScore,
              nlpScore: nlpResult.socialEngineeringRisk,
              contextScore: contextResult.contextRiskScore,
            }}
            callerPhone={callerPhone}
            claimedIdentity={`${selectedProfile.name} (${selectedProfile.role})`}
            requestedAction={requestedAction}
          />
        )}

        {/* Tab 3: Security Audit & Analytics Ledger */}
        {activeTab === 'audit' && (
          <AuditLogView
            records={auditRecords}
            onClearLog={handleClearAudit}
            dbStatus={dbStatus}
            onRefreshLogs={fetchAuditLogs}
            onInitSchema={handleInitSchema}
            isInitializingSchema={isInitializingSchema}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-slate-600 text-xs text-center">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            Smart India Hackathon (SIH) Prototype • <strong className="text-slate-900">Real-Time Voice Trust Firewall</strong>
          </span>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsDisclosureModalOpen(true)}
              className="text-indigo-600 hover:text-indigo-800 font-medium hover:underline cursor-pointer"
            >
              Real vs. Simulated Disclosures
            </button>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500 font-mono">India DPDP Act 2023 Minimal Logging</span>
          </div>
        </div>
      </footer>

      {/* Policy Engine Configuration Modal */}
      <PolicyConfigModal
        isOpen={isPolicyModalOpen}
        onClose={() => setIsPolicyModalOpen(false)}
        tenantConfig={currentTenant}
        onUpdateConfig={setCurrentTenant}
        onSwitchTenant={handleSwitchTenant}
      />

      {/* Research Disclosure Modal */}
      <ResearchDisclosureModal
        isOpen={isDisclosureModalOpen}
        onClose={() => setIsDisclosureModalOpen(false)}
      />
    </div>
  );
}
