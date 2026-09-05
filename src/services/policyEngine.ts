/**
 * Layer 7: Policy Engine
 *
 * REAL VS SIMULATED STATUS: [REAL POLICY ENGINE WITH MULTI-TENANT THRESHOLDS]
 * Maps the 0-100 fused risk score to active enforcement decisions based on
 * per-tenant threshold configurations.
 *
 * Default Tenants:
 * 1. Apex Trust Bank (Strict Financial Institution)
 * 2. TechNova Global (Enterprise Operations)
 */

import { PolicyDecision, TenantConfig, TenantId, TrustAction } from '../types';

export const DEFAULT_TENANTS: Record<TenantId, TenantConfig> = {
  'tenant-bank': {
    id: 'tenant-bank',
    name: 'Apex Trust Bank (Core Banking / High Security)',
    type: 'Banking & Financial',
    description: 'Ultra-strict policy tuned for high-value financial transfers, RTGS authorizations, and customer accounts.',
    thresholds: {
      allowMax: 25,
      verifyMax: 55,
      escalateMax: 75,
    },
    weights: {
      deepfake: 0.35,
      speaker: 0.20,
      replay: 0.15,
      nlp: 0.20,
      context: 0.10,
    },
    simulatedStepUps: {
      ALLOW: 'Clearance Granted: Interaction authorized for immediate execution.',
      VERIFY: 'Simulated Step-Up: Dispatching cryptographic MFA OTP to account holder registered mobile SIM.',
      PAUSE_ESCALATE: 'Simulated Escalation: Out-of-band telephone callback scheduled via independent secure PBX trunk line.',
      BLOCK: 'Simulated Threat Containment: Core Banking ledger lock triggered; transaction frozen; Priority-1 SOC Alert dispatched.',
    },
  },
  'tenant-enterprise': {
    id: 'tenant-enterprise',
    name: 'TechNova Global (Enterprise IT & Operations)',
    type: 'Enterprise Operations',
    description: 'Balanced policy for internal corporate comms, IT service desk password resets, and vendor approvals.',
    thresholds: {
      allowMax: 35,
      verifyMax: 65,
      escalateMax: 85,
    },
    weights: {
      deepfake: 0.25,
      speaker: 0.20,
      replay: 0.15,
      nlp: 0.25,
      context: 0.15,
    },
    simulatedStepUps: {
      ALLOW: 'Clearance Granted: Enterprise task authorized.',
      VERIFY: 'Simulated Step-Up: Enterprise Slack / SSO 2-Factor push prompt required to proceed.',
      PAUSE_ESCALATE: 'Simulated Escalation: Transferring call to Senior IT Security Officer; secondary supervisor sign-off needed.',
      BLOCK: 'Simulated Threat Containment: Employee directory credentials provisionally suspended; SOC red-team incident logged.',
    },
  },
};

export function evaluatePolicy(
  fusedRiskScore: number,
  tenantConfig: TenantConfig,
  circuitBreakerRule?: string
): PolicyDecision {
  const { thresholds, simulatedStepUps } = tenantConfig;

  let action: TrustAction;
  let ruleText: string;

  if (circuitBreakerRule) {
    // Critical Threat Circuit-Breaker overrides standard allow/verify
    action = fusedRiskScore >= 85 ? 'BLOCK' : 'PAUSE_ESCALATE';
    ruleText = circuitBreakerRule;
  } else if (fusedRiskScore <= thresholds.allowMax) {
    action = 'ALLOW';
    ruleText = `Risk (${fusedRiskScore}) ≤ Allow Threshold (${thresholds.allowMax})`;
  } else if (fusedRiskScore <= thresholds.verifyMax) {
    action = 'VERIFY';
    ruleText = `Allow (${thresholds.allowMax}) < Risk (${fusedRiskScore}) ≤ Verify Threshold (${thresholds.verifyMax})`;
  } else if (fusedRiskScore <= thresholds.escalateMax) {
    action = 'PAUSE_ESCALATE';
    ruleText = `Verify (${thresholds.verifyMax}) < Risk (${fusedRiskScore}) ≤ Escalate Threshold (${thresholds.escalateMax})`;
  } else {
    action = 'BLOCK';
    ruleText = `Risk (${fusedRiskScore}) > Escalate Threshold (${thresholds.escalateMax})`;
  }

  const riskLevel =
    fusedRiskScore <= 25 ? 'LOW' :
    fusedRiskScore <= 55 ? 'MEDIUM' :
    fusedRiskScore <= 75 ? 'HIGH' : 'CRITICAL';

  return {
    action,
    riskLevel,
    stepUpAction: simulatedStepUps[action],
    tenantId: tenantConfig.id,
    tenantName: tenantConfig.name,
    triggeredThresholdRule: ruleText,
    criticalOverrideRule: circuitBreakerRule,
    circuitBreakerActive: Boolean(circuitBreakerRule),
  };
}
