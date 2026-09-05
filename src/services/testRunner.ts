/**
 * Multilingual & Context-Switching Test Execution Engine
 *
 * Runs actual test cases through the real language detection, context-switch detection,
 * risk fusion, and policy engine.
 *
 * Produces real, non-fabricated metrics:
 * - Accuracy by language
 * - Context-switch detection precision
 * - Intent classification accuracy
 * - False positives & false negatives
 * - ASR compatibility checks
 */

import { TestCaseSchema, EvaluationReport, TenantConfig } from '../types';
import { MULTILINGUAL_TEST_CASES, CONTEXT_SWITCH_TEST_CASES, SUPPORTED_LANGUAGES } from '../data/multilingualTestDataset';
import { evaluateTurnInContext } from './contextSwitchDetector';
import { DEFAULT_TENANTS } from './policyEngine';

export interface RunTestOptions {
  categoryFilter?: string; // 'all' | 'multilingual' | 'context_switching' | 'cross_lingual_speaker'
  languageFilter?: string; // 'all' | 'en' | 'hi' | 'te' | 'ta' | 'kn' | 'ml' | 'mr' | 'bn'
  tenantConfig?: TenantConfig;
  asrEnabledLanguages?: string[];
  customTestCases?: TestCaseSchema[];
}

export function runSingleTestCase(
  test: TestCaseSchema,
  tenantConfig: TenantConfig = DEFAULT_TENANTS['tenant-bank'],
  asrEnabledLanguages: string[] = ['en', 'hi', 'te', 'ta', 'kn']
): TestCaseSchema {
  // 1. Check ASR Support
  const langConfig = SUPPORTED_LANGUAGES.find((l) => l.code === test.language_code || test.language_code.startsWith(l.code));
  const isAsrSupported = langConfig ? asrEnabledLanguages.includes(langConfig.code) : true;

  if (!isAsrSupported) {
    return {
      ...test,
      actual_transcription: 'AUDIO_ASR_REJECTED',
      actual_detected_language: test.language,
      actual_intent: 'UNPROCESSED_UNSUPPORTED_LANGUAGE',
      actual_risk_score: 0,
      actual_decision: 'ALLOW',
      passed: false,
      is_supported: false,
      failure_reason: `ASR acoustic model pack for language '${test.language}' is pending certification in active profile.`,
    };
  }

  // 2. Multi-turn Context Switching Execution
  if (test.turns && test.turns.length > 0) {
    let sessionState = null;
    let finalOutput = null;
    let anyTurnFailed = false;
    let failureMsg: string | null = null;

    const evaluatedTurns = test.turns.map((turn) => {
      const output = evaluateTurnInContext({
        callId: test.test_id,
        turnNumber: turn.turn_number,
        transcript: turn.transcript,
        sessionState,
        tenantConfig,
        decayPolicy: test.category === 'context_reversal' ? 'decay_gradual' : 'retain_elevated',
      });

      sessionState = output.sessionContext;
      finalOutput = output;

      // Check turn risk range if specified
      if (turn.expected_risk_range) {
        const [min, max] = turn.expected_risk_range;
        if (output.riskScore < min || output.riskScore > max) {
          anyTurnFailed = true;
          failureMsg = `Turn ${turn.turn_number} risk score (${output.riskScore}) outside expected range [${min}, ${max}]`;
        }
      }

      return {
        ...turn,
        actual_risk_score: output.riskScore,
        actual_detected_language: output.detectedLanguage,
        actual_intent: output.intent,
        context_switch: output.detection.context_switch,
        language_switch: output.detection.language_switch,
        coercion_cues: output.detection.cues,
      };
    });

    const finalDecision = finalOutput ? (finalOutput as any).decision : 'ALLOW';
    const finalRiskScore = finalOutput ? (finalOutput as any).riskScore : 10;
    const finalLang = finalOutput ? (finalOutput as any).detectedLanguage : test.language;
    const finalIntent = finalOutput ? (finalOutput as any).intent : test.expected_intent;

    // Check final decision match
    const decisionMatches = finalDecision === test.expected_decision;
    const passed = decisionMatches;

    return {
      ...test,
      turns: evaluatedTurns,
      actual_transcription: test.turns[test.turns.length - 1].transcript,
      actual_detected_language: finalLang,
      actual_intent: finalIntent,
      actual_risk_score: finalRiskScore,
      actual_decision: finalDecision,
      passed,
      is_supported: true,
      failure_reason: passed ? null : failureMsg || `Expected decision ${test.expected_decision} but got ${finalDecision}`,
    };
  }

  // 3. Single Turn Execution
  const output = evaluateTurnInContext({
    callId: test.test_id,
    turnNumber: 1,
    transcript: test.sample_transcription,
    sessionState: null,
    tenantConfig,
    externalBiometricScore: test.speaker_id ? 90 : 85,
  });

  const riskMatches = test.expected_risk_range
    ? output.riskScore >= test.expected_risk_range[0] && output.riskScore <= test.expected_risk_range[1]
    : true;
  const decisionMatches = output.decision === test.expected_decision;
  const passed = riskMatches && decisionMatches;

  return {
    ...test,
    actual_transcription: test.sample_transcription,
    actual_detected_language: output.detectedLanguage,
    actual_intent: output.intent,
    actual_risk_score: output.riskScore,
    actual_decision: output.decision,
    passed,
    is_supported: true,
    failure_reason: passed
      ? null
      : `Expected decision '${test.expected_decision}' (Risk: ${test.expected_risk_range ? test.expected_risk_range.join('-') : 'N/A'}), got '${output.decision}' (Risk: ${output.riskScore})`,
  };
}

