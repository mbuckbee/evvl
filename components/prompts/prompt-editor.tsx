'use client';

import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Prompt, PromptVersion } from '@/lib/types';
import { savePrompt } from '@/lib/storage';

interface PromptEditorProps {
  projectId: string;
  prompt?: Prompt; // If provided, we're editing. If not, we're creating.
  onSave?: (prompt: Prompt) => void;
  onCancel?: () => void;
}

export default function PromptEditor({ projectId, prompt, onSave, onCancel }: PromptEditorProps) {
  const [name, setName] = useState(prompt?.name || '');
  const [description, setDescription] = useState(prompt?.description || '');
  const [content, setContent] = useState(
    prompt ? prompt.versions.find(v => v.id === prompt.currentVersionId)?.content || '' : ''
  );
  const [systemPrompt, setSystemPrompt] = useState(
    prompt ? prompt.versions.find(v => v.id === prompt.currentVersionId)?.systemPrompt || '' : ''
  );
  const [versionNote, setVersionNote] = useState('');

  const handleSave = () => {
    if (!name.trim() || !content.trim()) {
      alert('Please provide a name and prompt content');
      return;
    }

    if (prompt) {
      // Editing existing prompt - create new version
      const newVersionNumber = prompt.versions.length + 1;
      const newVersion: PromptVersion = {
        id: uuidv4(),
        versionNumber: newVersionNumber,
        content: content.trim(),
        systemPrompt: systemPrompt.trim() || undefined,
        note: versionNote.trim() || `Version ${newVersionNumber}`,
        createdAt: Date.now(),
      };

      const updatedPrompt: Prompt = {
        ...prompt,
        name: name.trim(),
        description: description.trim() || undefined,
        versions: [...prompt.versions, newVersion],
        currentVersionId: newVersion.id,
        updatedAt: Date.now(),
      };

      savePrompt(updatedPrompt);
      if (onSave) onSave(updatedPrompt);
    } else {
      // Creating new prompt
      const versionId = uuidv4();
      const newPrompt: Prompt = {
        id: uuidv4(),
        projectId,
        name: name.trim(),
        description: description.trim() || undefined,
        versions: [
          {
            id: versionId,
            versionNumber: 1,
            content: content.trim(),
            systemPrompt: systemPrompt.trim() || undefined,
            note: 'Initial version',
            createdAt: Date.now(),
          },
        ],
        currentVersionId: versionId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      savePrompt(newPrompt);
      if (onSave) onSave(newPrompt);
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-800">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {prompt ? 'Edit Prompt' : 'New Prompt'}
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

      {/* Form */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {/* Name */}
        <div>
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

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Description (optional)
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What does this prompt do?"
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Prompt Content */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Prompt *
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Enter your prompt here... Use {{variables}} for data set substitution"
            rows={8}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Tip: Use {'{'}{'{'} and {'}'}{'}'}  for variables like {'{'}{'{'} text {'}'}{'}'} or {'{'}{'{'}  tone {'}'}{'}'}
          </p>
        </div>

        {/* System Prompt */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            System Prompt (optional)
          </label>
          <textarea
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            placeholder="You are a helpful assistant..."
            rows={3}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
        </div>

        {/* Version Note (only when editing) */}
        {prompt && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Version Note
            </label>
            <input
              type="text"
              value={versionNote}
              onChange={(e) => setVersionNote(e.target.value)}
              placeholder="What changed in this version?"
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex gap-3">
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
          {prompt ? 'Save New Version' : 'Create Prompt'}
        </button>
      </div>
    </div>
  );
}
