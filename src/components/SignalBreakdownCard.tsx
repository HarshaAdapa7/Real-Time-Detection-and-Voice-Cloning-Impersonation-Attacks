import React from 'react';
import { Cpu, Users, Radio, MessageSquareCode, Database } from 'lucide-react';
import { DeepfakeSignalResult, SpeakerSignalResult, ReplaySignalResult, NlpSignalResult, ContextSignalResult, RiskFusionResult } from '../types';

interface SignalBreakdownCardProps {
  deepfakeResult: DeepfakeSignalResult;
  speakerResult: SpeakerSignalResult;
  replayResult: ReplaySignalResult;
  nlpResult: NlpSignalResult;
  contextResult: ContextSignalResult;
  fusionResult: RiskFusionResult;
}

export const SignalBreakdownCard: React.FC<SignalBreakdownCardProps> = ({
  deepfakeResult,
  speakerResult,
  replayResult,
  nlpResult,
  contextResult,
  fusionResult,
}) => {
  const { weightedBreakdown, weights } = fusionResult;

  const signals = [
    {
      id: "deepfake",
      name: "Voice Deepfake / Anti-Spoofing",
      score: deepfakeResult.score,
      maxScore: 100,
      weightPct: Math.round(weights.deepfake * 100),
      contribution: weightedBreakdown.deepfakeContribution,
      badge: "SIMULATED",
      badgeClass: "bg-amber-50 text-amber-700 border border-amber-200",
      icon: Cpu,
      iconColor: "text-amber-600",
      barColor: deepfakeResult.score > 70 ? "bg-rose-500" : deepfakeResult.score > 40 ? "bg-amber-500" : "bg-emerald-500",
      details: deepfakeResult.generatorSignature,
      artifacts: deepfakeResult.artifactsDetected,
      modelRef: "Target: AASIST / RawNet2 on ASVspoof 2021 LA",
    },
    {
      id: "speaker",
      name: "Speaker Biometric Mismatch",
      score: speakerResult.mismatchRisk,
      maxScore: 100,
      weightPct: Math.round(weights.speaker * 100),
      contribution: weightedBreakdown.speakerContribution,
      badge: "SIMULATED",
      badgeClass: "bg-amber-50 text-amber-700 border border-amber-200",
      icon: Users,
      iconColor: "text-amber-600",
      barColor: speakerResult.mismatchRisk > 60 ? "bg-rose-500" : speakerResult.mismatchRisk > 30 ? "bg-amber-500" : "bg-emerald-500",
      details: `Similarity to ${speakerResult.enrolledSpeakerName}: ${speakerResult.similarity}% (Mismatch: ${speakerResult.mismatchRisk}%)`,
      artifacts: speakerResult.similarity > 80 ? ["Acoustic timbre closely resembles enrolled voice"] : ["Voiceprint departs significantly from enrolled vector"],
      modelRef: "Target: SpeechBrain ECAPA-TDNN Embedding Vector Cosine",
    },
    {
      id: "replay",
      name: "Replay & Channel Anomaly",
      score: replayResult.replayScore,
      maxScore: 100,
      weightPct: Math.round(weights.replay * 100),
      contribution: weightedBreakdown.replayContribution,
      badge: "SIMULATED",
      badgeClass: "bg-amber-50 text-amber-700 border border-amber-200",
      icon: Radio,
      iconColor: "text-amber-600",
      barColor: replayResult.replayScore > 70 ? "bg-rose-500" : replayResult.replayScore > 40 ? "bg-amber-500" : "bg-emerald-500",
      details: replayResult.channelProfile,
      artifacts: [`Spectral damping factor: ${replayResult.spectralDamping}`],
      modelRef: "Target: DSP Spectral / Room Impulse Response (RIR) / G.711 Codec",
    },
    {
      id: "nlp",
      name: "Conversation Intent & Social Eng.",
      score: nlpResult.socialEngineeringRisk,
      maxScore: 100,
      weightPct: Math.round(weights.nlp * 100),
      contribution: weightedBreakdown.nlpContribution,
      badge: nlpResult.isRealGemini ? "REAL GEMINI" : "RULE FALLBACK",
      badgeClass: nlpResult.isRealGemini ? "bg-purple-50 text-purple-700 border border-purple-200" : "bg-amber-50 text-amber-700 border border-amber-200",
      icon: MessageSquareCode,
      iconColor: "text-purple-600",
      barColor: nlpResult.socialEngineeringRisk > 70 ? "bg-rose-500" : nlpResult.socialEngineeringRisk > 40 ? "bg-amber-500" : "bg-emerald-500",
      details: `Urgency: ${nlpResult.urgencyScore}% | Secrecy: ${nlpResult.secrecyScore}% | Tone: ${nlpResult.coercionTone}`,
      artifacts: nlpResult.detectedCues.slice(0, 2),
      modelRef: "Active: Google Gemini 3.8 Flash (Server-Side Inference)",
    },
    {
      id: "context",
      name: "Context & Transaction Policy",
      score: contextResult.contextRiskScore,
      maxScore: 100,
      weightPct: Math.round(weights.context * 100),
      contribution: weightedBreakdown.contextContribution,
      badge: "SIMULATED",
      badgeClass: "bg-amber-50 text-amber-700 border border-amber-200",
      icon: Database,
      iconColor: "text-amber-600",
      barColor: contextResult.contextRiskScore > 70 ? "bg-rose-500" : contextResult.contextRiskScore > 40 ? "bg-amber-500" : "bg-emerald-500",
      details: `${contextResult.claimedIdentity} • ${contextResult.requestedAction}`,
      artifacts: contextResult.flags.slice(0, 2),
      modelRef: "Target: CBS / HRMS Ledger & Dual-Authorization Policy",
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            Multi-Signal Evidence Breakdown & Contribution
            <span className="text-[10px] bg-slate-100 text-slate-700 border border-slate-200 px-1.5 py-0.5 rounded font-mono uppercase font-semibold">
              5 Signal Streams
            </span>
          </h3>
          <p className="text-xs text-slate-500">
            Per-signal raw score × normalized weight = contribution points to final 0–100 fused risk
          </p>
        </div>
      </div>

      <div className="space-y-3.5">
        {signals.map((sig) => {
          const IconComp = sig.icon;
          return (
            <div
              key={sig.id}
              className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-slate-300 transition"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center space-x-2">
                  <div className={`p-1.5 rounded-lg bg-white border border-slate-200 shadow-2xs ${sig.iconColor}`}>
                    <IconComp className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900">{sig.name}</span>
                    <span className={`ml-2 text-[9px] px-1.5 py-0.5 rounded font-mono font-semibold uppercase ${sig.badgeClass}`}>
                      {sig.badge}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-bold font-mono text-slate-900">
                    {sig.score} <span className="text-[10px] text-slate-500 font-normal">pts</span>
                  </div>
                  <div className="text-[10px] text-indigo-600 font-mono font-semibold">
                    +{sig.contribution} to total ({sig.weightPct}%)
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden mb-2">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${sig.barColor}`}
                  style={{ width: `${sig.score}%` }}
                />
              </div>

              {/* Details & Model Reference */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-600 gap-1">
                <span className="truncate">{sig.details}</span>
                <span className="font-mono text-[10px] text-slate-500 truncate">{sig.modelRef}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
