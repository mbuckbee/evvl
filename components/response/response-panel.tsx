'use client';

import { ClockIcon, CpuChipIcon, PhotoIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';

interface ResponsePanelProps {
  output?: {
    content: string;
    imageUrl?: string;
    tokens?: number;
    latency?: number;
    error?: string;
    type?: 'text' | 'image';
  };
  isGenerating?: boolean;
}

export default function ResponsePanel({ output, isGenerating = false }: ResponsePanelProps) {
  if (!output && !isGenerating) {
    return (
      <div className="h-full flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center max-w-md px-6">
          <div className="mx-auto w-16 h-16 mb-4 text-gray-300 dark:text-gray-600">
            <svg
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No response yet
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Enter a prompt and click Send to get a response from your selected AI model.
          </p>
        </div>
      </div>
    );
  }

  if (isGenerating) {
    return (
      <div className="h-full flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mb-4" />
          <p className="text-sm text-gray-600 dark:text-gray-400">Generating response...</p>
        </div>
      </div>
    );
  }

  if (output?.error) {
    return (
      <div className="h-full flex flex-col bg-white dark:bg-gray-900">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Response</h2>
        </div>

        {/* Error Content */}
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-400 mb-2">
                Error
              </h3>
              <p className="text-sm text-red-700 dark:text-red-300">{output.error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      {/* Header with Metadata */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Response</h2>
          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
            {output?.tokens !== undefined && (
              <div className="flex items-center gap-1.5">
                <CpuChipIcon className="h-4 w-4" />
                <span>{output.tokens.toLocaleString()} tokens</span>
              </div>
            )}
            {output?.latency !== undefined && (
              <div className="flex items-center gap-1.5">
                <ClockIcon className="h-4 w-4" />
                <span>{(output.latency / 1000).toFixed(2)}s</span>
              </div>
            )}
            {output?.type && (
              <div className="flex items-center gap-1.5">
                {output.type === 'image' ? (
                  <PhotoIcon className="h-4 w-4" />
                ) : (
                  <DocumentTextIcon className="h-4 w-4" />
                )}
                <span className="capitalize">{output.type}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {output?.type === 'image' && output.imageUrl ? (
          <div className="space-y-4">
            {/* Image Display */}
            <div className="relative bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
              <Image
                src={output.imageUrl}
                alt="Generated image"
                width={1024}
                height={1024}
                className="w-full h-auto"
                unoptimized
              />
            </div>

            {/* Revised Prompt (if available) */}
            {output.content && output.content !== output.imageUrl && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Revised Prompt
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  {output.content}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="prose dark:prose-invert max-w-none">
            <pre className="whitespace-pre-wrap font-sans text-sm text-gray-900 dark:text-white">
              {output?.content}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
