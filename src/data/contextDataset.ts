/**
 * Simulated Context Engine Dataset & Preloaded Attack Scenarios
 * Real-Time Voice Trust Firewall
 *
 * Provides mock employee directories, transaction limits, and realistic
 * red-team attack scenarios for SIH judging and evaluation.
 */

import { ContextProfile, PreloadedScenario } from '../types';

export const ENROLLED_PROFILES: ContextProfile[] = [
  {
    id: 'prof-rajesh',
    name: 'Rajesh Kumar',
    role: 'Chief Financial Officer',
    department: 'Treasury & Corporate Finance',
    phone: '+91-98201-88410',
    typicalTransferLimit: 500000, // ₹5,00,000
    businessHoursStart: 9,
    businessHoursEnd: 18,
    recentCallFrequency: 'Daily (Finance Approvals)',
  },
  {
    id: 'prof-priya',
    name: 'Priya Sharma',
    role: 'VP Engineering & Infrastructure',
    department: 'Cloud Security & DevOps',
    phone: '+91-98110-33290',
    typicalTransferLimit: 100000, // ₹1,00,000
    businessHoursStart: 10,
    businessHoursEnd: 19,
    recentCallFrequency: 'Twice Weekly',
  },
  {
    id: 'prof-ananya',
    name: 'Ananya Rao',
    role: 'Premier HNI Account Holder',
    department: 'Retail Wealth Management',
    phone: '+91-99450-12876',
    typicalTransferLimit: 250000, // ₹2,50,000
    businessHoursStart: 9,
    businessHoursEnd: 20,
    recentCallFrequency: 'Monthly',
  },
  {
    id: 'prof-vikram',
    name: 'Vikram Malhotra',
    role: 'Senior Treasury Officer',
    department: 'Foreign Exchange & Clearing',
    phone: '+91-97170-44912',
    typicalTransferLimit: 1000000, // ₹10,00,000
    businessHoursStart: 8,
    businessHoursEnd: 17,
    recentCallFrequency: 'Daily (RTGS/NEFT)',
  },
];

export const PRELOADED_SCENARIOS: PreloadedScenario[] = [
  {
    id: 'scen-ceo-wire',
    title: 'High-Urgency CEO Deepfake Wire Transfer',
    category: 'High Threat Attack',
    description: 'Impersonates CFO Rajesh Kumar demanding urgent ₹25,00,000 wire to an unverified beneficiary, citing a confidential acquisition deadline.',
    claimedSpeaker: 'prof-rajesh',
    action: 'Immediate RTGS Wire Transfer of ₹25,00,000 to New Vendor Account',
    amount: 2500000,
    sampleTranscript: 'Listen to me carefully, this is Rajesh Kumar. I am in an emergency acquisition meeting and cannot use official email. Transfer 25 lakh rupees immediately to account 9821443190 via RTGS right now. Keep this strictly confidential between us, do not wait for standard clearance.',
    baseDeepfake: 88,
    baseSpeakerSim: 42, // High mismatch
    baseReplay: 30,
    simulatedAudioVariant: 'FastPitch + HiFi-GAN Vocoder Clone (IndicSynth synthetic voice)',
  },
  {
    id: 'scen-otp-phishing',
    title: 'Helpdesk Voice Impersonation & OTP Harvest',
    category: 'Credential Phishing',
    description: 'Impersonates VP Priya Sharma claiming emergency cloud outage, demanding 2FA OTP and root credentials.',
    claimedSpeaker: 'prof-priya',
    action: 'Emergency Admin Password Reset & Master MFA Bypass',
    amount: 0,
    sampleTranscript: 'Hi, this is Priya from Engineering. Our primary cloud cluster in Mumbai just experienced a critical security failure. I need your current OTP and the verification code sent to your phone right now to restore root access, hurry up or the entire service goes down.',
    baseDeepfake: 82,
    baseSpeakerSim: 38,
    baseReplay: 45,
    simulatedAudioVariant: 'XTTS-v2 Neural Voice Conversion (Unseen generator test)',
  },
  {
    id: 'scen-acoustic-replay',
    title: 'Acoustic Replay Attack of Legitimate Audio',
    category: 'Impersonation Clone',
    description: 'Replaying a previously recorded legitimate call of customer Ananya Rao through a smartphone speaker into the banking helpline.',
    claimedSpeaker: 'prof-ananya',
    action: 'Change Registered Mobile Number & Dispatch New Debit Card',
    amount: 0,
    sampleTranscript: 'Yes, this is Ananya Rao confirming my registered identity. I need to urgently update my delivery address and telephone records immediately for my premier savings account.',
    baseDeepfake: 35,
    baseSpeakerSim: 79, // Timbre matches original speaker!
    baseReplay: 89, // High replay detection caught it!
    simulatedAudioVariant: 'Physical Mobile Speaker Replay into Microphone (G.711 Telephony channel)',
  },
  {
    id: 'scen-after-hours-anomaly',
    title: 'Off-Hours Treasury Anomaly (Low Deepfake, High Context)',
    category: 'High Threat Attack',
    description: 'Voice sounds authentic or low-confidence clone, but caller ID is spoofed, time is 11:45 PM, and amount exceeds normal limit.',
    claimedSpeaker: 'prof-vikram',
    action: 'Off-Hours Overseas Remittance of ₹12,00,000',
    amount: 1200000,
    sampleTranscript: 'Vikram here from Treasury. I know it is late at night, but we received an expedited overseas clearing order. Please execute the remittance of twelve lakh rupees before market open.',
    baseDeepfake: 45,
    baseSpeakerSim: 65,
    baseReplay: 25,
    simulatedAudioVariant: 'Direct Voice Stream with Synthetic Prosody Modification',
  },
  {
    id: 'scen-benign-routine',
    title: 'Routine Business Operations Call (Benign Baseline)',
    category: 'Benign Business',
    description: 'Legitimate call from Rajesh Kumar during regular working hours verifying standard monthly vendor payroll.',
    claimedSpeaker: 'prof-rajesh',
    action: 'Standard Vendor Payroll Clearing of ₹2,20,000',
    amount: 220000,
    sampleTranscript: 'Good morning, this is Rajesh Kumar from Treasury. Just calling to verify that the monthly vendor payroll batches have been processed according to our standard checklist. No hurry, send the report when ready.',
    baseDeepfake: 12,
    baseSpeakerSim: 92,
    baseReplay: 14,
    simulatedAudioVariant: 'Authentic Human Voice (Direct High-Fidelity Microphone)',
  },
];
