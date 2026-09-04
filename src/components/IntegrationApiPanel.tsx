import React, { useState } from 'react';
import { Code2, Play, Copy, Check, Radio, Terminal, Server, AlertCircle } from 'lucide-react';
import { TenantConfig } from '../types';

interface IntegrationApiPanelProps {
  currentTenant: TenantConfig;
  signals: {
    deepfakeScore: number;
    speakerSimScore: number;
    replayScore: number;
    nlpScore: number;
    contextScore: number;
  };
  callerPhone: string;
  claimedIdentity: string;
  requestedAction: string;
}

export const IntegrationApiPanel: React.FC<IntegrationApiPanelProps> = ({
  currentTenant,
  signals,
  callerPhone,
  claimedIdentity,
  requestedAction,
}) => {
  const [copied, setCopied] = useState(false);
  const [apiResponse, setApiResponse] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const samplePayload = {
    callId: `call-sih-${Math.random().toString(36).substring(2, 9)}`,
    tenantId: currentTenant.id,
    callerPhone,
    claimedIdentity,
    requestedAction,
    signals: {
      deepfakeScore: signals.deepfakeScore,
      speakerSimScore: signals.speakerSimScore,
      replayScore: signals.replayScore,
      nlpScore: signals.nlpScore,
      contextScore: signals.contextScore,
    },
  };

  const handleTestCall = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/voice-trust/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(samplePayload),
      });

      if (!res.ok) {
        throw new Error(`API Error: ${res.status}`);
      }

      const json = await res.json();
      setApiResponse(json);
    } catch (err: any) {
      setError(err.message || 'Failed to call evaluation API endpoint');
    } finally {
      setLoading(false);
    }
  };

  const curlSnippet = `curl -X POST "${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/api/voice-trust/evaluate" \\
  -H "Content-Type: application/json" \\
  -H "X-Tenant-ID: ${currentTenant.id}" \\
  -d '${JSON.stringify(samplePayload, null, 2)}'`;

  const handleCopyCurl = () => {
    navigator.clipboard.writeText(curlSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs mb-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-100">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600">
            <Radio className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">
                Layer 9: Integration & Outbound API Layer
              </h3>
              <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded font-mono uppercase font-semibold">
                SIMULATED INTEGRATION CONTRACT
              </span>
            </div>
            <p className="text-xs text-slate-500">
              REST & SDK endpoints exposing live trust verdicts to Core Banking (CBS) and Enterprise PBX
            </p>
          </div>
        </div>

        <button
          id="btn-invoke-api-eval"
          onClick={handleTestCall}
          disabled={loading}
          className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-2 shadow-xs transition cursor-pointer disabled:opacity-50"
        >
          {loading ? (
            <span className="animate-spin">⏳</span>
          ) : (
            <Play className="w-3.5 h-3.5 fill-current" />
          )}
          <span>Execute Test Request via Express API</span>
        </button>
      </div>

      {/* Honesty disclaimer banner */}
      <div className="p-3 mb-5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-2.5">
        <Server className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
        <div>
          <strong className="text-slate-900">SIH Architecture Note: </strong>
          This API endpoint is hosted by the Express server (`/api/voice-trust/evaluate`). It simulates how a Core Banking System (e.g. Infosys Finacle) or Telecom Gateway (Exotel/Plivo) interacts with the Voice Trust Firewall contract without claiming direct production bank connectivity.
        </div>
      </div>

      {error && (
        <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Code Request & Response Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Outbound Request */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="font-semibold text-slate-700 flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-slate-500" />
              HTTP POST /api/voice-trust/evaluate (Payload)
            </span>
            <button
              onClick={handleCopyCurl}
              className="text-[11px] text-indigo-600 hover:text-indigo-700 flex items-center gap-1 font-medium cursor-pointer"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copied cURL' : 'Copy cURL'}
            </button>
          </div>
          <pre className="flex-1 bg-slate-900 border border-slate-800 p-4 rounded-xl text-xs font-mono text-cyan-300 overflow-x-auto leading-relaxed max-h-[380px] shadow-2xs">
            {JSON.stringify(samplePayload, null, 2)}
          </pre>
        </div>

        {/* Inbound Response */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="font-semibold text-slate-700 flex items-center gap-1.5">
              <Code2 className="w-3.5 h-3.5 text-slate-500" />
              API JSON Response (Firewall Verdict & Step-Up)
            </span>
            <span className="text-[11px] font-mono text-slate-500">
              {apiResponse ? 'Status: 200 OK' : 'Ready to evaluate'}
            </span>
          </div>

          <pre className="flex-1 bg-slate-900 border border-slate-800 p-4 rounded-xl text-xs font-mono text-emerald-400 overflow-x-auto leading-relaxed max-h-[380px] shadow-2xs">
            {apiResponse
              ? JSON.stringify(apiResponse, null, 2)
              : `// Click "Execute Test Request via Express API" above to invoke\n// the live server-side REST endpoint and view the verdict contract.\n\n{\n  "status": "awaiting_request",\n  "targetEndpoint": "/api/voice-trust/evaluate",\n  "tenant": "${currentTenant.id}"\n}`}
          </pre>
        </div>
      </div>
    </div>
  );
};
