import React from 'react';
import { 
  Mic, 
  Layers, 
  Cpu, 
  MessageSquareCode, 
  Database, 
  Flame, 
  FileCheck2, 
  ShieldAlert, 
  Radio
} from 'lucide-react';
import { TrustAction } from '../types';

interface PipelineVisualizerProps {
  isStreaming: boolean;
  activeChunkCount: number;
  deepfakeScore: number;
  speakerMismatch: number;
  replayScore: number;
  nlpScore: number;
  contextScore: number;
  fusedScore: number;
  currentDecision: TrustAction;
  selectedLayer: number | null;
  onSelectLayer: (layerIndex: number) => void;
}

export const PipelineVisualizer: React.FC<PipelineVisualizerProps> = ({
  isStreaming,
  activeChunkCount,
  deepfakeScore,
  speakerMismatch,
  replayScore,
  nlpScore,
  contextScore,
  fusedScore,
  currentDecision,
  selectedLayer,
  onSelectLayer,
}) => {
  const layers = [
    {
      index: 1,
      name: "1. Communication",
      short: "Audio In",
      badge: "REAL",
      badgeType: "real",
      tech: "WebRTC / Mic",
      icon: Mic,
      status: isStreaming ? "Active Streaming" : "Standby",
      value: isStreaming ? "16 kHz PCM" : "Idle",
      iconStyle: "bg-indigo-50 border-indigo-200 text-indigo-600",
      valueColor: isStreaming ? "text-emerald-700" : "text-slate-600",
    },
    {
      index: 2,
      name: "2. Audio Ingestion",
      short: "Buffering & VAD",
      badge: "REAL",
      badgeType: "real",
      tech: "2.5s Chunk Buffer",
      icon: Layers,
      status: isStreaming ? `Chunk #${activeChunkCount}` : "Idle",
      value: isStreaming ? `${activeChunkCount} chunks` : "Buffered",
      iconStyle: "bg-indigo-50 border-indigo-200 text-indigo-600",
      valueColor: isStreaming ? "text-indigo-700" : "text-slate-600",
    },
    {
      index: 3,
      name: "3. Audio Intelligence",
      short: "Acoustic Signals",
      badge: "SIMULATED",
      badgeType: "simulated",
      tech: "AASIST / ECAPA",
      icon: Cpu,
      status: "3 Sub-Signals",
      value: `DF: ${deepfakeScore}% | SP: ${speakerMismatch}%`,
      iconStyle: "bg-amber-50 border-amber-200 text-amber-700",
      valueColor: deepfakeScore > 70 ? "text-rose-600" : "text-amber-700",
    },
    {
      index: 4,
      name: "4. Conversation AI",
      short: "ASR + Gemini NLP",
      badge: "REAL GEMINI",
      badgeType: "gemini",
      tech: "Gemini 3.8 Flash",
      icon: MessageSquareCode,
      status: "Social Engineering",
      value: `Risk: ${nlpScore}/100`,
      iconStyle: "bg-purple-50 border-purple-200 text-purple-700",
      valueColor: nlpScore > 70 ? "text-rose-600" : nlpScore > 40 ? "text-amber-700" : "text-emerald-700",
    },
    {
      index: 5,
      name: "5. Context Engine",
      short: "Caller & Policy Data",
      badge: "SIMULATED",
      badgeType: "simulated",
      tech: "Ledger & Limits",
      icon: Database,
      status: "Policy Anomalies",
      value: `Risk: ${contextScore}/100`,
      iconStyle: "bg-amber-50 border-amber-200 text-amber-700",
      valueColor: contextScore > 70 ? "text-rose-600" : contextScore > 40 ? "text-amber-700" : "text-emerald-700",
    },
    {
      index: 6,
      name: "6. Risk Fusion",
      short: "0–100 Weighted Math",
      badge: "REAL MATH",
      badgeType: "real",
      tech: "Normalized Sum",
      icon: Flame,
      status: "Multi-Modal Score",
      value: `${fusedScore} / 100`,
      iconStyle: "bg-slate-100 border-slate-200 text-slate-700",
      valueColor: fusedScore > 75 ? "text-rose-600" : fusedScore > 55 ? "text-orange-600" : fusedScore > 25 ? "text-amber-600" : "text-emerald-700",
    },
    {
      index: 7,
      name: "7. Policy Engine",
      short: "Tenant Thresholds",
      badge: "REAL ENGINE",
      badgeType: "real",
      tech: "Multi-Tenant Policy",
      icon: FileCheck2,
      status: "Enforcement",
      value: currentDecision,
      iconStyle: "bg-slate-100 border-slate-200 text-slate-700",
      valueColor: currentDecision === 'BLOCK' ? 'text-rose-600' : currentDecision === 'PAUSE_ESCALATE' ? 'text-orange-600' : currentDecision === 'VERIFY' ? 'text-amber-600' : 'text-emerald-700',
    },
    {
      index: 8,
      name: "8. Response & Action",
      short: "Active Step-Up",
      badge: "SIMULATED",
      badgeType: "simulated",
      tech: "OTP / Callback / Hold",
      icon: ShieldAlert,
      status: "Containment Loop",
      value: currentDecision === 'ALLOW' ? 'Authorized' : 'Step-Up Required',
      iconStyle: "bg-amber-50 border-amber-200 text-amber-700",
      valueColor: currentDecision === 'ALLOW' ? 'text-emerald-700' : 'text-amber-700',
    },
    {
      index: 9,
      name: "9. Integration & API",
      short: "Outbound CBS / PBX",
      badge: "MOCK REST",
      badgeType: "simulated",
      tech: "REST / OpenAPI",
      icon: Radio,
      status: "Mock Consumer",
      value: "POST /evaluate",
      iconStyle: "bg-blue-50 border-blue-200 text-blue-700",
      valueColor: "text-blue-700",
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs mb-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 mb-3 border-b border-slate-100 gap-2">
        <div className="flex items-center space-x-2">
          <div className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse" />
          <h2 className="text-xs font-bold tracking-wider uppercase text-slate-800">
            End-to-End Nine-Layer Inspection Pipeline
          </h2>
        </div>
        <div className="flex items-center space-x-3 text-xs">
          <span className="flex items-center gap-1.5 text-slate-600">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Real Component
          </span>
          <span className="flex items-center gap-1.5 text-slate-600">
            <span className="w-2 h-2 rounded-full bg-purple-500 inline-block" /> Gemini 3.8 Flash
          </span>
          <span className="flex items-center gap-1.5 text-slate-600">
            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> Simulated Model/Channel
          </span>
        </div>
      </div>

      {/* 9-Node Pipeline Flow Container */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2.5">
        {layers.map((layer) => {
          const IconComp = layer.icon;
          const isSelected = selectedLayer === layer.index;
          return (
            <button
              key={layer.index}
              id={`pipeline-step-${layer.index}`}
              onClick={() => onSelectLayer(layer.index)}
              className={`text-left relative p-2.5 rounded-xl border transition-all duration-150 flex flex-col justify-between cursor-pointer ${
                isSelected
                  ? 'bg-indigo-50/60 ring-2 ring-indigo-500 border-indigo-400 shadow-xs'
                  : 'bg-slate-50/70 hover:bg-slate-100/90 border-slate-200/80'
              }`}
            >
              {/* Header inside node */}
              <div className="flex items-center justify-between mb-2">
                <div className={`p-1.5 rounded-lg border shadow-2xs ${layer.iconStyle}`}>
                  <IconComp className="w-3.5 h-3.5" />
                </div>
                <span
                  className={`text-[9px] font-semibold px-1.5 py-0.5 rounded tracking-wider uppercase ${
                    layer.badgeType === 'real'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : layer.badgeType === 'gemini'
                      ? 'bg-purple-50 text-purple-700 border border-purple-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}
                >
                  {layer.badge}
                </span>
              </div>

              {/* Title & info */}
              <div>
                <div className="text-[11px] font-bold text-slate-900 line-clamp-1">
                  {layer.name}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-1 font-mono">
                  {layer.tech}
                </div>
              </div>

              {/* Live Metric / Status */}
              <div className="mt-2.5 pt-1.5 border-t border-slate-200/70 flex items-center justify-between">
                <span className="text-[10px] text-slate-500">{layer.status}</span>
                <span className={`text-[10px] font-bold font-mono ${layer.valueColor}`}>
                  {layer.value}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
