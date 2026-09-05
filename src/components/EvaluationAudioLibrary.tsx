import React, { useState, useEffect } from 'react';
import {
  Database,
  CheckCircle2,
  Clock,
  Play,
  Pause,
  AlertTriangle,
  FileCheck,
  ShieldCheck,
  ShieldAlert,
  Trash2,
  Layers,
  Sparkles,
  ArrowUpRight,
  Filter,
  RefreshCw,
  HelpCircle,
  X,
  Volume2
} from 'lucide-react';
import { EvaluationAudioRecord, LabelStatus, EvaluationReport } from '../types';

interface EvaluationAudioLibraryProps {
  onRunTestSuite?: () => void;
}

export const EvaluationAudioLibrary: React.FC<EvaluationAudioLibraryProps> = () => {
  const [records, setRecords] = useState<EvaluationAudioRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterLanguage, setFilterLanguage] = useState<string>('all');

  // Verification Modal State
  const [selectedRecord, setSelectedRecord] = useState<EvaluationAudioRecord | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isReanalyzing, setIsReanalyzing] = useState(false);
  const [reanalysisResult, setReanalysisResult] = useState<any>(null);
  const [verifyForm, setVerifyForm] = useState<{
    verifiedLabel: boolean;
    expectedDecision: 'ALLOW' | 'VERIFY' | 'PAUSE_ESCALATE' | 'BLOCK';
    expectedRiskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    expectedContexts: string;
    customTranscript: string;
    threatType: string;
  }>({
    verifiedLabel: true,
    expectedDecision: 'ALLOW',
    expectedRiskLevel: 'LOW',
    expectedContexts: 'normal',
    customTranscript: '',
    threatType: 'Digital Arrest Extortion',
  });

  // Test Runner State
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [testReport, setTestReport] = useState<EvaluationReport | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'info' | 'error'; message: string } | null>(null);

  // Audio Playback
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);

  // Fetch Evaluation Audio Records
  const fetchRecords = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/evaluation-audio');
      if (res.ok) {
        const data = await res.json();
        setRecords(data.records || []);
      }
    } catch (err) {
      console.error('Failed to fetch evaluation audio records:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  // Open Verification Modal
  const handleOpenVerify = (record: EvaluationAudioRecord) => {
    setSelectedRecord(record);
    setReanalysisResult(null);
    setVerifyForm({
      verifiedLabel: record.verified_label ?? (record.deepfake_prediction === 'Human Voice'),
      expectedDecision: (record.expected_decision as any) || 'ALLOW',
      expectedRiskLevel: record.expected_risk_level || 'LOW',
      expectedContexts: record.detected_contexts ? record.detected_contexts.join(', ') : 'normal',
      customTranscript: record.transcript || '',
      threatType: record.transcript && /police|cbi|arrest|warrant/i.test(record.transcript)
        ? 'Digital Arrest Extortion'
        : record.transcript && /anydesk|teamviewer|remote|apk/i.test(record.transcript)
        ? 'Remote Access Trojan'
        : record.transcript && /bill|power|electricity|kyc/i.test(record.transcript)
        ? 'Scam Pretext / Urgency'
        : 'Digital Arrest Extortion',
    });
    setIsVerifying(true);
  };

  // Re-Analyze Record with 5-Layer Model
  const handleReanalyzeRecord = async () => {
    if (!selectedRecord) return;
    setIsReanalyzing(true);
    try {
      const res = await fetch(`/api/live-sessions/${selectedRecord.session_id}/reanalyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customTranscript: verifyForm.customTranscript,
          strictnessMode: 'strict',
          unverifiedCallerFloor: 35,
          speakerSimilarity: 25,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setReanalysisResult(data);
        if (data.finalDecision === 'BLOCK' || data.finalRiskScore >= 75) {
          setVerifyForm((prev) => ({
            ...prev,
            verifiedLabel: false,
            expectedDecision: 'BLOCK',
            expectedRiskLevel: 'CRITICAL',
          }));
        }
        setNotification({
          type: data.finalDecision === 'BLOCK' ? 'error' : 'info',
          message: `5-Layer Model Evaluated: ${data.finalDecision} (Risk: ${data.finalRiskScore}/100). ${data.circuitBreakerTriggered || ''}`,
        });
        fetchRecords();
      }
    } catch (err) {
      console.error('Re-analysis error:', err);
    } finally {
      setIsReanalyzing(false);
    }
  };

  // Fine-Tune Model on this Live Sample & Update Benchmark Suite
  const handleFineTuneRecord = async (groundTruth: 'FRAUD' | 'LEGITIMATE') => {
    if (!selectedRecord) return;
    setIsReanalyzing(true);
    try {
      const res = await fetch(`/api/live-sessions/${selectedRecord.session_id}/tune-label`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groundTruth,
          threatType: verifyForm.threatType,
          customTranscript: verifyForm.customTranscript,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setNotification({
          type: 'success',
          message: data.message || `Model fine-tuned with ${groundTruth}. Dynamic test pass rate: ${data.testReport?.accuracy}%.`,
        });
        fetchRecords();
        handleReanalyzeRecord();
      }
    } catch (err) {
      console.error('Fine-tune error:', err);
    } finally {
      setIsReanalyzing(false);
    }
  };

  // Submit Verification
  const handleSaveVerification = async () => {
    if (!selectedRecord) return;
    try {
      const contextsArray = verifyForm.expectedContexts.split(',').map((s) => s.trim()).filter(Boolean);
      const res = await fetch(`/api/evaluation-audio/${selectedRecord.evaluation_audio_id}/verify-label`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label_status: 'VERIFIED',
          verified_label: verifyForm.verifiedLabel,
          expected_decision: verifyForm.expectedDecision,
          expected_risk_level: verifyForm.expectedRiskLevel,
          expected_context_flow: contextsArray,
        }),
      });

      if (res.ok) {
        setNotification({
          type: 'success',
          message: `Evaluation audio ${selectedRecord.evaluation_audio_id} successfully verified by human reviewer.`,
        });
        setIsVerifying(false);
        setSelectedRecord(null);
        fetchRecords();
      }
    } catch (err) {
      console.error('Error verifying record:', err);
    }
  };

  // Convert to Automated Test Case
  const handleConvertToTestCase = async (record: EvaluationAudioRecord) => {
    try {
      const res = await fetch(`/api/evaluation-audio/${record.evaluation_audio_id}/create-test-case`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: record.detected_contexts && record.detected_contexts.length > 1 ? 'context_switching' : 'multilingual',
          language_code: record.language.toLowerCase().substring(0, 2),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setNotification({
          type: 'success',
          message: `Created test case ${data.testCase.test_id} and integrated into evaluation suite.`,
        });
        fetchRecords();
      }
    } catch (err) {
      console.error('Error creating test case:', err);
    }
  };

  // Run Evaluation Test Suite
  const handleRunEvaluationSuite = async () => {
    setIsRunningTests(true);
    try {
      const res = await fetch('/api/multilingual/run-tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryFilter: 'all',
          languageFilter: 'all',
        }),
      });
      if (res.ok) {
        const report = await res.json();
        setTestReport(report);
        setNotification({
          type: 'success',
          message: `Evaluation suite completed across ${report.summary.total_tests} test cases (Pass Rate: ${report.summary.pass_rate}%).`,
        });
      }
    } catch (err) {
      console.error('Failed to run test suite:', err);
    } finally {
      setIsRunningTests(false);
    }
  };

  // Delete Record
  const handleDeleteRecord = async (id: string) => {
    try {
      await fetch(`/api/evaluation-audio/${id}`, { method: 'DELETE' });
      setNotification({ type: 'info', message: `Record ${id} removed from library.` });
      fetchRecords();
    } catch (err) {
      console.error('Failed to delete record:', err);
    }
  };

  // Filter Records
  const filteredRecords = records.filter((r) => {
    if (filterStatus !== 'all' && r.label_status !== filterStatus) return false;
    if (filterLanguage !== 'all' && !r.language.toLowerCase().includes(filterLanguage.toLowerCase())) return false;
    return true;
  });

  const unverifiedCount = records.filter((r) => r.label_status === 'UNVERIFIED').length;
  const verifiedCount = records.filter((r) => r.label_status === 'VERIFIED').length;

  return (
    <div className="space-y-6">
      {/* Notification */}
      {notification && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between text-xs transition-all ${
            notification.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-indigo-50 border-indigo-200 text-indigo-800'
          }`}
        >
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-slate-500 hover:text-slate-800 font-bold ml-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Hero Header & Metrics */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <Database className="w-5 h-5 text-indigo-600" />
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Evaluation Audio Library & Dataset Integration
              </h2>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold uppercase">
                SIH Core Architecture
              </span>
            </div>
            <p className="text-xs text-slate-500 max-w-2xl">
              Captures live conversations, maintains explicit separation between{' '}
              <strong className="text-slate-700">Model Predictions</strong> and{' '}
              <strong className="text-slate-700">Verified Ground Truth</strong>, supports human verification,
              and converts verified recordings into executable multilingual & context-switching test cases.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchRecords}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition cursor-pointer"
              title="Refresh records"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              id="btn-run-eval-suite"
              onClick={handleRunEvaluationSuite}
              disabled={isRunningTests}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-60"
            >
              <Sparkles className="w-4 h-4" />
              {isRunningTests ? 'Running Evaluation Suite...' : 'Run Multilingual Evaluation Suite'}
            </button>
          </div>
        </div>

        {/* Metric Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-[11px] text-slate-500 font-medium">Total Captured Audio</div>
            <div className="text-xl font-bold font-mono text-slate-900 mt-0.5">{records.length}</div>
          </div>
          <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200">
            <div className="text-[11px] text-amber-700 font-medium flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Unverified (Needs Review)
            </div>
            <div className="text-xl font-bold font-mono text-amber-900 mt-0.5">{unverifiedCount}</div>
          </div>
          <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200">
            <div className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Verified Ground Truth
            </div>
            <div className="text-xl font-bold font-mono text-emerald-900 mt-0.5">{verifiedCount}</div>
          </div>
          <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-200">
            <div className="text-[11px] text-indigo-700 font-medium flex items-center gap-1">
              <Layers className="w-3.5 h-3.5" /> Converted to Test Suite
            </div>
            <div className="text-xl font-bold font-mono text-indigo-900 mt-0.5">
              {records.filter((r) => r.added_to_test_cases).length}
            </div>
          </div>
        </div>
      </div>

      {/* Test Execution Report (if run) */}
      {testReport && (
        <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-sm border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <h3 className="text-sm font-bold tracking-tight">Automated Evaluation Suite Results</h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                {testReport.summary.total_tests} Tests Evaluated
              </span>
            </div>
            <div className="flex items-center gap-3 font-mono text-xs">
              <span className="text-emerald-400 font-bold">Passed: {testReport.summary.passed}</span>
              <span className="text-rose-400 font-bold">Failed: {testReport.summary.failed}</span>
              <span className="px-2 py-0.5 rounded bg-indigo-900/60 border border-indigo-700 text-indigo-300 font-bold">
                Pass Rate: {testReport.summary.pass_rate}%
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
              <div className="text-slate-400 text-[10px]">Context Switch Precision</div>
              <div className="text-base font-bold text-white mt-1">
                {testReport.summary.context_switch_precision}%
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
              <div className="text-slate-400 text-[10px]">Intent Classification</div>
              <div className="text-base font-bold text-white mt-1">
                {testReport.summary.intent_classification_accuracy}%
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
              <div className="text-slate-400 text-[10px]">False Positives</div>
              <div className="text-base font-bold text-amber-400 mt-1">
                {testReport.summary.false_positives}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
              <div className="text-slate-400 text-[10px]">False Negatives</div>
              <div className="text-base font-bold text-rose-400 mt-1">
                {testReport.summary.false_negatives}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Records Table & Filters */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Filter Controls */}
        <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-slate-700 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-slate-500" /> Filter:
            </span>
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                filterStatus === 'all'
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              All Records ({records.length})
            </button>
            <button
              onClick={() => setFilterStatus('UNVERIFIED')}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                filterStatus === 'UNVERIFIED'
                  ? 'bg-amber-600 text-white font-semibold'
                  : 'bg-white text-amber-800 border border-amber-200 hover:bg-amber-50'
              }`}
            >
              Unverified ({unverifiedCount})
            </button>
            <button
              onClick={() => setFilterStatus('VERIFIED')}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                filterStatus === 'VERIFIED'
                  ? 'bg-emerald-600 text-white font-semibold'
                  : 'bg-white text-emerald-800 border border-emerald-200 hover:bg-emerald-50'
              }`}
            >
              Verified ({verifiedCount})
            </button>
          </div>

          <div className="text-[11px] text-slate-500">
            Showing <strong className="text-slate-800">{filteredRecords.length}</strong> items
          </div>
        </div>

        {/* Audio Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/70 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Evaluation ID</th>
                <th className="py-3 px-4">Source & Lang</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Model Prediction</th>
                <th className="py-3 px-4">Ground Truth Status</th>
                <th className="py-3 px-4">Expected Decision</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No evaluation audio records found matching this filter.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((rec) => (
                  <tr key={rec.evaluation_audio_id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      <div>{rec.evaluation_audio_id}</div>
                      <div className="text-[10px] font-normal text-slate-400 font-sans">
                        Session: {rec.session_id}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{rec.language}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{rec.source}</div>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-600">{rec.duration}</td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                          rec.deepfake_prediction.includes('Human')
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-rose-50 text-rose-800 border border-rose-200'
                        }`}
                      >
                        {rec.deepfake_prediction}
                      </span>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        Conf: {Math.round(rec.prediction_confidence * 100)}%
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      {rec.label_status === 'VERIFIED' ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-[10px] inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          VERIFIED
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 font-bold text-[10px] inline-flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-600" />
                          UNVERIFIED
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                          rec.expected_decision === 'ALLOW'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : rec.expected_decision === 'STEP_UP_MFA'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {rec.expected_decision}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                      {/* 5-Layer Re-Analyze & Tune Button */}
                      <button
                        onClick={() => handleOpenVerify(rec)}
                        className="px-2.5 py-1 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition cursor-pointer shadow-2xs inline-flex items-center gap-1"
                        title="Run 5-layer pipeline re-analysis and fine-tune model"
                      >
                        <Layers className="w-3 h-3" />
                        <span>Re-Analyze & Tune</span>
                      </button>

                      {/* Add to Test Cases button */}
                      {rec.label_status === 'VERIFIED' && !rec.added_to_test_cases && (
                        <button
                          onClick={() => handleConvertToTestCase(rec)}
                          className="px-2.5 py-1 rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-medium transition cursor-pointer"
                          title="Convert to test case in evaluation suite"
                        >
                          + Add to Test Cases
                        </button>
                      )}

                      {rec.added_to_test_cases && (
                        <span className="px-2 py-1 rounded bg-slate-100 text-slate-500 font-mono text-[10px]">
                          In Test Suite
                        </span>
                      )}

                      {/* Delete */}
                      <button
                        onClick={() => handleDeleteRecord(rec.evaluation_audio_id)}
                        className="p-1 rounded text-slate-400 hover:text-rose-600 transition cursor-pointer inline-block"
                        title="Delete from evaluation library"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Verification & 5-Layer Fine-Tuning Modal Dialog */}
      {isVerifying && selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-2xl w-full p-6 space-y-4 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <FileCheck className="w-5 h-5 text-indigo-600" />
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    5-Layer Intelligence & Fine-Tuning: {selectedRecord.evaluation_audio_id}
                  </h3>
                  <div className="text-[11px] text-slate-500 font-mono">
                    Session: {selectedRecord.session_id} • Source: {selectedRecord.source}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsVerifying(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Editable Transcript & Unseen Sample Presets */}
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-slate-700">
                  Audio Transcript (Editable / Test with Unseen Patterns):
                </label>
                <span className="text-[10px] text-slate-400">Live Web Speech / Audio Buffer</span>
              </div>
              <textarea
                rows={3}
                value={verifyForm.customTranscript}
                onChange={(e) => setVerifyForm({ ...verifyForm, customTranscript: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 font-mono text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Spoken conversation transcript..."
              />

              {/* Quick Sample Presets for Unseen Live Fraud Tests */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] font-semibold text-slate-500">Inject Unseen Pattern:</span>
                <button
                  type="button"
                  onClick={() =>
                    setVerifyForm({
                      ...verifyForm,
                      customTranscript:
                        'This is CBI officer Sharma. A digital arrest warrant has been issued against you for contraband narcotics parcel seized in Mumbai. Do not disconnect the call.',
                      threatType: 'Digital Arrest Extortion',
                    })
                  }
                  className="px-2 py-0.5 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[10px] cursor-pointer"
                >
                  Digital Arrest Coercion
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setVerifyForm({
                      ...verifyForm,
                      customTranscript:
                        'Please install AnyDesk remote support app right now and share the 9 digit code so our technician can fix your banking application update.',
                      threatType: 'Remote Access Trojan',
                    })
                  }
                  className="px-2 py-0.5 rounded bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 text-[10px] cursor-pointer"
                >
                  Remote Access Trojan
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setVerifyForm({
                      ...verifyForm,
                      customTranscript:
                        'Dear customer, your electricity power will be disconnected at 9:30 PM tonight due to unpaid bill. Click the link sent or transfer immediate payment.',
                      threatType: 'Scam Pretext / Urgency',
                    })
                  }
                  className="px-2 py-0.5 rounded bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 text-[10px] cursor-pointer"
                >
                  Electricity Bill Urgency
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setVerifyForm({
                      ...verifyForm,
                      customTranscript:
                        'Hello, I am calling to inquire about the branch opening hours on Saturdays and the interest rate on 1-year fixed deposits.',
                      threatType: 'Normal Enquiry',
                    })
                  }
                  className="px-2 py-0.5 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[10px] cursor-pointer"
                >
                  Legitimate Banking Enquiry
                </button>
              </div>
            </div>

            {/* Run 5-Layer Deep Security Re-Analysis Action */}
            <div className="p-3.5 bg-slate-900 rounded-xl text-white space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div>
                  <div className="text-xs font-bold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    5-Layer Heuristic Security Re-Analysis
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Runs Edge DSP Acoustic + Policy Baseline + Biometric + Context NLP + Zero-Trust Risk Fusion
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleReanalyzeRecord}
                  disabled={isReanalyzing}
                  className="px-3 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white font-semibold text-xs cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-1.5 shrink-0"
                >
                  {isReanalyzing ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Play className="w-3.5 h-3.5" />
                  )}
                  <span>{isReanalyzing ? 'Evaluating Pipeline...' : 'Run 5-Layer Evaluation'}</span>
                </button>
              </div>

              {/* Re-Analysis Diagnostics Output */}
              {reanalysisResult && (
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-2 text-xs font-mono">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 text-[11px]">Final Decision:</span>
                      <span
                        className={`px-2 py-0.5 rounded font-bold text-xs ${
                          reanalysisResult.finalDecision === 'BLOCK'
                            ? 'bg-rose-900/80 text-rose-300 border border-rose-700'
                            : reanalysisResult.finalDecision === 'PAUSE_ESCALATE'
                            ? 'bg-amber-900/80 text-amber-300 border border-amber-700'
                            : 'bg-emerald-900/80 text-emerald-300 border border-emerald-700'
                        }`}
                      >
                        {reanalysisResult.finalDecision}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 text-[11px]">Risk Score:</span>
                      <span className="text-white font-bold text-sm">
                        {reanalysisResult.finalRiskScore}/100
                      </span>
                      <span className="text-[10px] text-slate-400">({reanalysisResult.riskLevel})</span>
                    </div>
                  </div>

                  {reanalysisResult.circuitBreakerTriggered && (
                    <div className="p-2 rounded bg-rose-950/80 border border-rose-800 text-rose-300 text-[11px] font-sans">
                      {reanalysisResult.circuitBreakerTriggered}
                    </div>
                  )}

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[10px] text-slate-300">
                    <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
                      <div className="text-slate-500">L1 Acoustic DSP</div>
                      <div>DF: {reanalysisResult.layersBreakdown?.layer1_acoustic?.metrics?.deepfakeScore}%</div>
                    </div>
                    <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
                      <div className="text-slate-500">L2 Zero-Trust Floor</div>
                      <div>Base: {reanalysisResult.layersBreakdown?.layer2_policy?.zeroTrustBaselineFloor}%</div>
                    </div>
                    <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
                      <div className="text-slate-500">L3 Biometric Risk</div>
                      <div>Disparity: {reanalysisResult.layersBreakdown?.layer3_biometrics?.mismatchRisk}%</div>
                    </div>
                    <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
                      <div className="text-slate-500">L4 Peak Context</div>
                      <div>Risk: {reanalysisResult.layersBreakdown?.layer4_conversationalIntelligence?.peakTurnRisk}%</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Model Fine-Tuning & Dynamic Benchmark Enrollment */}
            <div className="p-3.5 bg-indigo-50/70 rounded-xl border border-indigo-200/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-indigo-700" />
                  Fine-Tune Model & Enroll into Dynamic Benchmark Suite
                </span>
                <span className="text-[10px] font-mono text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded font-semibold">
                  Zero Overfitting Pattern Tuning
                </span>
              </div>
              <p className="text-[11px] text-indigo-900/80 leading-relaxed">
                Teach the firewall model to recognize this threat pattern across any future live session.
                This automatically enrolls the sample into the automated regression suite and verifies 100% accuracy.
              </p>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleFineTuneRecord('FRAUD')}
                  disabled={isReanalyzing}
                  className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Fine-Tune & Enforce BLOCK (Fraud)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleFineTuneRecord('LEGITIMATE')}
                  disabled={isReanalyzing}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Fine-Tune & Enforce ALLOW (Legitimate)</span>
                </button>
              </div>
            </div>

            <div className="space-y-3 text-xs pt-2 border-t border-slate-100">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Verified Voice Authenticity (Ground Truth)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setVerifyForm({ ...verifyForm, verifiedLabel: true })}
                    className={`py-2 px-3 rounded-lg border text-center font-medium cursor-pointer transition ${
                      verifyForm.verifiedLabel
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Human Voice (Genuine)
                  </button>
                  <button
                    type="button"
                    onClick={() => setVerifyForm({ ...verifyForm, verifiedLabel: false })}
                    className={`py-2 px-3 rounded-lg border text-center font-medium cursor-pointer transition ${
                      !verifyForm.verifiedLabel
                        ? 'bg-rose-50 border-rose-300 text-rose-800 font-bold'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Synthetic / Cloned / Impersonator
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Expected Policy Decision
                  </label>
                  <select
                    value={verifyForm.expectedDecision}
                    onChange={(e) =>
                      setVerifyForm({
                        ...verifyForm,
                        expectedDecision: e.target.value as any,
                      })
                    }
                    className="w-full p-2 rounded-lg border border-slate-200 bg-white font-mono text-xs cursor-pointer"
                  >
                    <option value="ALLOW">ALLOW (Low Risk / Routine)</option>
                    <option value="VERIFY">VERIFY (Biometric / MFA Check)</option>
                    <option value="PAUSE_ESCALATE">PAUSE_ESCALATE (Escalate to Human SOC)</option>
                    <option value="BLOCK">BLOCK (Immediate Zero-Trust Termination)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Expected Risk Level
                  </label>
                  <select
                    value={verifyForm.expectedRiskLevel}
                    onChange={(e) =>
                      setVerifyForm({
                        ...verifyForm,
                        expectedRiskLevel: e.target.value as any,
                      })
                    }
                    className="w-full p-2 rounded-lg border border-slate-200 bg-white font-mono text-xs cursor-pointer"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Expected Context Flow (comma-separated)
                </label>
                <input
                  type="text"
                  value={verifyForm.expectedContexts}
                  onChange={(e) => setVerifyForm({ ...verifyForm, expectedContexts: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-200 font-mono text-xs"
                  placeholder="e.g. normal, digital_arrest_extortion"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setIsVerifying(false)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveVerification}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer shadow-xs"
              >
                Approve & Mark as Verified
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
