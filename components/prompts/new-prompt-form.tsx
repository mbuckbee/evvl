'use client';

import { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface NewPromptFormProps {
  onCancel?: () => void;
  onCreate?: (name: string, content: string) => void;
}

export default function NewPromptForm({ onCancel, onCreate }: NewPromptFormProps) {
  const [name, setName] = useState('');
  const [content, setContent] = useState('');

  const handleCreate = () => {
    if (!name.trim() || !content.trim()) {
      alert('Please enter a prompt name and content');
      return;
    }
    if (onCreate) onCreate(name.trim(), content.trim());
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-800">
      {/* Header - Fixed height */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          New Prompt
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
          {/* Name - Fixed height */}
          <div className="flex-shrink-0">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Prompt Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Summarize Article"
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Prompt Content - Grows to fill remaining space */}
          <div className="flex-1 flex flex-col min-h-0">
            <label className="flex-shrink-0 block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Prompt Text *
            </label>

            {/* Textarea - Grows to fill available space */}
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter your prompt here... Use {{variables}} for data set substitution"
              className="flex-1 w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono"
            />

            {/* Help text - Fixed height */}
            <p className="flex-shrink-0 mt-2 text-xs text-gray-500 dark:text-gray-400">
              Tip: Use {'{'}{'{'} and {'}'}{'}'}  for variables like {'{'}{'{'} text {'}'}{'}'} or {'{'}{'{'}  tone {'}'}{'}'}
            </p>
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
          onClick={handleCreate}
          className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Save
        </button>
      </div>
    </div>
  );
}
