/**
 * Real-Time Spoken Sector & Domain Classifier
 *
 * Automatically detects the sector/industry domain from live conversation transcript
 * without requiring manual user selection or configuration.
 *
 * Automatically tunes policy sensitivity, fraud indicators, and risk weights.
 */

export interface DetectedSector {
  id: string;
  name: string;
  shortCode: string;
  icon: string;
  color: string;
  badgeClass: string;
  confidence: number;
  matchedKeywords: string[];
  recommendedAction: string;
  policyFocus: string;
  defaultWeights: {
    deepfake: number;
    speaker: number;
    speakerMismatch?: number;
    replay: number;
    nlp: number;
    context: number;
  };
}

export const SECTOR_DEFINITIONS: Record<string, {
  name: string;
  shortCode: string;
  icon: string;
  color: string;
  badgeClass: string;
  policyFocus: string;
  recommendedAction: string;
  defaultWeights: {
    deepfake: number;
    speaker: number;
    speakerMismatch?: number;
    replay: number;
    nlp: number;
    context: number;
  };
  keywords: Array<{ pattern: RegExp; weight: number; label: string }>;
}> = {
  BANKING_FINANCIAL: {
    name: "Banking & Financial Services (BFSI)",
    shortCode: "BFSI",
    icon: "Landmark",
    color: "#0284c7",
    badgeClass: "bg-sky-50 text-sky-800 border-sky-300",
    policyFocus: "Strict fund transfer limits, beneficiary validation, and dual-authorization",
    recommendedAction: "Verify account number with registered bank records",
    defaultWeights: {
      deepfake: 0.25,
      speaker: 0.25,
      speakerMismatch: 0.25,
      replay: 0.15,
      nlp: 0.20,
      context: 0.15,
    },
    keywords: [
      { pattern: /\b(bank|account|neft|rtgs|imps|upi|ifsc|balance|cheque|branch|deposit|withdrawal|overdraft|fixed deposit)\b/i, weight: 3, label: "Banking operations" },
      { pattern: /\b(credit card|debit card|cvv|expiry date|atm|pin|card limit|chargeback)\b/i, weight: 4, label: "Card credentials" },
      { pattern: /\b(wire transfer|fund transfer|send money|beneficiary|remittance|rupees|lakh|crore)\b/i, weight: 3, label: "Fund movement" },
      { pattern: /\b(passbook|statement|kyc update|pan linking|cibil)\b/i, weight: 2, label: "Account maintenance" },
    ],
  },
  CORPORATE_TREASURY: {
    name: "Corporate Treasury & Executive Office",
    shortCode: "EXEC",
    icon: "Briefcase",
    color: "#7c3aed",
    badgeClass: "bg-purple-50 text-purple-800 border-purple-300",
    policyFocus: "High-value executive wire fraud (CEO/CFO impersonation) and unauthorized invoice redirection",
    recommendedAction: "Enforce secondary out-of-band video or multi-signatory approval",
    defaultWeights: {
      deepfake: 0.35,
      speaker: 0.30,
      speakerMismatch: 0.30,
      replay: 0.10,
      nlp: 0.15,
      context: 0.10,
    },
    keywords: [
      { pattern: /\b(ceo|cfo|director|board meeting|managing director|president|vp|partner)\b/i, weight: 4, label: "Executive role" },
      { pattern: /\b(acquisition|merger|confidential deal|nda|project alpha|secret acquisition)\b/i, weight: 4, label: "Corporate deal" },
      { pattern: /\b(vendor invoice|supplier payment|purchase order|procurement|billing account change)\b/i, weight: 3, label: "Vendor accounts" },
      { pattern: /\b(do not discuss with anyone|bypass normal channels|emergency transfer|sign off immediately)\b/i, weight: 4, label: "Executive pressure" },
    ],
  },
  TELECOM_CARRIER: {
    name: "Telecom & Mobile Infrastructure",
    shortCode: "TELCO",
    icon: "Antenna",
    color: "#ea580c",
    badgeClass: "bg-orange-50 text-orange-800 border-orange-300",
    policyFocus: "SIM swap attack prevention, eSIM unauthorized activation, and caller spoofing",
    recommendedAction: "Require in-person biometric scan or registered alternate contact",
    defaultWeights: {
      deepfake: 0.25,
      speaker: 0.30,
      speakerMismatch: 0.30,
      replay: 0.20,
      nlp: 0.15,
      context: 0.10,
    },
    keywords: [
      { pattern: /\b(sim|esim|sim swap|sim card|duplicate sim|network|carrier|telecom|airtel|jio|vi|bsnl)\b/i, weight: 4, label: "SIM card services" },
      { pattern: /\b(mobile number|phone blocked|puk code|roaming|call forwarding|sms stopped)\b/i, weight: 3, label: "Telecom routing" },
      { pattern: /\b(kyc verification for mobile|disconnect line|tower signal|recharge)\b/i, weight: 2, label: "Mobile KYC" },
    ],
  },
  GOVERNMENT_LAW_ENFORCEMENT: {
    name: "Government, Tax & Law Enforcement",
    shortCode: "GOVT",
    icon: "ShieldAlert",
    color: "#dc2626",
    badgeClass: "bg-rose-50 text-rose-800 border-rose-300",
    policyFocus: "Digital arrest extortion, fake CBI/ED court warrants, and intimidation scams",
    recommendedAction: "Immediate call termination and alert law enforcement helpline (1930)",
    defaultWeights: {
      deepfake: 0.30,
      speaker: 0.15,
      speakerMismatch: 0.15,
      replay: 0.15,
      nlp: 0.30,
      context: 0.10,
    },
    keywords: [
      { pattern: /\b(police|cbi|ed|enforcement directorate|customs|narcotics|crime branch|cyber cell)\b/i, weight: 5, label: "Law enforcement" },
      { pattern: /\b(digital arrest|arrest warrant|court order|supreme court|high court|summons|fir)\b/i, weight: 5, label: "Legal intimidation" },
      { pattern: /\b(income tax|it department|tax penalty|aadhaar suspension|passport seized|parcel seizure)\b/i, weight: 4, label: "Government agency" },
      { pattern: /\b(illegal parcel|drugs found|money laundering case|pay fine to avoid arrest)\b/i, weight: 5, label: "Extortion claim" },
    ],
  },
  ENTERPRISE_IT: {
    name: "Enterprise IT & Cyber Helpdesk",
    shortCode: "IT",
    icon: "Terminal",
    color: "#059669",
    badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-300",
    policyFocus: "Credential harvesting, MFA fatigue exploitation, and unauthorized access resets",
    recommendedAction: "Verify caller through internal Slack/Teams identity verification loop",
    defaultWeights: {
      deepfake: 0.30,
      speaker: 0.25,
      speakerMismatch: 0.25,
      replay: 0.15,
      nlp: 0.20,
      context: 0.10,
    },
    keywords: [
      { pattern: /\b(password reset|login issue|vpn|active directory|ldap|sso|okta|azure ad)\b/i, weight: 4, label: "Authentication systems" },
      { pattern: /\b(it helpdesk|it support|admin access|sudo|remote desktop|teamviewer|anydesk)\b/i, weight: 3, label: "Remote admin" },
      { pattern: /\b(mfa token|authenticator code|duo push|security question|yubikey)\b/i, weight: 4, label: "MFA credentials" },
    ],
  },
  HEALTHCARE_INSURANCE: {
    name: "Healthcare & Medical Insurance",
    shortCode: "HEALTH",
    icon: "HeartPulse",
    color: "#0891b2",
    badgeClass: "bg-cyan-50 text-cyan-800 border-cyan-300",
    policyFocus: "HIPAA/DPDP compliance, fraudulent prescription orders, and insurance claim diversion",
    recommendedAction: "Confirm patient MRN directly with registered hospital billing desk",
    defaultWeights: {
      deepfake: 0.20,
      speaker: 0.25,
      speakerMismatch: 0.25,
      replay: 0.15,
      nlp: 0.25,
      context: 0.15,
    },
    keywords: [
      { pattern: /\b(hospital|patient|doctor|prescription|medication|surgery|admission|discharge)\b/i, weight: 3, label: "Medical care" },
      { pattern: /\b(health insurance|mediclaim|cashless claim|tpa approval|policy number|pre-auth)\b/i, weight: 4, label: "Health insurance" },
      { pattern: /\b(emergency surgery deposit|medical bill|pharmacy|diagnostic report)\b/i, weight: 3, label: "Medical billing" },
    ],
  },
  GENERAL_ROUTINE: {
    name: "General Voice Communication",
    shortCode: "GEN",
    icon: "Globe",
    color: "#64748b",
    badgeClass: "bg-slate-50 text-slate-700 border-slate-300",
    policyFocus: "Standard baseline voice security monitoring",
    recommendedAction: "Standard customer service flow",
    defaultWeights: {
      deepfake: 0.25,
      speaker: 0.20,
      speakerMismatch: 0.20,
      replay: 0.20,
      nlp: 0.20,
      context: 0.15,
    },
    keywords: [
      { pattern: /\b(hello|good morning|good afternoon|good evening|namaste|vanakkam|thanks|how are you|help)\b/i, weight: 1, label: "Conversational greetings" },
    ],
  },
};

