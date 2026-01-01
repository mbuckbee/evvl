'use client';

import { useState, useEffect } from 'react';
import { saveApiKeys, loadApiKeys, clearApiKeys } from '@/lib/storage';
import { ApiKeys } from '@/lib/types';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const router = useRouter();
  const [keys, setKeys] = useState<ApiKeys>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const loaded = loadApiKeys();
    setKeys(loaded);
  }, []);

  const handleSave = () => {
    saveApiKeys(keys);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleClear = () => {
    clearApiKeys();
    setKeys({});
  };

  const handleTest = (provider: 'openai' | 'anthropic' | 'openrouter' | 'gemini') => {
    // Save keys first
    saveApiKeys(keys);
    // Navigate to test page
    const apiKey = keys[provider];
    if (apiKey) {
      router.push(`/test?provider=${provider}&key=${encodeURIComponent(apiKey)}`);
    }
  };

  return (
    <div className="w-[80%] mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-10 text-gray-900">Settings</h1>

      <div className="card p-8 space-y-6">
        <div>
          <label
            htmlFor="openai"
            className="block text-sm font-semibold text-gray-700 mb-2"
          >
            OpenAI API Key
          </label>
          <div className="flex gap-2">
            <input
              id="openai"
              type="text"
              value={keys.openai || ''}
              onChange={(e) => setKeys({ ...keys, openai: e.target.value })}
              placeholder="sk-..."
              className="input"
            />
            {keys.openai && (
              <button
                onClick={() => handleTest('openai')}
                className="px-4 py-2.5 bg-green-600 text-white rounded-lg font-medium shadow-sm hover:bg-green-700 transition-all duration-200 whitespace-nowrap"
              >
                Test
              </button>
            )}
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Get your API key from{' '}
            <a
              href="https://platform.openai.com/api-keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              platform.openai.com
            </a>
          </p>
        </div>

        <div>
          <label
            htmlFor="anthropic"
            className="block text-sm font-semibold text-gray-700 mb-2"
          >
            Anthropic API Key
          </label>
          <div className="flex gap-2">
            <input
              id="anthropic"
              type="text"
              value={keys.anthropic || ''}
              onChange={(e) => setKeys({ ...keys, anthropic: e.target.value })}
              placeholder="sk-ant-..."
              className="input"
            />
            {keys.anthropic && (
              <button
                onClick={() => handleTest('anthropic')}
                className="px-4 py-2.5 bg-green-600 text-white rounded-lg font-medium shadow-sm hover:bg-green-700 transition-all duration-200 whitespace-nowrap"
              >
                Test
              </button>
            )}
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Get your API key from{' '}
            <a
              href="https://console.anthropic.com/settings/keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              console.anthropic.com
            </a>
          </p>
        </div>

        <div>
          <label
            htmlFor="openrouter"
            className="block text-sm font-semibold text-gray-700 mb-2"
          >
            OpenRouter API Key
          </label>
          <div className="flex gap-2">
            <input
              id="openrouter"
              type="text"
              value={keys.openrouter || ''}
              onChange={(e) => setKeys({ ...keys, openrouter: e.target.value })}
              placeholder="sk-or-..."
              className="input"
            />
            {keys.openrouter && (
              <button
                onClick={() => handleTest('openrouter')}
                className="px-4 py-2.5 bg-green-600 text-white rounded-lg font-medium shadow-sm hover:bg-green-700 transition-all duration-200 whitespace-nowrap"
              >
                Test
              </button>
            )}
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Get your API key from{' '}
            <a
              href="https://openrouter.ai/keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              openrouter.ai
            </a>
          </p>
        </div>

        <div>
          <label
            htmlFor="gemini"
            className="block text-sm font-semibold text-gray-700 mb-2"
          >
            Google Gemini API Key
          </label>
          <div className="flex gap-2">
            <input
              id="gemini"
              type="text"
              value={keys.gemini || ''}
              onChange={(e) => setKeys({ ...keys, gemini: e.target.value })}
              placeholder="AIza..."
              className="input"
            />
            {keys.gemini && (
              <button
                onClick={() => handleTest('gemini')}
                className="px-4 py-2.5 bg-green-600 text-white rounded-lg font-medium shadow-sm hover:bg-green-700 transition-all duration-200 whitespace-nowrap"
              >
                Test
              </button>
            )}
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Get your API key from{' '}
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              aistudio.google.com
            </a>
          </p>
        </div>

        <div className="flex justify-between items-center pt-6">
          <Link
            href="/"
            className="px-6 py-2 border-2 border-blue-600 text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors flex items-center gap-1"
          >
            <span>←</span> Back to Eval
          </Link>
          <div className="flex gap-3">
            <button
              onClick={handleClear}
              className="btn-secondary"
            >
              Clear All
            </button>
            <button
              onClick={handleSave}
              className="btn-primary"
            >
              Save Keys
            </button>
          </div>
        </div>

        {saved && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-sm font-medium text-green-800">
                API keys saved successfully!
              </p>
            </div>
          </div>
        )}

        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Privacy Note:</strong> Your API keys are stored locally in your browser&apos;s localStorage.
            When you generate outputs, your keys are sent through our server to reach the AI providers, but
            they are automatically redacted from all server logs and never stored in any database.
          </p>
        </div>
      </div>
    </div>
  );
}
