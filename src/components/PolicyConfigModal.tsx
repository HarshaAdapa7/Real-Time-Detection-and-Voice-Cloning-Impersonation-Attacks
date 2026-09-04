import React from 'react';
import { X, Sliders, RotateCcw, Landmark, Building2, Check } from 'lucide-react';
import { TenantConfig, TenantId } from '../types';
import { DEFAULT_TENANTS } from '../services/policyEngine';

interface PolicyConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantConfig: TenantConfig;
  onUpdateConfig: (updated: TenantConfig) => void;
  onSwitchTenant: (id: TenantId) => void;
}

export const PolicyConfigModal: React.FC<PolicyConfigModalProps> = ({
  isOpen,
  onClose,
  tenantConfig,
  onUpdateConfig,
  onSwitchTenant,
}) => {
  if (!isOpen) return null;

  const handleThresholdChange = (key: 'allowMax' | 'verifyMax' | 'escalateMax', val: number) => {
    onUpdateConfig({
      ...tenantConfig,
      thresholds: {
        ...tenantConfig.thresholds,
        [key]: val,
      },
    });
  };

  const handleWeightChange = (key: keyof TenantConfig['weights'], val: number) => {
    onUpdateConfig({
      ...tenantConfig,
      weights: {
        ...tenantConfig.weights,
        [key]: val,
      },
    });
  };

  const handleReset = () => {
    const original = DEFAULT_TENANTS[tenantConfig.id];
    if (original) {
      onUpdateConfig({ ...original });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full p-6 shadow-xl relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Multi-Tenant Policy Engine Configuration
              </h3>
              <p className="text-xs text-slate-500">
                Configure risk cutoffs and multi-modal signal weight distribution
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

        {/* Tenant Switcher */}
        <div className="mb-6">
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
            Select Active Tenant Profile:
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => onSwitchTenant('tenant-bank')}
              className={`p-3 rounded-xl border text-left flex items-start space-x-3 transition cursor-pointer ${
                tenantConfig.id === 'tenant-bank'
                  ? 'bg-amber-50/80 border-amber-300 text-slate-900 shadow-xs ring-2 ring-amber-400/20'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Landmark className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <div className="text-xs font-bold text-slate-900">Apex Trust Bank</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  High-Security Banking & Capital Transfer Policy
                </div>
              </div>
            </button>

            <button
              onClick={() => onSwitchTenant('tenant-enterprise')}
              className={`p-3 rounded-xl border text-left flex items-start space-x-3 transition cursor-pointer ${
                tenantConfig.id === 'tenant-enterprise'
                  ? 'bg-indigo-50/80 border-indigo-300 text-slate-900 shadow-xs ring-2 ring-indigo-400/20'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Building2 className="w-5 h-5 text-indigo-600 mt-0.5 shrink-0" />
              <div>
                <div className="text-xs font-bold text-slate-900">TechNova Global</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Enterprise PBX & Identity Management
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Enforcement Thresholds */}
        <div className="mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
            Enforcement Action Thresholds (0–100 Scale):
          </h4>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-emerald-700 font-semibold">ALLOW (Max Threshold):</span>
                <span className="font-mono text-slate-900 font-bold">≤ {tenantConfig.thresholds.allowMax}</span>
              </div>
              <input
                type="range"
                min={10}
                max={45}
                value={tenantConfig.thresholds.allowMax}
                onChange={(e) => handleThresholdChange('allowMax', Number(e.target.value))}
                className="w-full accent-emerald-600"
              />
              <div className="text-[10px] text-slate-500">Score 0 to {tenantConfig.thresholds.allowMax} clears interaction without step-up.</div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-amber-700 font-semibold">VERIFY (Max Threshold):</span>
                <span className="font-mono text-slate-900 font-bold">≤ {tenantConfig.thresholds.verifyMax}</span>
              </div>
              <input
                type="range"
                min={tenantConfig.thresholds.allowMax + 5}
                max={70}
                value={tenantConfig.thresholds.verifyMax}
                onChange={(e) => handleThresholdChange('verifyMax', Number(e.target.value))}
                className="w-full accent-amber-500"
              />
              <div className="text-[10px] text-slate-500">Triggers simulated out-of-band push OTP verification.</div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-orange-700 font-semibold">PAUSE / ESCALATE (Max Threshold):</span>
                <span className="font-mono text-slate-900 font-bold">≤ {tenantConfig.thresholds.escalateMax}</span>
              </div>
              <input
                type="range"
                min={tenantConfig.thresholds.verifyMax + 5}
                max={90}
                value={tenantConfig.thresholds.escalateMax}
                onChange={(e) => handleThresholdChange('escalateMax', Number(e.target.value))}
                className="w-full accent-orange-500"
              />
              <div className="text-[10px] text-slate-500">Above {tenantConfig.thresholds.escalateMax} triggers immediate BLOCK.</div>
            </div>
          </div>
        </div>

        {/* Multi-Signal Weights */}
        <div className="mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
            Fusion Signal Weight Distribution:
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-700 font-medium">Deepfake Detection:</span>
                <span className="font-mono text-indigo-600 font-bold">{Math.round(tenantConfig.weights.deepfake * 100)}%</span>
              </div>
              <input
                type="range"
                min={0.05}
                max={0.50}
                step={0.05}
                value={tenantConfig.weights.deepfake}
                onChange={(e) => handleWeightChange('deepfake', Number(e.target.value))}
                className="w-full accent-indigo-600"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-700 font-medium">Speaker Mismatch:</span>
                <span className="font-mono text-indigo-600 font-bold">{Math.round(tenantConfig.weights.speaker * 100)}%</span>
              </div>
              <input
                type="range"
                min={0.05}
                max={0.40}
                step={0.05}
                value={tenantConfig.weights.speaker}
                onChange={(e) => handleWeightChange('speaker', Number(e.target.value))}
                className="w-full accent-indigo-600"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-700 font-medium">Replay / Channel:</span>
                <span className="font-mono text-indigo-600 font-bold">{Math.round(tenantConfig.weights.replay * 100)}%</span>
              </div>
              <input
                type="range"
                min={0.05}
                max={0.35}
                step={0.05}
                value={tenantConfig.weights.replay}
                onChange={(e) => handleWeightChange('replay', Number(e.target.value))}
                className="w-full accent-indigo-600"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-purple-700 font-medium">Conversation Gemini NLP:</span>
                <span className="font-mono text-purple-700 font-bold">{Math.round(tenantConfig.weights.nlp * 100)}%</span>
              </div>
              <input
                type="range"
                min={0.05}
                max={0.45}
                step={0.05}
                value={tenantConfig.weights.nlp}
                onChange={(e) => handleWeightChange('nlp', Number(e.target.value))}
                className="w-full accent-purple-600"
              />
            </div>

            <div className="sm:col-span-2">
              <div className="flex justify-between mb-1">
                <span className="text-amber-700 font-medium">Context & Policy Violations:</span>
                <span className="font-mono text-amber-700 font-bold">{Math.round(tenantConfig.weights.context * 100)}%</span>
              </div>
              <input
                type="range"
                min={0.05}
                max={0.35}
                step={0.05}
                value={tenantConfig.weights.context}
                onChange={(e) => handleWeightChange('context', Number(e.target.value))}
                className="w-full accent-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <button
            onClick={handleReset}
            className="px-3 py-1.5 rounded-lg text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1.5 transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset to Defaults
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            Save & Apply Policy
          </button>
        </div>
      </div>
    </div>
  );
};
