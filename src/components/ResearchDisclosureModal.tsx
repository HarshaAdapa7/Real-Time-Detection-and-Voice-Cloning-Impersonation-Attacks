import React from 'react';
import { X, Shield, CheckCircle2, AlertCircle, FileText, Lock, Globe2 } from 'lucide-react';

interface ResearchDisclosureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ResearchDisclosureModal: React.FC<ResearchDisclosureModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-3xl w-full p-6 shadow-xl relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
          <div className="flex items-center space-x-2.5">
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                System Integrity & Multi-Layered Security Architecture
              </h3>
              <p className="text-xs text-slate-500">
                Transparent architectural breakdown, Section 14 "Voice Authenticity ≠ Authorization", and India DPDP Act 2023
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Real vs Simulated Comparison Table */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* REAL */}
          <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200">
            <div className="flex items-center space-x-2 mb-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                Genuinely Real & Functional:
              </h4>
            </div>
            <ul className="space-y-2 text-xs text-slate-700">
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold">•</span>
                <span><strong>Microphone Ingestion (WebRTC):</strong> Direct browser audio stream capture at 16 kHz.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold">•</span>
                <span><strong>Continuous 2.5s Chunking:</strong> Live buffer orchestration, RMS power, spectral centroid, and zero-crossing calculation.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold">•</span>
                <span><strong>Conversation Intelligence (Gemini Flash):</strong> Real server-side LLM inference scoring urgency, secrecy, and credential harvesting.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold">•</span>
                <span><strong>Risk Fusion Math:</strong> Normalized weighted multi-signal summation engine with dominant vector attribution.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold">•</span>
                <span><strong>Multi-Tenant Policy Engine:</strong> Real tenant switching (Bank vs. Enterprise) with configurable threshold enforcement.</span>
              </li>
            </ul>
          </div>

          {/* SIMULATED */}
          <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200">
            <div className="flex items-center space-x-2 mb-3">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                Emulated & Sandbox Modules:
              </h4>
            </div>
            <ul className="space-y-2 text-xs text-slate-700">
              <li className="flex items-start gap-2">
                <span className="text-amber-600 font-bold">•</span>
                <span><strong>Deepfake Detector:</strong> Client-side pitch/spectral heuristics with neural backoff.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-600 font-bold">•</span>
                <span><strong>Speaker Verification:</strong> Enrolled vector matching and acoustic similarity scoring.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-600 font-bold">•</span>
                <span><strong>Replay & Channel:</strong> Acoustic reflection, room impulse response (RIR), and G.711 codec degradation analysis.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-600 font-bold">•</span>
                <span><strong>Banking & Telecom Integration:</strong> Verified REST endpoint contract (/api/voice-trust/evaluate) for CBS/SIP trunking.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-600 font-bold">•</span>
                <span><strong>Step-Up Outbound:</strong> Push OTP and out-of-band callback loop simulations.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Section 14: What We Should NOT Claim */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 mb-6">
          <div className="flex items-center space-x-2 mb-2">
            <FileText className="w-4 h-4 text-indigo-600" />
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Core Security Principle: "Voice Authenticity ≠ Action Authorization"
            </h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-700">
            <div className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-2xs">
              <span className="text-rose-600 font-semibold">❌ We do NOT claim:</span> "Our model detects every fake voice" or "99.9% accuracy means secure". Real voice spoofing is continuously evolving with unseen generators.
            </div>
            <div className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-2xs">
              <span className="text-rose-600 font-semibold">❌ We do NOT claim:</span> "We deployed directly into live telecom or core banking infrastructure." Production access is represented via verified API contracts.
            </div>
            <div className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-2xs">
              <span className="text-rose-600 font-semibold">❌ We do NOT claim:</span> "Voice detection alone prevents fraud." Voice authenticity ≠ action authorization. A genuine voice can be coerced or make an unauthorized request.
            </div>
            <div className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-2xs">
              <span className="text-emerald-700 font-semibold">✓ Our True Differentiator:</span> Fusing voice authenticity + conversation intent (Gemini) + corporate context into an active trust firewall.
            </div>
          </div>
        </div>

        {/* DPDP Act 2023 & Indian Multilingual Context */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 mb-4 flex flex-col sm:flex-row gap-4 items-start">
          <div className="p-2 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-600 shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div className="text-xs text-slate-700 space-y-1">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <span>India DPDP Act 2023 Biometric Privacy Compliance</span>
              <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 px-1.5 py-0.5 rounded font-mono font-semibold">
                EDGE-MINIMAL
              </span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Under India's Digital Personal Data Protection Act 2023, voice recordings and biometrics require consent and minimal logging. This system operates on in-memory ephemeral chunks: raw audio is discarded immediately following feature extraction; only mathematical embeddings and minimal audit logs are retained.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-3 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            Close Disclosure
          </button>
        </div>
      </div>
    </div>
  );
};
