/**
 * Layer 5: Context Engine Signal
 *
 * REAL VS SIMULATED STATUS: [SIMULATED DATASET & RULES]
 * In a production architecture, this connects to the core banking ledger (CBS),
 * Active Directory / HRMS database, and PBX CDR records to determine if the caller-employee
 * pair, calling time, geography, device SIM, and transaction request exceed baseline profiles.
 *
 * For this prototype, it queries an in-memory simulated dataset of corporate employees
 * and transaction policies to compute a contextual risk score (0-100).
 */

import { ContextProfile, ContextSignalResult } from '../types';

export function evaluateContextRisk(
  claimedProfile: ContextProfile,
  callerPhone: string,
  requestedAction: string,
  requestedAmount = 0,
  currentHour = new Date().getHours()
): ContextSignalResult {
  let contextRisk = 10;
  const flags: string[] = [];

  // Check 1: Phone Number match with registered directory
  const cleanIncoming = callerPhone.replace(/[^0-9]/g, '');
  const cleanRegistered = claimedProfile.phone.replace(/[^0-9]/g, '');
  const isPhoneMismatch = !cleanIncoming.endsWith(cleanRegistered.slice(-10));

  if (isPhoneMismatch) {
    contextRisk += 35;
    flags.push(`Caller ID Mismatch: Call originating from unregistered line (${callerPhone}) instead of ${claimedProfile.phone}`);
  } else {
    flags.push(`Caller ID matches registered device on record (${claimedProfile.phone})`);
  }

  // Check 2: Outside normal business hours
  const isAfterHours = currentHour < claimedProfile.businessHoursStart || currentHour >= claimedProfile.businessHoursEnd;
  if (isAfterHours) {
    contextRisk += 25;
    flags.push(`Off-Hours Transaction: Call initiated outside operating window (${claimedProfile.businessHoursStart}:00 - ${claimedProfile.businessHoursEnd}:00 IST)`);
  }

  // Check 3: Transaction amount vs historical limit
  const isHighValue = requestedAmount > claimedProfile.typicalTransferLimit;
  if (isHighValue) {
    const ratio = Math.round((requestedAmount / claimedProfile.typicalTransferLimit) * 10) / 10;
    contextRisk += 30;
    flags.push(`Amount Threshold Exceeded: Requested ₹${requestedAmount.toLocaleString('en-IN')} is ${ratio}x higher than standard authorization ceiling (₹${claimedProfile.typicalTransferLimit.toLocaleString('en-IN')})`);
  }

  // Check 4: High risk action keywords
  const actionLower = requestedAction.toLowerCase();
  if (actionLower.includes("bypass") || actionLower.includes("emergency") || actionLower.includes("wire") || actionLower.includes("overseas")) {
    contextRisk += 15;
    flags.push("High-risk action pattern: Request demands immediate funds dispatch or authorization override");
  }

  const clampedRisk = Math.min(Math.max(contextRisk, 5), 98);

  return {
    callerPhone,
    claimedIdentity: claimedProfile.name,
    claimedRole: claimedProfile.role,
    requestedAction,
    requestedAmount,
    contextRiskScore: clampedRisk,
    flags,
    isAfterHours,
    isHighValue,
    isSimulated: true,
  };
}
