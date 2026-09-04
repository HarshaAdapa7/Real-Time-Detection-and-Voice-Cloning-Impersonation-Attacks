import React from 'react';
import { Database, UserCheck, Clock, ShieldAlert, PhoneForwarded, IndianRupee } from 'lucide-react';
import { ContextProfile, ContextSignalResult } from '../types';
import { ENROLLED_PROFILES } from '../data/contextDataset';

interface ContextEnginePanelProps {
  selectedProfile: ContextProfile;
  onSelectProfile: (profile: ContextProfile) => void;
  callerPhone: string;
  onChangeCallerPhone: (phone: string) => void;
  requestedAction: string;
  onChangeRequestedAction: (action: string) => void;
  requestedAmount: number;
  onChangeRequestedAmount: (amount: number) => void;
  isAfterHours: boolean;
  onToggleAfterHours: () => void;
  isSpoofedCallerId: boolean;
  onToggleSpoofedCallerId: () => void;
  contextResult: ContextSignalResult;
}

export const ContextEnginePanel: React.FC<ContextEnginePanelProps> = ({
  selectedProfile,
  onSelectProfile,
  callerPhone,
  onChangeCallerPhone,
  requestedAction,
  onChangeRequestedAction,
  requestedAmount,
  onChangeRequestedAmount,
  isAfterHours,
  onToggleAfterHours,
  isSpoofedCallerId,
  onToggleSpoofedCallerId,
  contextResult,
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-600">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              Layer 5: Context Engine
              <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded font-mono uppercase font-semibold">
                SIMULATED DATASET
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              Correlates caller ID, transaction limits, corporate directories & operating hours
            </p>
          </div>
        </div>

        <div className="text-right">
          <div className="text-[10px] uppercase text-slate-500 font-semibold">Context Risk</div>
          <div className={`text-base font-bold font-mono ${
            contextResult.contextRiskScore > 70 ? 'text-rose-600' : contextResult.contextRiskScore > 40 ? 'text-amber-600' : 'text-emerald-600'
          }`}>
            {contextResult.contextRiskScore}/100
          </div>
        </div>
      </div>

      {/* Profile Selector & Registered Ledger Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Claimed Identity Profile:
          </label>
          <select
            id="select-profile"
            value={selectedProfile.id}
            onChange={(e) => {
              const prof = ENROLLED_PROFILES.find((p) => p.id === e.target.value);
              if (prof) onSelectProfile(prof);
            }}
            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 shadow-2xs"
          >
            {ENROLLED_PROFILES.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — {p.role} ({p.department})
              </option>
            ))}
          </select>

          <div className="mt-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 text-[11px] text-slate-700 space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Registered Line:</span>
              <span className="font-mono text-indigo-600 font-semibold">{selectedProfile.phone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Standard Auth Limit:</span>
              <span className="font-mono text-emerald-700 font-semibold">₹{selectedProfile.typicalTransferLimit.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Operating Window:</span>
              <span className="font-mono text-slate-800">{selectedProfile.businessHoursStart}:00 - {selectedProfile.businessHoursEnd}:00 IST</span>
            </div>
          </div>
        </div>

        {/* Transaction & Action Details */}
        <div className="space-y-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Requested Sensitive Action:
            </label>
            <input
              id="input-action"
              type="text"
              value={requestedAction}
              onChange={(e) => onChangeRequestedAction(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 shadow-2xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Transaction Value (₹ INR):
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 text-xs">
                ₹
              </span>
              <input
                id="input-amount"
                type="number"
                value={requestedAmount}
                onChange={(e) => onChangeRequestedAmount(Number(e.target.value) || 0)}
                className="w-full bg-white border border-slate-200 rounded-lg pl-7 pr-3 py-1.5 text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 shadow-2xs"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Simulated Context Anomaly Injections */}
      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 mb-3">
        <div className="text-xs font-semibold text-slate-800 mb-2">
          Simulate Real-World Red-Team Anomalies:
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            id="btn-toggle-spoofed-cid"
            onClick={onToggleSpoofedCallerId}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${
              isSpoofedCallerId
                ? 'bg-rose-50 text-rose-700 border border-rose-300 font-semibold shadow-2xs'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 shadow-2xs'
            }`}
          >
            <PhoneForwarded className="w-3.5 h-3.5" />
            {isSpoofedCallerId ? 'Caller ID Mismatch (Active)' : 'Simulate Unregistered Line'}
          </button>

          <button
            id="btn-toggle-after-hours"
            onClick={onToggleAfterHours}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${
              isAfterHours
                ? 'bg-rose-50 text-rose-700 border border-rose-300 font-semibold shadow-2xs'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 shadow-2xs'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            {isAfterHours ? 'Off-Hours (23:45 IST Active)' : 'Simulate Late Night Call'}
          </button>
        </div>
      </div>

      {/* Triggered Context Flags */}
      <div className="space-y-1">
        {contextResult.flags.map((flag, idx) => (
          <div
            key={idx}
            className={`text-xs p-2 rounded-lg flex items-start gap-2 ${
              flag.includes('Mismatch') || flag.includes('Exceeded') || flag.includes('Off-Hours')
                ? 'bg-rose-50 border border-rose-200 text-rose-700'
                : 'bg-emerald-50 border border-emerald-200 text-emerald-700'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <span>{flag}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
