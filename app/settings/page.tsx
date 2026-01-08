'use client';

import { useState, useEffect } from 'react';
import { Cog6ToothIcon } from '@heroicons/react/24/outline';
import { saveApiKeys, loadApiKeys, clearApiKeys } from '@/lib/storage';
import { getRuntimeEnvironment, RuntimeEnvironment } from '@/lib/environment';
import { ApiKeys } from '@/lib/types';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const router = useRouter();
  const [keys, setKeys] = useState<ApiKeys>({});
  const [saved, setSaved] = useState(false);
  const [environment, setEnvironment] = useState<RuntimeEnvironment>('web');

  useEffect(() => {
    const loaded = loadApiKeys();
    setKeys(loaded);
    setEnvironment(getRuntimeEnvironment());
  }, []);

  const handleSave = () => {
    saveApiKeys(keys);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      router.push('/');
    }, 1500);
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
    <div className="h-screen flex flex-col bg-white dark:bg-gray-900">
      {/* Navigation */}
      <nav className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-6 py-3">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-gray-900 dark:text-white hover:opacity-80 transition-opacity">
            Evvl
          </Link>
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Cog6ToothIcon className="h-5 w-5" />
            <span>Settings</span>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="w-[80%] mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold mb-6 text-gray-900 dark:text-white">Settings</h1>

          {/* Privacy Note */}
          <div className="mb-8 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-300">
              <strong>Privacy Note:</strong> Your API keys are stored locally {environment === 'tauri' ? 'on your device' : "in your browser's localStorage"}.
              {environment === 'tauri' ? (
                <> When you generate outputs, your keys are sent directly to the AI providers from your device. No keys are sent to or stored on any Evvl server.</>
              ) : (
                <> When you generate outputs, your keys are sent through our server to reach the AI providers, but they are automatically redacted from all server logs and never stored in any database.</>
              )}
            </p>
          </div>

      <div className="card p-8 space-y-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <div>
          <label
            htmlFor="openai"
            className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
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
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {keys.openai && (
              <button
                onClick={() => handleTest('openai')}
                className="px-4 py-2.5 bg-green-600 dark:bg-green-500 text-white rounded-lg font-medium shadow-sm hover:bg-green-700 dark:hover:bg-green-600 transition-all duration-200 whitespace-nowrap"
              >
                Test
              </button>
            )}
          </div>
          <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">
            Get your API key from{' '}
            <a
              href="https://platform.openai.com/api-keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              platform.openai.com
            </a>
          </p>
        </div>

        <div>
          <label
            htmlFor="anthropic"
            className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
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
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {keys.anthropic && (
              <button
                onClick={() => handleTest('anthropic')}
                className="px-4 py-2.5 bg-green-600 dark:bg-green-500 text-white rounded-lg font-medium shadow-sm hover:bg-green-700 dark:hover:bg-green-600 transition-all duration-200 whitespace-nowrap"
              >
                Test
              </button>
            )}
          </div>
          <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">
            Get your API key from{' '}
            <a
              href="https://console.anthropic.com/settings/keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              console.anthropic.com
            </a>
          </p>
        </div>

        <div>
          <label
            htmlFor="openrouter"
            className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
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
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {keys.openrouter && (
              <button
                onClick={() => handleTest('openrouter')}
                className="px-4 py-2.5 bg-green-600 dark:bg-green-500 text-white rounded-lg font-medium shadow-sm hover:bg-green-700 dark:hover:bg-green-600 transition-all duration-200 whitespace-nowrap"
              >
                Test
              </button>
            )}
          </div>
          <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">
            Get your API key from{' '}
            <a
              href="https://openrouter.ai/keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              openrouter.ai
            </a>
          </p>
        </div>

        <div>
          <label
            htmlFor="gemini"
            className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
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
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {keys.gemini && (
              <button
                onClick={() => handleTest('gemini')}
                className="px-4 py-2.5 bg-green-600 dark:bg-green-500 text-white rounded-lg font-medium shadow-sm hover:bg-green-700 dark:hover:bg-green-600 transition-all duration-200 whitespace-nowrap"
              >
                Test
              </button>
            )}
          </div>
          <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">
            Get your API key from{' '}
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              aistudio.google.com
            </a>
          </p>
        </div>

        <div className="flex justify-between items-center pt-6">
          <Link
            href="/"
            className="px-6 py-2 border-2 border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400 rounded-lg font-medium hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors flex items-center gap-1"
          >
            <span>←</span> Back to Eval
          </Link>
          <div className="flex gap-3">
            <button
              onClick={handleClear}
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Clear All
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
            >
              Save Keys
            </button>
          </div>
        </div>

        {saved && (
          <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-sm font-medium text-green-800 dark:text-green-300">
                API keys saved successfully!
              </p>
            </div>
          </div>
        )}
      </div>
        </div>
      </div>
    </div>
  );
}
