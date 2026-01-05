'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon, PencilIcon, CheckIcon } from '@heroicons/react/24/outline';
import { Prompt } from '@/lib/types';

interface PromptVersionViewProps {
  prompt: Prompt;
  onCancel?: () => void;
  onSave?: (content: string) => void;
  onSaveAsNewVersion?: (content: string, versionNote?: string) => void;
  onNameUpdate?: (name: string) => void;
}

export default function PromptVersionView({ prompt, onCancel, onSave, onSaveAsNewVersion, onNameUpdate }: PromptVersionViewProps) {
  // Always show the latest version (highest version number)
  const latestVersion = prompt.versions.reduce((latest, current) =>
    current.versionNumber > latest.versionNumber ? current : latest
  , prompt.versions[0]);

  const [content, setContent] = useState(latestVersion?.content || '');
  const [isEditingName, setIsEditingName] = useState(false);
  const [name, setName] = useState(prompt.name);
  const [isEnteringVersionNote, setIsEnteringVersionNote] = useState(false);
  const [versionNote, setVersionNote] = useState('');

  // Update content when prompt changes (user clicks different prompt)
  useEffect(() => {
    setContent(latestVersion?.content || '');
    setName(prompt.name);
  }, [prompt.id, latestVersion?.content, prompt.name]);

  const handleSave = () => {
    if (!content.trim()) {
      alert('Please enter some prompt content');
      return;
    }
    if (onSave) {
      onSave(content.trim());
    }
  };

  const handleSaveAsNewVersionClick = () => {
    setIsEnteringVersionNote(true);
  };

  const handleSaveAsNewVersion = () => {
    if (!content.trim()) {
      alert('Please enter some prompt content');
      return;
    }
    if (onSaveAsNewVersion) {
      onSaveAsNewVersion(content.trim(), versionNote.trim() || undefined);
    }
    setIsEnteringVersionNote(false);
    setVersionNote('');
  };

  const handleNameSave = () => {
    if (!name.trim()) {
      alert('Please enter a prompt name');
      return;
    }
    if (onNameUpdate) {
      onNameUpdate(name.trim());
    }
    setIsEditingName(false);
  };

  const handleNameClick = () => {
    setIsEditingName(true);
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-800">
      <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        {isEditingName ? (
          <div className="flex items-center gap-2 flex-1">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleNameSave();
                }
              }}
              className="flex-1 px-3 py-1 text-lg font-semibold border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
            <button
              onClick={handleNameSave}
              className="p-1 text-green-600 hover:text-green-700 dark:text-green-500 dark:hover:text-green-400"
            >
              <CheckIcon className="h-5 w-5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 cursor-pointer group" onClick={handleNameClick}>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {prompt.name}
            </h2>
            <PencilIcon className="h-4 w-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" />
          </div>
        )}
        {onCancel && (
          <button
            onClick={onCancel}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        )}
      </div>

      <div className="flex-1 flex flex-col p-6 overflow-hidden">
        <div className="flex flex-col h-full">
          <div className="flex-1 flex flex-col min-h-0">
            <label className="flex-shrink-0 block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              v{latestVersion?.versionNumber || 1} Prompt Text
            </label>

            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter your prompt here... Use {{variables}} for data set substitution"
              className="flex-1 w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono"
            />

            <p className="flex-shrink-0 mt-2 text-xs text-gray-500 dark:text-gray-400">
              Tip: Use {'{{'}  and {'}}'}  for variables like {'{{'} text {'}}'} or {'{{'}  tone {'}}'}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-shrink-0 px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex gap-3">
        {isEnteringVersionNote ? (
          <>
            <input
              type="text"
              value={versionNote}
              onChange={(e) => setVersionNote(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSaveAsNewVersion();
                } else if (e.key === 'Escape') {
                  setIsEnteringVersionNote(false);
                  setVersionNote('');
                }
              }}
              placeholder="Version Note (optional)"
              className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
            <button
              onClick={handleSaveAsNewVersion}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <CheckIcon className="h-5 w-5" />
            </button>
          </>
        ) : (
          <>
            <button
              onClick={handleSaveAsNewVersionClick}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Save as New Version
            </button>
            <button
              onClick={handleSave}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Save and Refresh
            </button>
          </>
        )}
      </div>
    </div>
  );
}
