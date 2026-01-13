'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ClockIcon,
  DocumentTextIcon,
  PhotoIcon,
  ClipboardIcon,
  CheckIcon,
  BoltIcon
} from '@heroicons/react/24/outline';
import type { SharedEvaluation, SharedResponse } from '@/lib/share-types';
import ReactMarkdown from 'react-markdown';

interface ShareViewProps {
  share: SharedEvaluation;
}

// Provider colors for cards
const PROVIDER_COLORS: Record<string, string> = {
  openai: 'border-green-500',
  anthropic: 'border-orange-500',
  openrouter: 'border-blue-500',
  gemini: 'border-cyan-500',
  default: 'border-gray-400'
};

function getProviderColor(provider: string): string {
  return PROVIDER_COLORS[provider.toLowerCase()] || PROVIDER_COLORS.default;
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatExpiry(timestamp: number): string {
  const now = Date.now();
  const diff = timestamp - now;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (days > 0) {
    return `${days} day${days !== 1 ? 's' : ''} remaining`;
  } else if (hours > 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''} remaining`;
  } else {
    return 'Expiring soon';
  }
}

function ResponseCard({ response }: { response: SharedResponse }) {
  const providerColor = getProviderColor(response.provider);
  const isImage = response.type === 'image';

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border-t-4 ${providerColor} shadow-sm overflow-hidden`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white">
              {response.modelName || response.model}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
              {response.provider}
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
            {response.latency && (
              <span className="flex items-center gap-1">
                <BoltIcon className="h-3.5 w-3.5" />
                {(response.latency / 1000).toFixed(2)}s
              </span>
            )}
            {response.tokens && (
              <span>{response.tokens} tokens</span>
            )}
            <span className="flex items-center gap-1">
              {isImage ? (
                <PhotoIcon className="h-3.5 w-3.5" />
              ) : (
                <DocumentTextIcon className="h-3.5 w-3.5" />
              )}
              {response.type}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {isImage ? (
          <div className="space-y-3">
            <div className="bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={response.content}
                alt="Generated image"
                className="w-full h-auto"
              />
            </div>
          </div>
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown>{response.content}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ShareView({ share }: ShareViewProps) {
  const [copied, setCopied] = useState(false);

  // Track view on mount
  useEffect(() => {
    fetch(`/api/share/${share.id}/view`, { method: 'POST' }).catch(() => {
      // Ignore tracking errors
    });
  }, [share.id]);

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/evvl-logo.png"
                alt="Evvl"
                width={32}
                height={32}
                className="rounded"
              />
              <span className="font-semibold text-gray-900 dark:text-white">Evvl</span>
            </Link>

            <button
              onClick={handleCopyLink}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              {copied ? (
                <>
                  <CheckIcon className="h-4 w-4 text-green-600" />
                  <span className="text-green-600">Copied!</span>
                </>
              ) : (
                <>
                  <ClipboardIcon className="h-4 w-4" />
                  <span>Copy Link</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Title & Meta */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {share.title || share.prompt.name || 'Shared Evaluation'}
          </h1>
          {share.description && (
            <p className="text-gray-600 dark:text-gray-300 mb-4">{share.description}</p>
          )}
          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <ClockIcon className="h-4 w-4" />
              Created {formatDate(share.createdAt)}
            </span>
            <span className="text-orange-600 dark:text-orange-400">
              {formatExpiry(share.expiresAt)}
            </span>
          </div>
        </div>

        {/* Prompt */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm mb-8 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <h2 className="font-medium text-gray-900 dark:text-white">Prompt</h2>
          </div>
          <div className="p-4">
            {share.prompt.systemPrompt && (
              <div className="mb-4">
                <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                  System Prompt
                </h3>
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 text-sm text-gray-700 dark:text-gray-300">
                  {share.prompt.systemPrompt}
                </div>
              </div>
            )}
            <div>
              {share.prompt.systemPrompt && (
                <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                  User Prompt
                </h3>
              )}
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {share.prompt.content}
              </div>
            </div>

            {/* Variables if present */}
            {share.variables && Object.keys(share.variables).length > 0 && (
              <div className="mt-4">
                <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                  Variables
                </h3>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(share.variables).map(([key, value]) => (
                    <span
                      key={key}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs"
                    >
                      <span className="font-medium">{key}:</span>
                      <span className="truncate max-w-[200px]">{value}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Responses */}
        <div className="mb-4">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Responses ({share.responses.length})
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {share.responses.map((response, index) => (
              <ResponseCard key={index} response={response} />
            ))}
          </div>
        </div>

        {/* Footer CTA */}
        <div className="text-center mt-12 py-8 border-t border-gray-200 dark:border-gray-700">
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Want to run your own AI model comparisons?
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            Try Evvl Free
          </Link>
        </div>
      </main>
    </div>
  );
}
