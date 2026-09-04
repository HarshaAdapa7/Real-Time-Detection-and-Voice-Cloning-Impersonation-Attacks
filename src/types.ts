/**
 * Type definitions for Real-Time Voice Trust Firewall
 * Smart India Hackathon (SIH) Prototype
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
}

export interface PolicyDecision {
  action: TrustAction;
  riskLevel: RiskLevel;
  stepUpAction: string;
  tenantId: TenantId;
  tenantName: string;
  triggeredThresholdRule: string;
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

export interface PreloadedScenario {
  id: string;
  title: string;
  category: 'High Threat Attack' | 'Impersonation Clone' | 'Credential Phishing' | 'Benign Business';
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
  };
  message: string;
  error?: string;
}
