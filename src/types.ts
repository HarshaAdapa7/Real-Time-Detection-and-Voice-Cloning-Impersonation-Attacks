/**
 * Type definitions for Real-Time Voice Trust Firewall
 * Multi-Signal Voice Security Engine
 */

export type TrustAction = 'ALLOW' | 'VERIFY' | 'PAUSE_ESCALATE' | 'BLOCK';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type TenantId = 'tenant-bank' | 'tenant-enterprise';

export interface TenantConfig {
  id: TenantId;
  name: string;
  type: 'Banking & Financial' | 'Enterprise Operations';
  description: string;
  thresholds: {
    allowMax: number;    // e.g. 25
    verifyMax: number;   // e.g. 55
    escalateMax: number; // e.g. 75
    // Above escalateMax is BLOCK
  };
  weights: {
    deepfake: number;
    speaker: number;
    replay: number;
    nlp: number;
    context: number;
  };
  simulatedStepUps: Record<TrustAction, string>;
}

export interface AudioFeatures {
  rms: number;
  pitchVariance: number;
  spectralCentroid: number;
  zeroCrossingRate: number;
  silenceRatio: number;
}

export interface AudioChunk {
  id: string;
  chunkNumber: number;
  timestamp: string;
  durationSeconds: number;
  features: AudioFeatures;
}

export interface DeepfakeSignalResult {
  score: number; // 0-100 probability of synthetic / clone
  artifactsDetected: string[];
  generatorSignature: string;
  isSimulated: true;
  confidence: number;
}

export interface SpeakerSignalResult {
  similarity: number; // 0-100 similarity to enrolled target
  mismatchRisk: number; // 100 - similarity
  enrolledSpeakerId: string;
  enrolledSpeakerName: string;
  isSimulated: true;
}

export interface ReplaySignalResult {
  replayScore: number; // 0-100 probability of replay/codec tampering
  channelProfile: string;
  spectralDamping: number;
  isSimulated: true;
}

export interface NlpSignalResult {
  transcript: string;
  socialEngineeringRisk: number; // 0-100
  urgencyScore: number; // 0-100
  secrecyScore: number; // 0-100
  financialRequestDetected: boolean;
  otpCredentialRequestDetected: boolean;
  detectedCues: string[];
  coercionTone: string;
  reasoning: string;
  isRealGemini: boolean;
  isAnalyzing?: boolean;
}

export interface ContextProfile {
  id: string;
  name: string;
  role: string;
  department: string;
  phone: string;
  typicalTransferLimit: number;
  businessHoursStart: number; // 9 = 9 AM
  businessHoursEnd: number;   // 18 = 6 PM
  recentCallFrequency: string;
}

export interface ContextSignalResult {
  callerPhone: string;
  claimedIdentity: string;
  claimedRole: string;
  requestedAction: string;
  requestedAmount?: number;
  contextRiskScore: number; // 0-100
  flags: string[];
  isAfterHours: boolean;
  isHighValue: boolean;
  isSimulated: true;
}

export interface RiskFusionResult {
  finalRiskScore: number; // 0-100
  riskLevel: RiskLevel;
  weightedBreakdown: {
    deepfakeContribution: number;
    speakerContribution: number;
    replayContribution: number;
    nlpContribution: number;
    contextContribution: number;
  };
  weights: {
    deepfake: number;
    speaker: number;
    replay: number;
    nlp: number;
    context: number;
  };
  dominantRiskFactor: string;
  formulaString: string;
  circuitBreakerTriggered?: string;
  isCircuitBreakerActive?: boolean;
}

export interface PolicyDecision {
  action: TrustAction;
  riskLevel: RiskLevel;
  stepUpAction: string;
  tenantId: TenantId;
  tenantName: string;
  triggeredThresholdRule: string;
  criticalOverrideRule?: string;
  circuitBreakerActive?: boolean;
}

export interface AuditRecord {
  id: string;
  timestamp: string;
  durationSeconds: number;
  caller: string;
  claimedTarget: string;
  requestedAction: string;
  transcript: string;
  finalRiskScore: number;
  decision: TrustAction;
  stepUpAction: string;
  tenantName: string;
  breakdown: {
    deepfake: number;
    speakerMismatch: number;
    replay: number;
    nlp: number;
    context: number;
  };
  wasRealGemini: boolean;
}

export type ScenarioCategory =
  | 'Executive Wire Fraud'
  | 'Credential Phishing'
  | 'Acoustic Replay'
  | 'Context Escalation'
  | 'Distress Extortion'
  | 'Vendor Redirection'
  | 'Multilingual Voice'
  | 'Benign Business'
  | 'High Threat Attack'
  | 'Impersonation Clone';

export interface PreloadedScenario {
  id: string;
  title: string;
  category: ScenarioCategory;
  description: string;
  claimedSpeaker: string;
  action: string;
  amount: number;
  sampleTranscript: string;
  baseDeepfake: number;
  baseSpeakerSim: number;
  baseReplay: number;
  simulatedAudioVariant: string;
  acousticArtifacts?: string;
  expectedDecision?: TrustAction;
  expectedRiskLevel?: RiskLevel;
  language?: string;
  languageCode?: string;
  turns?: Array<{ turnNumber: number; speaker: string; transcript: string; intent?: string }>;
  ttsVoiceConfig?: {
    pitch?: number;
    rate?: number;
    voiceFilter?: 'robot-telephony' | 'synthetic' | 'replay-echo' | 'telephony' | 'distressed' | 'clean-telephony' | 'natural';
  };
}

export interface DbStatus {
  configured: boolean;
  connected: boolean;
  host: string;
  database: string;
  tables: {
    voice_evaluations: number;
    tenant_policies: number;
    enrolled_identities: number;
    audit_trail_events: number;
    live_sessions?: number;
    evaluation_audio_library?: number;
  };
  message: string;
  error?: string;
}