export function runAllEvaluationTests(options: RunTestOptions = {}): EvaluationReport {
  const {
    categoryFilter = 'all',
    languageFilter = 'all',
    tenantConfig = DEFAULT_TENANTS['tenant-bank'],
    asrEnabledLanguages = ['en', 'hi', 'te', 'ta', 'kn'],
  } = options;

  let allTests = [...MULTILINGUAL_TEST_CASES, ...CONTEXT_SWITCH_TEST_CASES, ...(options.customTestCases || [])];

  if (categoryFilter !== 'all') {
    allTests = allTests.filter((t) => t.category === categoryFilter);
  }

  if (languageFilter !== 'all') {
    allTests = allTests.filter((t) => t.language_code.includes(languageFilter));
  }

  const results = allTests.map((t) => runSingleTestCase(t, tenantConfig, asrEnabledLanguages));

  let passed = 0;
  let failed = 0;
  let unsupported = 0;
  let falsePositives = 0;
  let falseNegatives = 0;

  const languageStats: Record<string, { total: number; passed: number; failed: number; unsupported: number; accuracy: number }> = {};

  // Initialize language stats
  SUPPORTED_LANGUAGES.forEach((l) => {
    languageStats[l.name] = { total: 0, passed: 0, failed: 0, unsupported: 0, accuracy: 0 };
  });

  let totalContextSwitchTests = 0;
  let passedContextSwitchTests = 0;
  let totalIntentTests = 0;
  let passedIntentTests = 0;

  results.forEach((r) => {
    const langKey = r.language.split(' ')[0].replace('->', '').trim();
    if (!languageStats[langKey]) {
      languageStats[langKey] = { total: 0, passed: 0, failed: 0, unsupported: 0, accuracy: 0 };
    }

    if (!r.is_supported) {
      unsupported++;
      languageStats[langKey].total++;
      languageStats[langKey].unsupported++;
      return;
    }

    languageStats[langKey].total++;

    if (r.passed) {
      passed++;
      languageStats[langKey].passed++;
    } else {
      failed++;
      languageStats[langKey].failed++;

      // Analyze FP vs FN
      if (r.expected_decision === 'ALLOW' && r.actual_decision !== 'ALLOW') {
        falsePositives++;
      } else if (r.expected_decision !== 'ALLOW' && r.actual_decision === 'ALLOW') {
        falseNegatives++;
      }
    }

    // Context switch metrics
    if (r.category === 'context_switching' || r.category === 'rapid_switching' || r.category === 'context_reversal') {
      totalContextSwitchTests++;
      if (r.passed) passedContextSwitchTests++;
    }

    // Intent accuracy
    totalIntentTests++;
    if (r.actual_intent === r.expected_intent) {
      passedIntentTests++;
    }
  });

  // Calculate language accuracy percentages
  Object.keys(languageStats).forEach((k) => {
    const stat = languageStats[k];
    const testable = stat.passed + stat.failed;
    stat.accuracy = testable > 0 ? Number(((stat.passed / testable) * 100).toFixed(1)) : 0;
  });

  const testableTotal = passed + failed;
  const overallAccuracy = testableTotal > 0 ? Number(((passed / testableTotal) * 100).toFixed(1)) : 0;
  const csAccuracy = totalContextSwitchTests > 0 ? Number(((passedContextSwitchTests / totalContextSwitchTests) * 100).toFixed(1)) : 100;
  const intentAccuracy = totalIntentTests > 0 ? Number(((passedIntentTests / totalIntentTests) * 100).toFixed(1)) : 100;

  return {
    total_tests: results.length,
    passed,
    failed,
    unsupported,
    accuracy: overallAccuracy,
    language_wise_accuracy: languageStats,
    context_switch_accuracy: csAccuracy,
    intent_classification_accuracy: intentAccuracy,
    false_positives: falsePositives,
    false_negatives: falseNegatives,
    test_results: results,
    execution_timestamp: new Date().toISOString(),
  };
}

export const runAllTests = runAllEvaluationTests;
