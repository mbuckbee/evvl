/**
 * Test Summary Component
 *
 * Displays overall statistics and progress for validation tests
 */

'use client';

import { TestResult, TestSummary as TestSummaryType } from '@/lib/validation/types';

interface TestSummaryProps {
  results: Map<string, TestResult>;
  testing: boolean;
  totalModels: number;
}

export default function TestSummary({
  results,
  testing,
  totalModels,
}: TestSummaryProps) {
  // Calculate summary statistics
  const summary: TestSummaryType = {
    total: totalModels,
    tested: 0,
    running: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    avgLatency: 0,
    totalTokens: 0,
  };

  let totalLatency = 0;
  let latencyCount = 0;

  results.forEach(result => {
    if (result.status === 'running') summary.running++;
    else if (result.status === 'success') summary.passed++;
    else if (result.status === 'failed') summary.failed++;
    else if (result.status === 'skipped') summary.skipped++;

    if (result.status !== 'pending') {
      summary.tested++;
    }

    if (result.latency) {
      totalLatency += result.latency;
      latencyCount++;
    }

    if (result.tokens) {
      summary.totalTokens += result.tokens;
    }
  });

  summary.avgLatency = latencyCount > 0 ? Math.round(totalLatency / latencyCount) : 0;

  const progressPercent = summary.total > 0
    ? Math.round((summary.tested / summary.total) * 100)
    : 0;

  if (results.size === 0 && !testing) {
    return null;
  }

  return (
    <div className="card p-6 mb-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Test Summary</h2>

      {/* Progress Bar */}
      {testing && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Testing Progress
            </span>
            <span className="text-sm text-gray-600">
              {summary.tested} of {summary.total} models
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-blue-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Statistics Grid */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="p-4 rounded-lg bg-gray-50">
          <div className="text-sm font-medium text-gray-600 mb-1">Total</div>
          <div className="text-2xl font-bold text-gray-900">{summary.total}</div>
        </div>

        <div className="p-4 rounded-lg bg-green-50">
          <div className="text-sm font-medium text-green-700 mb-1">Passed</div>
          <div className="text-2xl font-bold text-green-900">{summary.passed}</div>
        </div>

        <div className="p-4 rounded-lg bg-red-50">
          <div className="text-sm font-medium text-red-700 mb-1">Failed</div>
          <div className="text-2xl font-bold text-red-900">{summary.failed}</div>
        </div>
      </div>

      {/* Current Status */}
      {testing && summary.running > 0 && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="text-sm text-blue-800">
            Testing in progress... ({summary.running} running)
          </span>
        </div>
      )}
    </div>
  );
}
