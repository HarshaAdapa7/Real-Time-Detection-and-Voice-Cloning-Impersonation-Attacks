import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle, Ban, ArrowRight, CheckCircle2, RotateCcw, Target } from 'lucide-react';
import { PolicyDecision, RiskFusionResult, TenantConfig, PreloadedScenario } from '../types';

interface RiskDecisionGaugeProps {
  fusionResult: RiskFusionResult;
  policyDecision: PolicyDecision;
  currentTenant: TenantConfig;
  onSimulateResolveStepUp: () => void;
  stepUpResolved: boolean;
  selectedScenario?: PreloadedScenario | null;
}

export const RiskDecisionGauge: React.FC<RiskDecisionGaugeProps> = ({
  fusionResult,
  policyDecision,
  currentTenant,
  onSimulateResolveStepUp,
  stepUpResolved,
  selectedScenario,
}) => {
  const [simulatedOtpInput, setSimulatedOtpInput] = useState('');
  const [otpError, setOtpError] = useState(false);

  const { finalRiskScore, dominantRiskFactor, formulaString } = fusionResult;
  const { action, riskLevel, stepUpAction } = policyDecision;

  const getDecisionTheme = (act: string) => {
    switch (act) {
      case 'ALLOW':
        return {
          bg: 'bg-emerald-50/80 border-emerald-200 text-emerald-950',
          badge: 'bg-emerald-600 text-white',
          gaugeColor: '#059669',
          icon: ShieldCheck,
          label: 'AUTHORIZE & ALLOW',
          desc: 'Low aggregate risk. Interaction authenticated and safe for transaction completion.',
        };
      case 'VERIFY':
        return {
          bg: 'bg-amber-50/80 border-amber-200 text-amber-950',
          badge: 'bg-amber-500 text-white',
          gaugeColor: '#d97706',
          icon: AlertTriangle,
          label: 'STEP-UP VERIFICATION REQUIRED',
          desc: 'Moderate risk detected. Action gated pending secondary out-of-band factor.',
        };
      case 'PAUSE_ESCALATE':
        return {
          bg: 'bg-orange-50/80 border-orange-200 text-orange-950',
          badge: 'bg-orange-500 text-white',
          gaugeColor: '#ea580c',
          icon: ShieldAlert,
          label: 'PAUSE & ESCALATE TO SUPERVISOR',
          desc: 'High threat pattern. Automatic hold engaged; human verification callback dispatched.',
        };
      case 'BLOCK':
      default:
        return {
          bg: 'bg-rose-50/80 border-rose-200 text-rose-950',
          badge: 'bg-rose-600 text-white',
          gaugeColor: '#e11d48',
          icon: Ban,
          label: 'REJECT & BLOCK INTERACTION',
          desc: 'Critical fraud threshold exceeded. Transaction halted; SOC incident ticket logged.',
        };
    }
  };

  const theme = getDecisionTheme(action);
  const ActionIcon = theme.icon;

  // Calculate circular SVG progress
  const radius = 68;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (finalRiskScore / 100) * circumference;

  const handleVerifyOtp = () => {
    if (simulatedOtpInput.trim().length >= 4) {
      setOtpError(false);
      onSimulateResolveStepUp();
    } else {
      setOtpError(true);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            Layers 6, 7 & 8: Risk Fusion & Policy Engine
            <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded font-mono uppercase font-semibold">
              REAL MATH & POLICY
            </span>
          </h3>
          <p className="text-xs text-slate-500">
            Tenant: <strong className="text-slate-800">{currentTenant.name.split('(')[0]}</strong>
          </p>
        </div>

        <span className={`text-xs font-bold font-mono px-2.5 py-1 rounded-full uppercase ${
          riskLevel === 'CRITICAL' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
          riskLevel === 'HIGH' ? 'bg-orange-50 text-orange-700 border border-orange-200' :
          riskLevel === 'MEDIUM' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
          'bg-emerald-50 text-emerald-700 border border-emerald-200'
        }`}>
          {riskLevel} RISK
        </span>
      </div>

      {/* Main Gauge & Decision Showcase */}
      <div className="py-5 flex flex-col sm:flex-row items-center justify-around gap-6">
        {/* Radial Risk Gauge */}
        <div className="relative flex items-center justify-center">
          <svg className="w-40 h-40 transform -rotate-90">
            {/* Background ring */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              stroke="#e2e8f0"
              strokeWidth="12"
              fill="transparent"
            />
            {/* Value ring */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              stroke={theme.gaugeColor}
              strokeWidth="12"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-700 ease-out"
            />
          </svg>

          {/* Central Score Text */}
          <div className="absolute flex flex-col items-center justify-center text-center">
            <span className="text-3xl font-extrabold font-mono tracking-tight text-slate-900">
              {finalRiskScore}
            </span>
            <span className="text-[11px] font-semibold uppercase text-slate-500">
              Risk Score
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              / 100
            </span>
          </div>
        </div>

        {/* Action Decision Card */}
        <div className={`flex-1 w-full p-4 rounded-xl border ${theme.bg} shadow-2xs`}>
          <div className="flex items-center space-x-2.5 mb-2">
            <div className={`p-2 rounded-lg ${theme.badge} shadow-xs`}>
              <ActionIcon className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-600">
                Policy Enforcement Action:
              </span>
              <div className="text-base font-extrabold tracking-wide text-slate-900">
                {theme.label}
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-700 leading-relaxed mb-3">
            {theme.desc}
          </p>

          <div className="text-[11px] p-2 rounded bg-white/80 border border-slate-200/80 font-mono text-slate-800 shadow-2xs">
            <span className="text-slate-500">Trigger Rule: </span>
            {policyDecision.triggeredThresholdRule}
          </div>
        </div>
      </div>

      {/* Layer 8: Prevention / Step-Up Action Box */}
      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 mb-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
            Layer 8: Active Prevention & Step-Up Control (Simulated):
          </span>
          <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded font-mono uppercase font-semibold">
            SIMULATED OUTBOUND
          </span>
        </div>

        <p className="text-xs text-slate-800 mb-3 font-mono bg-white p-2.5 rounded border border-slate-200 shadow-2xs">
          {stepUpAction}
        </p>

        {/* Interactive Step-Up Simulation */}
        {action === 'VERIFY' && (
          <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg">
            <div className="text-xs text-amber-900 font-medium mb-2">
              {stepUpResolved
                ? 'Step-Up Passed: Customer confirmed via simulated Out-of-Band Push OTP.'
                : 'Simulate Customer Verification Response:'}
            </div>
            {stepUpResolved ? (
              <div className="flex items-center gap-2 text-xs text-emerald-700 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Verification Succeeded. Final authorization granted.</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  id="input-sim-otp"
                  type="text"
                  maxLength={6}
                  placeholder="Enter 6-digit OTP (e.g. 582914)"
                  value={simulatedOtpInput}
                  onChange={(e) => setSimulatedOtpInput(e.target.value)}
                  className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 w-48 shadow-2xs"
                />
                <button
                  id="btn-submit-otp"
                  onClick={handleVerifyOtp}
                  className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs transition cursor-pointer shadow-xs"
                >
                  Verify OTP
                </button>
              </div>
            )}
            {otpError && (
              <div className="text-[11px] text-rose-600 font-medium mt-1">Please enter at least 4 digits.</div>
            )}
          </div>
        )}

        {action === 'PAUSE_ESCALATE' && (
          <div className="p-3 bg-orange-50/70 border border-orange-200 rounded-lg">
            <div className="text-xs text-orange-950 font-medium mb-2">
              {stepUpResolved
                ? 'Escalation Cleared: Supervisor reviewed audit and authenticated voice via independent landline.'
                : 'Simulate Supervisor Callback Override:'}
            </div>
            {stepUpResolved ? (
              <div className="flex items-center gap-2 text-xs text-emerald-700 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Supervisor Override Authorized.</span>
              </div>
            ) : (
              <button
                id="btn-simulate-callback"
                onClick={onSimulateResolveStepUp}
                className="px-3.5 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-semibold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Simulate Secure Landline Callback Confirmation
              </button>
            )}
          </div>
        )}

        {action === 'BLOCK' && (
          <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center justify-between">
            <span>Critical Threat Blocked: Telephony SIP session terminated. Incident ticket #INC-9481 logged to Bank SOC.</span>
          </div>
        )}

        {/* Test Case Ground-Truth Verification Match */}
        {selectedScenario?.expectedDecision && (
          <div className={`p-2.5 rounded-lg border text-xs flex items-center justify-between gap-2 ${
            action === selectedScenario.expectedDecision
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}>
            <div className="flex items-center gap-2">
              <Target className={`w-3.5 h-3.5 ${action === selectedScenario.expectedDecision ? 'text-emerald-600' : 'text-amber-600'}`} />
              <span>
                <strong>Test Target:</strong> Expected <code className="font-mono font-bold px-1 bg-white/80 rounded border border-slate-200">{selectedScenario.expectedDecision}</code> vs Actual <code className="font-mono font-bold px-1 bg-white/80 rounded border border-slate-200">{action}</code>
              </span>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full font-mono uppercase shrink-0 ${
              action === selectedScenario.expectedDecision
                ? 'bg-emerald-600 text-white'
                : 'bg-amber-500 text-white'
            }`}>
              {action === selectedScenario.expectedDecision ? '✓ TEST PASSED' : 'DISCREPANCY'}
            </span>
          </div>
        )}
      </div>

      {/* Fusion Math & Dominant Factor */}
      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-[11px] space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-slate-500 font-medium">Dominant Threat Vector:</span>
          <span className="font-semibold text-rose-600">{dominantRiskFactor}</span>
        </div>
        <div className="text-slate-500 font-mono text-[10px] truncate" title={formulaString}>
          {formulaString}
        </div>
      </div>
    </div>
  );
};
