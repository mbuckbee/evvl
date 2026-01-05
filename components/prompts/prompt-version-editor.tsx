'use client';

import { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Prompt } from '@/lib/types';

interface PromptVersionEditorProps {
  prompt: Prompt;
  onSave?: (content: string, versionNote?: string) => void;
  onCancel?: () => void;
}

export default function PromptVersionEditor({ prompt, onSave, onCancel }: PromptVersionEditorProps) {
  // Get the current version content
  const currentVersion = prompt.versions.find(v => v.id === prompt.currentVersionId);
  const [content, setContent] = useState(currentVersion?.content || '');
  const [versionNote, setVersionNote] = useState('');

  const handleSave = () => {
    if (!content.trim()) {
      alert('Please enter some prompt content');
      return;
    }
    if (onSave) {
      onSave(content.trim(), versionNote.trim() || undefined);
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-800">
      {/* Header - Fixed height */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {prompt.name}
        </h2>
        {onCancel && (
          <button
            onClick={onCancel}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Form - Grows to fill space */}
      <div className="flex-1 flex flex-col p-6 overflow-hidden">
        <div className="flex flex-col h-full space-y-4">
          {/* Prompt Text - Grows to fill available space */}
          <div className="flex-1 flex flex-col min-h-0">
            <label className="flex-shrink-0 block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Prompt Text *
            </label>

            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter your prompt here... Use {{variables}} for data set substitution"
              className="flex-1 w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono"
            />

            <p className="flex-shrink-0 mt-2 text-xs text-gray-500 dark:text-gray-400">
              Tip: Use {'{'}{'{'} and {'}'}{'}'}  for variables like {'{'}{'{'} text {'}'}{'}'} or {'{'}{'{'}  tone {'}'}{'}'}
            </p>
          </div>

          {/* Version Note - Fixed height */}
          <div className="flex-shrink-0">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Version Note (optional)
            </label>
            <input
              type="text"
              value={versionNote}
              onChange={(e) => setVersionNote(e.target.value)}
              placeholder="What changed in this version?"
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Actions - Fixed height */}
      <div className="flex-shrink-0 px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex gap-3">
        {onCancel && (
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Cancel
          </button>
        )}
        <button
          onClick={handleSave}
          className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Save New Version
        </button>
      </div>
    </div>
  );
}
