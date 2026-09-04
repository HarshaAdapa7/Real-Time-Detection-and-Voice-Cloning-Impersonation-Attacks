import React, { useState } from 'react';
import {
  History,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Ban,
  Download,
  Trash2,
  Search,
  Filter,
  Database,
  RefreshCw,
  HardDrive,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { AuditRecord, TrustAction, DbStatus } from '../types';

interface AuditLogViewProps {
  records: AuditRecord[];
  onClearLog: () => void;
  dbStatus?: DbStatus | null;
  onRefreshLogs?: () => void;
  onInitSchema?: () => Promise<void>;
  isInitializingSchema?: boolean;
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({
  records,
  onClearLog,
  dbStatus,
  onRefreshLogs,
  onInitSchema,
  isInitializingSchema = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState<string>('ALL');

  const filteredRecords = records.filter((r) => {
    const matchesSearch =
      r.caller.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.claimedTarget.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.requestedAction.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesAction = filterAction === 'ALL' || r.decision === filterAction;
    return matchesSearch && matchesAction;
  });

  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(records, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `voice-trust-firewall-audit-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getDecisionBadge = (decision: TrustAction) => {
    switch (decision) {
      case 'ALLOW':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            ALLOW
          </span>
        );
      case 'VERIFY':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            VERIFY
          </span>
        );
      case 'PAUSE_ESCALATE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200">
            <ShieldAlert className="w-3 h-3 text-orange-600" />
            ESCALATE
          </span>
        );
      case 'BLOCK':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <Ban className="w-3 h-3 text-rose-600" />
            BLOCK
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs mb-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-100">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600">
            <History className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              Layer 8 & Security Audit Log
              <span className="text-xs font-mono font-normal text-slate-500">
                ({filteredRecords.length} records)
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              Tamper-evident log of past interactions, multi-signal evidence weights, and policy decisions
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onRefreshLogs && (
            <button
              id="btn-refresh-audit"
              onClick={onRefreshLogs}
              className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium border border-slate-200 shadow-2xs flex items-center gap-1.5 transition cursor-pointer"
              title="Refresh records from database"
            >
              <RefreshCw className="w-3.5 h-3.5 text-indigo-600" />
              Refresh
            </button>
          )}
          <button
            id="btn-export-audit"
            onClick={handleExportJSON}
            className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium border border-slate-200 shadow-2xs flex items-center gap-1.5 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export JSON
          </button>
          <button
            id="btn-clear-audit"
            onClick={onClearLog}
            className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-medium border border-rose-200 shadow-2xs flex items-center gap-1.5 transition cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear
          </button>
        </div>
      </div>

      {/* PostgreSQL Database & Schemas Integration Banner */}
      <div className="mb-5 p-4 rounded-xl bg-slate-50 border border-slate-200">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center space-x-3">
            <div className={`p-2 rounded-lg border shrink-0 ${
              dbStatus?.connected
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : dbStatus?.configured
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-indigo-50 text-indigo-700 border-indigo-200'
            }`}>
              <Database className="w-5 h-5" />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-slate-900">PostgreSQL Database Storage:</span>
                {dbStatus?.connected ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Supabase Connected ({dbStatus.host})
                  </span>
                ) : dbStatus?.configured ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                    <AlertCircle className="w-3 h-3 text-amber-600" />
                    Connecting to {dbStatus.host}...
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-200 text-slate-700 border border-slate-300">
                    <HardDrive className="w-3 h-3 text-slate-500" />
                    In-Memory Mode (DATABASE_URL pending)
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-600 mt-0.5">
                {dbStatus?.message || 'Database schema engine ready for evaluation payloads and tenant configurations.'}
              </p>
            </div>
          </div>

          {/* Database Schemas & Action */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-600 bg-white border border-slate-200 px-2.5 py-1 rounded-lg shadow-2xs">
              <span>Tables:</span>
              <span className="text-indigo-600 font-bold" title="Voice Evaluations Table">
                evaluations ({dbStatus?.tables?.voice_evaluations ?? records.length})
              </span>
              <span>•</span>
              <span className="text-slate-800 font-semibold" title="Tenant Policies Table">
                policies ({dbStatus?.tables?.tenant_policies ?? 2})
              </span>
              <span>•</span>
              <span className="text-slate-800 font-semibold" title="Enrolled Identities Table">
                identities ({dbStatus?.tables?.enrolled_identities ?? 4})
              </span>
            </div>

            {onInitSchema && (
              <button
                id="btn-init-db-schema"
                onClick={onInitSchema}
                disabled={isInitializingSchema}
                className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium shadow-2xs flex items-center gap-1.5 transition cursor-pointer disabled:opacity-60"
              >
                <RefreshCw className={`w-3 h-3 ${isInitializingSchema ? 'animate-spin' : ''}`} />
                {isInitializingSchema ? 'Migrating Schemas...' : 'Initialize Schemas'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            id="input-audit-search"
            type="text"
            placeholder="Search by caller, identity, or action..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          <select
            id="select-audit-filter"
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs"
          >
            <option value="ALL">All Decisions</option>
            <option value="ALLOW">Allow Only</option>
            <option value="VERIFY">Verify Only</option>
            <option value="PAUSE_ESCALATE">Escalate Only</option>
            <option value="BLOCK">Block Only</option>
          </select>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-2xs">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
            <tr>
              <th className="py-3 px-4">Timestamp & Caller</th>
              <th className="py-3 px-4">Claimed Identity</th>
              <th className="py-3 px-4">Requested Action</th>
              <th className="py-3 px-4 text-center">Risk Score</th>
              <th className="py-3 px-4">Decision</th>
              <th className="py-3 px-4">Per-Signal Scores</th>
              <th className="py-3 px-4">Step-Up Action Taken</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {filteredRecords.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">
                  No evaluation records matching filter criteria.
                </td>
              </tr>
            ) : (
              filteredRecords.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50 transition">
                  <td className="py-3 px-4 font-mono text-slate-500">
                    <div className="text-slate-900 font-semibold">{r.caller}</div>
                    <div className="text-[10px] text-slate-400">{r.timestamp}</div>
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-900">
                    {r.claimedTarget}
                    <div className="text-[10px] text-slate-500">{r.tenantName}</div>
                  </td>
                  <td className="py-3 px-4 text-slate-600 max-w-xs truncate" title={r.requestedAction}>
                    {r.requestedAction}
                  </td>
                  <td className="py-3 px-4 text-center font-mono">
                    <span className={`px-2 py-0.5 rounded font-bold ${
                      r.finalRiskScore > 75 ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                      r.finalRiskScore > 55 ? 'bg-orange-50 text-orange-700 border border-orange-200' :
                      r.finalRiskScore > 25 ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}>
                      {r.finalRiskScore}
                    </span>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    {getDecisionBadge(r.decision)}
                  </td>
                  <td className="py-3 px-4 text-[10px] font-mono space-y-0.5 whitespace-nowrap">
                    <div>DF: <span className="text-amber-700 font-semibold">{r.breakdown.deepfake}%</span> | SP: <span className="text-amber-700 font-semibold">{r.breakdown.speakerMismatch}%</span></div>
                    <div>NLP: <span className="text-purple-700 font-semibold">{r.breakdown.nlp}%</span> | CTX: <span className="text-indigo-700 font-semibold">{r.breakdown.context}%</span></div>
                  </td>
                  <td className="py-3 px-4 text-[11px] text-slate-600 max-w-xs truncate" title={r.stepUpAction}>
                    {r.stepUpAction}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
