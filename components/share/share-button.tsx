'use client';

import { useState } from 'react';
import {
  ShareIcon,
  XMarkIcon,
  ClipboardIcon,
  CheckIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import type { CreateShareRequest, CreateShareResult, SharedResponse } from '@/lib/share-types';

interface ShareButtonProps {
  promptName: string;
  promptContent: string;
  systemPrompt?: string;
  responses: Array<{
    provider: string;
    model: string;
    modelName?: string;
    type: 'text' | 'image';
    content: string;
    imageUrl?: string;
    latency?: number;
    tokens?: number;
  }>;
  variables?: Record<string, string>;
  disabled?: boolean;
}

export default function ShareButton({
  promptName,
  promptContent,
  systemPrompt,
  responses,
  variables,
  disabled = false
}: ShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Transform responses to share format
      const shareResponses: SharedResponse[] = responses.map(r => ({
        provider: r.provider,
        model: r.model,
        modelName: r.modelName || r.model,
        type: r.type,
        // For images, use the imageUrl or base64 content
        content: r.type === 'image' ? (r.imageUrl || r.content) : r.content,
        latency: r.latency,
        tokens: r.tokens
      }));

      const request: CreateShareRequest = {
        prompt: {
          name: promptName,
          content: promptContent,
          systemPrompt
        },
        responses: shareResponses,
        variables
      };

      const res = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      });

      const result: CreateShareResult = await res.json();

      if (result.success) {
        setShareUrl(result.shareUrl);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to create share. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    if (shareUrl) {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setShareUrl(null);
    setError(null);
  };

  const canShare = responses.length > 0 && !disabled;

  return (
    <>
      <button
        onClick={() => {
          setIsOpen(true);
          handleShare();
        }}
        disabled={!canShare}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-colors ${
          canShare
            ? 'bg-blue-600 hover:bg-blue-700 text-white'
            : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
        }`}
        title={!canShare ? 'Generate responses first to share' : 'Share this evaluation'}
      >
        <ShareIcon className="h-4 w-4" />
        Share
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={handleClose}
          />

          {/* Modal content */}
          <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>

            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Share Evaluation
            </h2>

            {isLoading ? (
              <div className="flex flex-col items-center py-8">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4" />
                <p className="text-gray-600 dark:text-gray-300">Creating share link...</p>
              </div>
            ) : error ? (
              <div className="py-4">
                <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                  </div>
                </div>
                <button
                  onClick={handleShare}
                  className="mt-4 w-full py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-sm font-medium transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : shareUrl ? (
              <div className="space-y-4">
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Your evaluation is ready to share! The link will expire in 7 days.
                </p>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={shareUrl}
                    readOnly
                    className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm"
                  />
                  <button
                    onClick={handleCopy}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      copied
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {copied ? (
                      <>
                        <CheckIcon className="h-4 w-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <ClipboardIcon className="h-4 w-4" />
                        Copy
                      </>
                    )}
                  </button>
                </div>

                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {responses.length} response{responses.length !== 1 ? 's' : ''} included
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </>
  );
}