/**
 * Classifies spoken conversation into an industry sector in real time.
 * Returns the highest scoring sector with confidence and matched indicators.
 */
export function classifySpokenSector(transcript: string): DetectedSector {
  if (!transcript || transcript.trim().length === 0) {
    const def = SECTOR_DEFINITIONS.GENERAL_ROUTINE;
    return {
      id: "GENERAL_ROUTINE",
      name: def.name,
      shortCode: def.shortCode,
      icon: def.icon,
      color: def.color,
      badgeClass: def.badgeClass,
      confidence: 50,
      matchedKeywords: [],
      recommendedAction: def.recommendedAction,
      policyFocus: def.policyFocus,
      defaultWeights: def.defaultWeights,
    };
  }

  const scores: Record<string, { totalScore: number; matches: string[] }> = {};

  for (const [secKey, def] of Object.entries(SECTOR_DEFINITIONS)) {
    scores[secKey] = { totalScore: 0, matches: [] };
    for (const kw of def.keywords) {
      if (kw.pattern.test(transcript)) {
        scores[secKey].totalScore += kw.weight;
        scores[secKey].matches.push(kw.label);
      }
    }
  }

  // Find maximum scoring sector
  let bestSectorKey = "GENERAL_ROUTINE";
  let maxScore = 0;

  for (const [secKey, result] of Object.entries(scores)) {
    if (secKey === "GENERAL_ROUTINE") continue; // Prioritize specialized domains
    if (result.totalScore > maxScore) {
      maxScore = result.totalScore;
      bestSectorKey = secKey;
    }
  }

  if (maxScore === 0) {
    bestSectorKey = "GENERAL_ROUTINE";
  }

  const chosenDef = SECTOR_DEFINITIONS[bestSectorKey];
  // Calculate confidence from matched strength
  const confidence = Math.min(Math.max(Math.round(45 + maxScore * 12), 52), 98);

  return {
    id: bestSectorKey,
    name: chosenDef.name,
    shortCode: chosenDef.shortCode,
    icon: chosenDef.icon,
    color: chosenDef.color,
    badgeClass: chosenDef.badgeClass,
    confidence: bestSectorKey === "GENERAL_ROUTINE" ? 60 : confidence,
    matchedKeywords: Array.from(new Set(scores[bestSectorKey]?.matches || [])),
    recommendedAction: chosenDef.recommendedAction,
    policyFocus: chosenDef.policyFocus,
    defaultWeights: chosenDef.defaultWeights,
  };
}
