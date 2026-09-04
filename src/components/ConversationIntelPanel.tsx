import React from 'react';
import { MessageSquareCode, Sparkles, AlertTriangle, KeyRound, Banknote, ShieldCheck, RefreshCw } from 'lucide-react';
import { NlpSignalResult } from '../types';

interface ConversationIntelPanelProps {
  transcript: string;
  onChangeTranscript: (text: string) => void;
  nlpResult: NlpSignalResult;
  isAnalyzing: boolean;
  onRunGeminiAnalysis: () => void;
}

export const ConversationIntelPanel: React.FC<ConversationIntelPanelProps> = ({
  transcript,
  onChangeTranscript,
  nlpResult,
  isAnalyzing,
  onRunGeminiAnalysis,
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-purple-50 border border-purple-200 text-purple-600">
            <MessageSquareCode className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              Layer 4: Conversation Intelligence (NLP)
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono uppercase font-semibold ${
                nlpResult.isRealGemini
                  ? 'bg-purple-50 text-purple-700 border border-purple-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}>
                {nlpResult.isRealGemini ? 'REAL GEMINI 3.8 FLASH' : 'RULE-BASED FALLBACK'}
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              Live ASR transcription analyzed for urgency, secrecy & credential/fund extraction
            </p>
          </div>
        </div>

        <button
          id="btn-run-gemini-eval"
          onClick={onRunGeminiAnalysis}
          disabled={isAnalyzing || !transcript.trim()}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ${
            isAnalyzing
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
              : !transcript.trim()
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
              : 'bg-purple-600 hover:bg-purple-700 text-white'
          }`}
        >
          {isAnalyzing ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              Scoring Intent...
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              Analyze with Gemini
            </>
          )}
        </button>
      </div>

      {/* Transcript Input / Live Stream View */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs text-slate-600 mb-1.5">
          <span>Live Call Speech Transcript (Speak into mic or edit text):</span>
          <span className="text-[11px] font-mono text-slate-500">{transcript.length} chars</span>
        </div>
        <textarea
          id="textarea-transcript"
          rows={3}
          value={transcript}
          onChange={(e) => onChangeTranscript(e.target.value)}
          placeholder="Speak via microphone, click a preset scenario above, or type live conversation text here to evaluate..."
          className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 font-sans resize-y shadow-2xs"
        />
      </div>

      {/* Gemini NLP Risk Breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
          <div className="flex items-center justify-between text-[11px] text-slate-600 mb-1">
            <span>Social Engineering</span>
            <span className="font-mono font-bold text-purple-700">{nlpResult.socialEngineeringRisk}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${
                nlpResult.socialEngineeringRisk > 70 ? 'bg-rose-500' : nlpResult.socialEngineeringRisk > 40 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${nlpResult.socialEngineeringRisk}%` }}
            />
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
          <div className="flex items-center justify-between text-[11px] text-slate-600 mb-1">
            <span>Urgency Index</span>
            <span className="font-mono font-bold text-amber-700">{nlpResult.urgencyScore}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 rounded-full"
              style={{ width: `${nlpResult.urgencyScore}%` }}
            />
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
          <div className="flex items-center justify-between text-[11px] text-slate-600 mb-1">
            <span>Secrecy / Isolation</span>
            <span className="font-mono font-bold text-rose-700">{nlpResult.secrecyScore}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-rose-500 rounded-full"
              style={{ width: `${nlpResult.secrecyScore}%` }}
            />
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between">
          <div className="text-[11px] text-slate-600">Coercion Tone</div>
          <div className="text-xs font-bold text-slate-900 mt-1 truncate">
            {nlpResult.coercionTone || "Neutral"}
          </div>
        </div>
      </div>

      {/* Flag Badges & Gemini Reasoning */}
      <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/80">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          {nlpResult.financialRequestDetected && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-50 border border-rose-200 text-rose-700">
              <Banknote className="w-3.5 h-3.5 text-rose-600" />
              Financial Transfer / Wire Demand
            </span>
          )}
          {nlpResult.otpCredentialRequestDetected && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-orange-50 border border-orange-200 text-orange-700">
              <KeyRound className="w-3.5 h-3.5 text-orange-600" />
              OTP / Credential Harvesting Cues
            </span>
          )}
          {!nlpResult.financialRequestDetected && !nlpResult.otpCredentialRequestDetected && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 border border-emerald-200 text-emerald-700">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              No Explicit Credential or Financial Cues Flagged
            </span>
          )}
        </div>

        {nlpResult.detectedCues.length > 0 && (
          <div className="text-xs text-slate-700 mb-2">
            <span className="text-slate-500 font-semibold">Detected Cues: </span>
            {nlpResult.detectedCues.join(" • ")}
          </div>
        )}

        <p className="text-xs text-slate-600 italic bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
          "{nlpResult.reasoning}"
        </p>
      </div>
    </div>
  );
};
