#!/usr/bin/env python3
"""
Voice Trust Firewall - Multilingual Test Runner
Evaluates trust analysis across Indian languages and mixed-language conversations.
"""

import sys
import json
from voice_trust_tester import fetch_tests_from_server

def main():
    print("=" * 72)
    print("VOICE TRUST FIREWALL - MULTILINGUAL TEST SUITE")
    print("Evaluating Indian Languages & Cross-Lingual Security Detection")
    print("=" * 72)

    report = fetch_tests_from_server(category="multilingual")

    print("\n--- TEST EXECUTION SUMMARY ---")
    print(f"Total Tests Run: {report['total_tests']}")
    print(f"Passed:          {report['passed']}")
    print(f"Failed:          {report['failed']}")
    print(f"Unsupported ASR: {report['unsupported']}")
    print(f"Overall Accuracy: {report['accuracy']}%")
    print(f"False Positives: {report['false_positives']}")
    print(f"False Negatives: {report['false_negatives']}")

    print("\n" + "=" * 72)
    print("LANGUAGE TEST RESULTS")
    print("=" * 72)

    lang_stats = report.get("language_wise_accuracy", {})
    for lang, stat in lang_stats.items():
        if stat["total"] == 0:
            continue
        print(f"\n{lang}:")
        print(f"  Total Cases:     {stat['total']}")
        print(f"  Passed:          {stat['passed']}")
        print(f"  Failed:          {stat['failed']}")
        if stat["unsupported"] > 0:
            print(f"  Unsupported ASR: {stat['unsupported']} (Acoustic model pending certification)")
        print(f"  Accuracy:        {stat['accuracy']}%")

    print("\n" + "=" * 72)
    print("TEST MATRIX BREAKDOWN")
    print("=" * 72)
    print(f"{'TEST ID':<12} | {'LANGUAGE':<10} | {'INTENT':<22} | {'EXP DECISION':<12} | {'RESULT':<8}")
    print("-" * 72)

    for t in report.get("test_results", []):
        test_id = t.get("test_id", "N/A")
        lang = t.get("language", "N/A")[:10]
        intent = t.get("expected_intent", "N/A")[:22]
        exp_dec = t.get("expected_decision", "N/A")
        status = "PASSED" if t.get("passed") else ("UNSUPPORTED" if not t.get("is_supported") else "FAILED")
        print(f"{test_id:<12} | {lang:<10} | {intent:<22} | {exp_dec:<12} | {status:<8}")

    print("\n[✔] Multilingual evaluation complete.")
    if report["failed"] > 0:
        sys.exit(1)
    sys.exit(0)

if __name__ == "__main__":
    main()