// ==========================================
// Multilingual & Context-Switching Test Types
// ==========================================

export type LanguageCode = 'en' | 'hi' | 'te' | 'ta' | 'kn' | 'ml' | 'mr' | 'bn';

export interface LanguageConfig {
  code: LanguageCode;
  name: string;
  nativeName: string;
  script: string;
  isAsrSupported: boolean;
  asrEngineModel: string;
  sampleUtterance: string;
}

export type MultilingualCategory =
  | 'multilingual'
  | 'context_switching'
  | 'cross_lingual_speaker'
  | 'rapid_switching'
  | 'context_reversal';

export interface ContextSwitchTurn {
  turn_number: number;
  language: string;
  language_code: string;
  transcript: string;
  intent: string;
  expected_context: string;
  expected_risk_level: RiskLevel;
  expected_risk_range?: [number, number];
  actual_risk_score?: number;
  actual_detected_language?: string;
  actual_intent?: string;
  context_switch?: boolean;
  language_switch?: boolean;
  coercion_cues?: string[];
}

export interface TestCaseSchema {
  test_id: string;
  category: MultilingualCategory;
  language: string;
  language_code: string;
  scenario: string;
  input_type: 'audio' | 'text_transcript';
  expected_language: string;
  expected_transcription?: string;
  expected_intent: string;
  expected_security_category: string;
  expected_risk_level: RiskLevel;
  expected_risk_range?: [number, number];
  expected_decision: TrustAction;
  sample_transcription: string;
  acoustic_profile?: string;
  speaker_id?: string;
  turns?: ContextSwitchTurn[];
  // Actual execution metrics
  actual_transcription?: string;
  actual_detected_language?: string;
  actual_intent?: string;
  actual_risk_score?: number;
  actual_decision?: TrustAction;
  passed?: boolean;
  is_supported?: boolean;
  failure_reason?: string | null;
}

export interface SessionContext {
  call_id: string;
  turn_number: number;
  detected_language: string;
  previous_language: string | null;
  language_switch: boolean;
  current_context: string;
  previous_context: string | null;
  context_switch: boolean;
  context_history: string[];
  language_history: string[];
  risk_history: number[];
  decision_history: string[];
  risk_score: number;
  decision: TrustAction;
  risk_change: string; // e.g. "+32", "-15", "0"
  escalation_flags: string[];
  decay_policy: 'decay_gradual' | 'retain_elevated' | 'immediate_reset';
}

export interface ContextSwitchDetectionResult {
  context_switch: boolean;
  from: string;
  to: string;
  language_switch: boolean;
  from_language: string;
  to_language: string;
  risk_change: string;
  is_security_escalation: boolean;
  detected_intent: string;
  confidence: number;
  cues: string[];
}

export interface EvaluationReport {
  total_tests: number;
  passed: number;
  failed: number;
  unsupported: number;
  accuracy: number;
  language_wise_accuracy: Record<
    string,
    { total: number; passed: number; failed: number; unsupported: number; accuracy: number }
  >;
  context_switch_accuracy: number;
  intent_classification_accuracy: number;
  false_positives: number;
  false_negatives: number;
  test_results: TestCaseSchema[];
  execution_timestamp: string;
}

// ============================================================
// Live Voice Captioning, Capture & Evaluation Dataset Types
// ============================================================

export interface LiveSessionRecord {
  session_id: string;
  source: 'LIVE_MICROPHONE';
  start_time: string;
  end_time: string | null;
  status: 'active' | 'paused' | 'stopped';
  total_duration: number; // in seconds
  detected_languages: string[];
  final_risk_score: number;
  final_decision: TrustAction;
  turns_count: number;
  created_at?: string;
}

export interface AudioRecord {
  audio_id: string;
  session_id: string;
  audio_file_path?: string; // storage ref or data URL
  chunk_number: number;
  start_timestamp: string;
  end_timestamp: string;
  duration: number; // seconds
  sample_rate: number;
  format: string;
  source: 'LIVE_MICROPHONE';
}

export interface LiveCaptionRecord {
  caption_id: string;
  session_id: string;
  turn_number: number;
  timestamp: string;
  transcript: string;
  detected_language: string;
  caption_status: 'interim' | 'final';
}

export interface AnalysisResultRecord {
  session_id: string;
  turn_number: number;
  deepfake_score: number;
  speaker_similarity: number;
  replay_score: number;
  nlp_score: number;
  context: string;
  previous_context: string | null;
  context_switch: boolean;
  language_switch: boolean;
  risk_score: number;
  decision: TrustAction;
  timestamp?: string;
}

export type LabelStatus = 'UNVERIFIED' | 'VERIFIED' | 'REJECTED';

export interface EvaluationAudioRecord {
  evaluation_audio_id: string;
  source: 'LIVE_MICROPHONE' | 'SYNTHETIC TEST AUDIO' | 'MANIPULATED TEST AUDIO';
  session_id: string;
  audio_reference?: string; // audio data URI or playback blob
  language: string;
  duration: string; // e.g. "00:18"
  detected_contexts: string[];
  deepfake_prediction: string; // e.g. "Human Voice" or "Deepfake Clone"
  prediction_confidence: number; // 0.0 to 1.0
  label_status: LabelStatus;
  verified_label: boolean;
  expected_decision?: TrustAction;
  expected_risk_level?: RiskLevel;
  expected_context_flow?: string[];
  added_to_evaluation_list: boolean;
  added_to_test_cases?: boolean;
  test_case_id?: string;
  transcript: string;
  turns?: {
    turn_number: number;
    text: string;
    language: string;
    context: string;
    risk: number;
    decision: TrustAction;
  }[];
  created_at: string;
}


