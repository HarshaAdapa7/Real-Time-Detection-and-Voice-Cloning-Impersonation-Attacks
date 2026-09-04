import React from 'react';
import { Shield, Building2, Landmark, Info, Sliders, History, Code2 } from 'lucide-react';
import { TenantConfig, TenantId } from '../types';

interface HeaderProps {
  currentTenant: TenantConfig;
  onSelectTenant: (tenantId: TenantId) => void;
  onOpenPolicyConfig: () => void;
  onOpenAuditLog: () => void;
  onOpenDisclosures: () => void;
  onOpenApiInspector: () => void;
  activeTab: 'firewall' | 'api' | 'audit';
  setActiveTab: (tab: 'firewall' | 'api' | 'audit') => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTenant,
  onSelectTenant,
  onOpenPolicyConfig,
  onOpenDisclosures,
  activeTab,
  setActiveTab,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 text-slate-900 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Title & Brand */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center shadow-xs text-white">
            <Shield className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 flex items-center gap-2">
                Real-Time Voice Trust Firewall
                <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  SIH Prototype
                </span>
              </h1>
            </div>
            <p className="text-xs text-slate-500">
              Multi-signal authenticity, conversation intent & context evaluation for sensitive action authorization
            </p>
          </div>
        </div>

        {/* Action Controls & Navigation */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Main View Tabs */}
          <div className="bg-slate-100 p-1 rounded-lg border border-slate-200/80 flex text-xs">
            <button
              id="nav-tab-firewall"
              onClick={() => setActiveTab('firewall')}
              className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                activeTab === 'firewall'
                  ? 'bg-white text-slate-900 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              Firewall Pipeline
            </button>
            <button
              id="nav-tab-api"
              onClick={() => setActiveTab('api')}
              className={`px-3 py-1.5 rounded-md font-medium transition-all flex items-center gap-1.5 ${
                activeTab === 'api'
                  ? 'bg-white text-slate-900 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              API & REST
            </button>
            <button
              id="nav-tab-audit"
              onClick={() => setActiveTab('audit')}
              className={`px-3 py-1.5 rounded-md font-medium transition-all flex items-center gap-1.5 ${
                activeTab === 'audit'
                  ? 'bg-white text-slate-900 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              Audit Log
            </button>
          </div>

          {/* Tenant Selector */}
          <div className="flex items-center space-x-1.5 bg-slate-100/80 border border-slate-200 px-2 py-1 rounded-lg">
            <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Tenant:</span>
            <button
              id="tenant-btn-bank"
              onClick={() => onSelectTenant('tenant-bank')}
              className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1 transition-all ${
                currentTenant.id === 'tenant-bank'
                  ? 'bg-amber-100 text-amber-900 border border-amber-300 font-semibold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Apex Trust Bank (Strict Policy)"
            >
              <Landmark className="w-3.5 h-3.5 text-amber-600" />
              Bank
            </button>
            <button
              id="tenant-btn-enterprise"
              onClick={() => onSelectTenant('tenant-enterprise')}
              className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1 transition-all ${
                currentTenant.id === 'tenant-enterprise'
                  ? 'bg-blue-100 text-blue-900 border border-blue-300 font-semibold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="TechNova Global (Enterprise Comms)"
            >
              <Building2 className="w-3.5 h-3.5 text-blue-600" />
              Enterprise
            </button>
          </div>

          {/* Policy Config Trigger */}
          <button
            id="btn-policy-settings"
            onClick={onOpenPolicyConfig}
            className="p-2 rounded-lg bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200 shadow-2xs transition"
            title="Configure Tenant Thresholds & Fusion Weights"
          >
            <Sliders className="w-4 h-4" />
          </button>

          {/* Real vs Simulated Disclosures */}
          <button
            id="btn-real-simulated-modal"
            onClick={onOpenDisclosures}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-800 hover:bg-emerald-100 transition text-xs font-semibold shadow-2xs"
            title="View Real vs. Simulated Architecture Breakdown"
          >
            <Info className="w-3.5 h-3.5 text-emerald-600" />
            <span>Real vs. Simulated</span>
          </button>
        </div>
      </div>
    </header>
  );
};
