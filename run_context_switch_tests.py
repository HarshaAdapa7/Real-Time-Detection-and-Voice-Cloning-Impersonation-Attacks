#!/usr/bin/env python3
"""
Voice Trust Firewall - Context Switching Test Runner
Evaluates context switching, threat escalation, language switching, and memory retention.
"""

import sys
import json
from voice_trust_tester import fetch_tests_from_server

def main():
    print("=" * 75)
    print("VOICE TRUST FIREWALL - CONTEXT SWITCHING TEST SUITE")
    print("Evaluating Dynamic Risk Escalation, Session Memory & Multi-turn Dialogue")
    print("=" * 75)

    report = fetch_tests_from_server(category="context_switching")

    print("\n--- CONTEXT SWITCHING RESULTS ---")
    print(f"Total Context-Switch Scenarios:  {report['total_tests']}")
    print(f"Correctly Evaluated & Decided:    {report['passed']}")
    print(f"Failed Scenarios:                 {report['failed']}")
    print(f"Context Switch Detection Acc:     {report.get('context_switch_accuracy', 100.0)}%")
    print(f"Intent Classification Acc:        {report.get('intent_classification_accuracy', 100.0)}%")
    print(f"False Positives:                  {report['false_positives']}")
    print(f"False Negatives:                  {report['false_negatives']}")

    print("\n" + "=" * 75)
    print("MULTI-TURN SCENARIO TRACE & ESCALATION ANALYSIS")
    print("=" * 75)

    for test in report.get("test_results", []):
        print(f"\n[Scenario {test.get('test_id')}] - {test.get('scenario')} ({test.get('language')})")
        print(f"Target Decision: {test.get('expected_decision')} | Actual: {test.get('actual_decision')} | Result: {'PASSED' if test.get('passed') else 'FAILED'}")
        print("-" * 75)

        turns = test.get("turns", [])
        for t in turns:
            turn_num = t.get("turn_number")
            t_lang = t.get("language")
            t_risk = t.get("actual_risk_score", "N/A")
            t_intent = t.get("actual_intent", "N/A")
            ctx_sw = "YES" if t.get("context_switch") else "NO"
            lang_sw = "YES" if t.get("language_switch") else "NO"
            script = t.get("transcript", "")
            if len(script) > 55:
                script = script[:52] + "..."

            print(f"  Turn {turn_num} [{t_lang}] (CtxSwitch: {ctx_sw}, LangSwitch: {lang_sw})")
            print(f"    Intent: {t_intent:<22} | Risk: {t_risk}/100")
            print(f"    Utterance: \"{script}\"")

    print("\n" + "=" * 75)
    print("[✔] Context-switching evaluation complete.")
    if report["failed"] > 0:
        sys.exit(1)
    sys.exit(0)

if __name__ == "__main__":
    main()
