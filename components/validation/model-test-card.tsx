/**
 * Model Test Card Component
 *
 * Displays individual model test results with expandable details
 */

'use client';

import { useState } from 'react';
import { TestResult } from '@/lib/validation/types';
import Image from 'next/image';

interface ModelTestCardProps {
  result: TestResult;
}

export default function ModelTestCard({ result }: ModelTestCardProps) {
  const [expanded, setExpanded] = useState(false);

  // Truncate content for preview
  const contentPreview = result.content
    ? result.content.substring(0, 200) + (result.content.length > 200 ? '...' : '')
    : '';

  // Status styles
  const statusStyles: Record<string, string> = {
    pending: 'border-gray-200 bg-gray-50',
    running: 'border-blue-200 bg-blue-50',
    success: 'border-green-200 bg-green-50',
    failed: 'border-red-200 bg-red-50',
    skipped: 'border-yellow-200 bg-yellow-50',
    untested: 'border-purple-200 bg-purple-50',
  };

  const statusBadgeStyles: Record<string, string> = {
    pending: 'bg-gray-100 text-gray-700',
    running: 'bg-blue-100 text-blue-700',
    success: 'bg-green-100 text-green-700',
    failed: 'bg-red-100 text-red-700',
    skipped: 'bg-yellow-100 text-yellow-700',
    untested: 'bg-purple-100 text-purple-700',
  };

  return (
    <div
      className={`p-4 rounded-lg border-2 ${statusStyles[result.status]} transition-all`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 truncate">{result.modelLabel}</h3>
          <p className="text-xs text-gray-500 font-mono truncate">{result.model}</p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`px-2 py-1 rounded text-xs font-medium ${
              statusBadgeStyles[result.status]
            }`}
          >
            {result.status === 'running' && '⏳ '}
            {result.status === 'success' && '✓ '}
            {result.status === 'failed' && '✗ '}
            {result.status === 'skipped' && '⊘ '}
            {result.status === 'untested' && '⚠ '}
            {result.status.charAt(0).toUpperCase() + result.status.slice(1)}
          </span>
          <span
            className={`px-2 py-1 rounded text-xs font-medium ${
              result.type === 'image'
                ? 'bg-purple-100 text-purple-700'
                : 'bg-blue-100 text-blue-700'
            }`}
          >
            {result.type === 'image' ? '🎨 Image' : '💬 Text'}
          </span>
        </div>
      </div>

      {/* Metrics (for successful tests) */}
      {result.status === 'success' && (
        <div className="flex gap-4 mb-2">
          {result.latency !== undefined && (
            <div className="text-xs text-gray-600">
              <span className="font-medium">Latency:</span> {result.latency}ms
            </div>
          )}
          {result.tokens !== undefined && (
            <div className="text-xs text-gray-600">
              <span className="font-medium">Tokens:</span> {result.tokens}
            </div>
          )}
        </div>
      )}

      {/* Running indicator */}
      {result.status === 'running' && (
        <div className="flex items-center gap-2 text-sm text-blue-700">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span>Testing in progress...</span>
        </div>
      )}

      {/* Error message (for failed/skipped tests) */}
      {(result.status === 'failed' || result.status === 'skipped') && result.error && (
        <div className="mb-2">
          <p className="text-sm font-medium text-red-700 mb-1">{result.error}</p>
        </div>
      )}

      {/* Content preview (for successful text tests) */}
      {result.status === 'success' && result.content && !expanded && (
        <div className="mb-2">
          <p className="text-sm text-gray-700 bg-white p-3 rounded border border-gray-200">
            {contentPreview}
          </p>
        </div>
      )}

      {/* Image preview (for successful image tests) */}
      {result.status === 'success' && result.imageUrl && !expanded && (
        <div className="mb-2">
          <div className="relative w-full h-48 bg-gray-100 rounded border border-gray-200">
            <Image
              src={result.imageUrl}
              alt="Generated image"
              fill
              className="object-contain rounded"
            />
          </div>
        </div>
      )}

      {/* Expanded details */}
      {expanded && (
        <div className="mb-2 space-y-2">
          {/* Full content for text */}
          {result.content && (
            <div>
              <div className="text-xs font-medium text-gray-700 mb-1">
                Full Response:
              </div>
              <div className="text-sm text-gray-700 bg-white p-3 rounded border border-gray-200 max-h-96 overflow-y-auto whitespace-pre-wrap">
                {result.content}
              </div>
            </div>
          )}

          {/* Full image for image */}
          {result.imageUrl && (
            <div>
              <div className="text-xs font-medium text-gray-700 mb-1">
                Generated Image:
              </div>
              <div className="relative w-full h-96 bg-gray-100 rounded border border-gray-200">
                <Image
                  src={result.imageUrl}
                  alt="Generated image"
                  fill
                  className="object-contain rounded"
                />
              </div>
            </div>
          )}

          {/* Error details */}
          {result.errorDetails && (
            <div>
              <div className="text-xs font-medium text-gray-700 mb-1">
                Error Details:
              </div>
              <div className="text-xs text-gray-700 bg-red-50 p-3 rounded border border-red-200 max-h-64 overflow-y-auto font-mono whitespace-pre-wrap">
                {result.errorDetails}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div>
            <div className="text-xs font-medium text-gray-700 mb-1">Metadata:</div>
            <div className="text-xs text-gray-600 bg-white p-3 rounded border border-gray-200">
              <div>
                <span className="font-medium">Provider:</span> {result.provider}
              </div>
              <div>
                <span className="font-medium">Model:</span> {result.model}
              </div>
              <div>
                <span className="font-medium">Type:</span> {result.type}
              </div>
              <div>
                <span className="font-medium">Status:</span> {result.status}
              </div>
              {result.latency !== undefined && (
                <div>
                  <span className="font-medium">Latency:</span> {result.latency}ms
                </div>
              )}
              {result.tokens !== undefined && (
                <div>
                  <span className="font-medium">Tokens:</span> {result.tokens}
                </div>
              )}
              <div>
                <span className="font-medium">Timestamp:</span>{' '}
                {new Date(result.timestamp).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Expand/Collapse button */}
      {(result.status === 'success' ||
        result.status === 'failed' ||
        result.status === 'skipped') && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          {expanded ? '▲ Show Less' : '▼ Show Details'}
        </button>
      )}
    </div>
  );
}
