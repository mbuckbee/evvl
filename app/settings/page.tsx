'use client';

import { useState, useEffect } from 'react';
import { Cog6ToothIcon } from '@heroicons/react/24/outline';
import { saveApiKeys, loadApiKeys, clearApiKeys, clearProjects, clearAllData, getEnvApiKeys } from '@/lib/storage';
import { getRuntimeEnvironment, RuntimeEnvironment, isTauriEnvironment } from '@/lib/environment';
import { getLocalEndpoint, saveLocalEndpoint } from '@/lib/providers/local-endpoints';
import { checkHealth as checkOllamaHealth } from '@/lib/providers/ollama-fetch';
import { checkHealth as checkLMStudioHealth } from '@/lib/providers/lmstudio-fetch';
import { ApiKeys } from '@/lib/types';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const router = useRouter();
  const [keys, setKeys] = useState<ApiKeys>({});
  const [envKeys, setEnvKeys] = useState<ApiKeys>({});
  const [saved, setSaved] = useState(false);
  const [clearedKeys, setClearedKeys] = useState(false);
  const [clearedProjects, setClearedProjects] = useState(false);
  const [clearedAll, setClearedAll] = useState(false);
  const [environment, setEnvironment] = useState<RuntimeEnvironment>('web');

  // Local provider state (Tauri only)
  const [ollamaEndpoint, setOllamaEndpoint] = useState('http://localhost:11434');
  const [lmstudioEndpoint, setLmstudioEndpoint] = useState('http://localhost:1234');
  const [ollamaStatus, setOllamaStatus] = useState<{ running: boolean; loading: boolean }>({ running: false, loading: false });
  const [lmstudioStatus, setLmstudioStatus] = useState<{ running: boolean; loading: boolean }>({ running: false, loading: false });

  useEffect(() => {
    const loaded = loadApiKeys();
    setKeys(loaded);
    setEnvironment(getRuntimeEnvironment());

    // Load local provider endpoints and env keys if in Tauri
    if (isTauriEnvironment()) {
      const savedOllamaEndpoint = getLocalEndpoint('ollama');
      const savedLmstudioEndpoint = getLocalEndpoint('lmstudio');
      if (savedOllamaEndpoint) setOllamaEndpoint(savedOllamaEndpoint);
      if (savedLmstudioEndpoint) setLmstudioEndpoint(savedLmstudioEndpoint);

      // Check health of local providers
      checkLocalProviderHealth();

      // Load environment variable API keys
      getEnvApiKeys().then(setEnvKeys);
    }
  }, []);

  const checkLocalProviderHealth = async () => {
    // Check Ollama
    setOllamaStatus(prev => ({ ...prev, loading: true }));
    try {
      const ollamaHealth = await checkOllamaHealth(ollamaEndpoint);
      setOllamaStatus({ running: ollamaHealth.running, loading: false });
    } catch {
      setOllamaStatus({ running: false, loading: false });
    }

    // Check LM Studio
    setLmstudioStatus(prev => ({ ...prev, loading: true }));
    try {
      const lmstudioHealth = await checkLMStudioHealth(lmstudioEndpoint);
      setLmstudioStatus({ running: lmstudioHealth.running, loading: false });
    } catch {
      setLmstudioStatus({ running: false, loading: false });
    }
  };

  const handleSaveOllamaEndpoint = () => {
    saveLocalEndpoint('ollama', ollamaEndpoint);
    checkLocalProviderHealth();
  };

  const handleSaveLmstudioEndpoint = () => {
    saveLocalEndpoint('lmstudio', lmstudioEndpoint);
    checkLocalProviderHealth();
  };

  const handleSave = () => {
    saveApiKeys(keys);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      router.push('/');
    }, 1500);
  };

  const handleClearKeys = () => {
    if (confirm('Are you sure you want to clear all API keys? This cannot be undone.')) {
      clearApiKeys();
      setKeys({});
      setClearedKeys(true);
      setTimeout(() => setClearedKeys(false), 3000);
    }
  };

  const handleClearProjects = () => {
    if (confirm('Are you sure you want to clear all projects? This will delete all projects, prompts, datasets, and evaluation history, but keep your API keys. This cannot be undone.')) {
      clearProjects();
      setClearedProjects(true);
      setTimeout(() => {
        setClearedProjects(false);
        window.location.reload();
      }, 2000);
    }
  };

  const handleClearAll = () => {
    if (confirm('Are you sure you want to clear ALL data? This will delete all projects, prompts, datasets, evaluation history, and API keys. This cannot be undone.')) {
      clearAllData();
      setKeys({});
      setClearedAll(true);
      setTimeout(() => {
        setClearedAll(false);
        window.location.reload();
      }, 2000);
    }
  };

  const handleTest = (provider: 'openai' | 'anthropic' | 'openrouter' | 'gemini') => {
    // Save keys first
    saveApiKeys(keys);
    // Navigate to test page - use settings key or fall back to env key
    const apiKey = keys[provider] || envKeys[provider];
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
          {clearedKeys && (
            <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-sm font-medium text-green-800 dark:text-green-300">
                  API keys have been cleared.
                </p>
              </div>
            </div>
          )}
          {clearedProjects && (
            <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-sm font-medium text-green-800 dark:text-green-300">
                  All projects have been cleared.
                </p>
              </div>
            </div>
          )}
          {clearedAll && (
            <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-sm font-medium text-green-800 dark:text-green-300">
                  All data has been cleared.
                </p>
              </div>
            </div>
          )}
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

          {/* Environment Variables Info (Tauri only) */}
          {environment === 'tauri' && (
            <div className="mb-8 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                <strong>Environment Variables:</strong> Evvl automatically detects API keys from standard environment variables
                (<code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">OPENAI_API_KEY</code>,{' '}
                <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">ANTHROPIC_API_KEY</code>,{' '}
                <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">OPENROUTER_API_KEY</code>,{' '}
                <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">GOOGLE_API_KEY</code>).
                Keys entered below will override any environment variables.
              </p>
            </div>
          )}

      <div className="card p-8 space-y-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label
              htmlFor="openai"
              className="block text-sm font-semibold text-gray-700 dark:text-gray-300"
            >
              OpenAI API Key
            </label>
            {environment === 'tauri' && envKeys.openai && !keys.openai && (
              <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full" />
                Using OPENAI_API_KEY
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <input
              id="openai"
              type="text"
              value={keys.openai || ''}
              onChange={(e) => setKeys({ ...keys, openai: e.target.value })}
              placeholder={environment === 'tauri' && envKeys.openai ? 'Using environment variable...' : 'sk-...'}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {(keys.openai || envKeys.openai) && (
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
          <div className="flex items-center justify-between mb-2">
            <label
              htmlFor="anthropic"
              className="block text-sm font-semibold text-gray-700 dark:text-gray-300"
            >
              Anthropic API Key
            </label>
            {environment === 'tauri' && envKeys.anthropic && !keys.anthropic && (
              <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full" />
                Using ANTHROPIC_API_KEY
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <input
              id="anthropic"
              type="text"
              value={keys.anthropic || ''}
              onChange={(e) => setKeys({ ...keys, anthropic: e.target.value })}
              placeholder={environment === 'tauri' && envKeys.anthropic ? 'Using environment variable...' : 'sk-ant-...'}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {(keys.anthropic || envKeys.anthropic) && (
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
          <div className="flex items-center justify-between mb-2">
            <label
              htmlFor="openrouter"
              className="block text-sm font-semibold text-gray-700 dark:text-gray-300"
            >
              OpenRouter API Key
            </label>
            {environment === 'tauri' && envKeys.openrouter && !keys.openrouter && (
              <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full" />
                Using OPENROUTER_API_KEY
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <input
              id="openrouter"
              type="text"
              value={keys.openrouter || ''}
              onChange={(e) => setKeys({ ...keys, openrouter: e.target.value })}
              placeholder={environment === 'tauri' && envKeys.openrouter ? 'Using environment variable...' : 'sk-or-...'}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {(keys.openrouter || envKeys.openrouter) && (
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
          <div className="flex items-center justify-between mb-2">
            <label
              htmlFor="gemini"
              className="block text-sm font-semibold text-gray-700 dark:text-gray-300"
            >
              Google Gemini API Key
            </label>
            {environment === 'tauri' && envKeys.gemini && !keys.gemini && (
              <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full" />
                Using GOOGLE_API_KEY
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <input
              id="gemini"
              type="text"
              value={keys.gemini || ''}
              onChange={(e) => setKeys({ ...keys, gemini: e.target.value })}
              placeholder={environment === 'tauri' && envKeys.gemini ? 'Using environment variable...' : 'AIza...'}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {(keys.gemini || envKeys.gemini) && (
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
            <span>←</span> Back to Projects
          </Link>
          <button
            onClick={handleSave}
            className="w-36 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
          >
            Save Keys
          </button>
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

          {/* Local AI Providers (Tauri only) */}
          {environment === 'tauri' && (
            <div className="mt-8 card p-8 space-y-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Local AI Providers</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Connect to locally running AI services. These providers run on your machine and don&apos;t require API keys.
                </p>
              </div>

              {/* Ollama */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label
                    htmlFor="ollama-endpoint"
                    className="block text-sm font-semibold text-gray-700 dark:text-gray-300"
                  >
                    Ollama Endpoint
                  </label>
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        ollamaStatus.loading
                          ? 'bg-yellow-500 animate-pulse'
                          : ollamaStatus.running
                          ? 'bg-green-500'
                          : 'bg-red-500'
                      }`}
                    />
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {ollamaStatus.loading ? 'Checking...' : ollamaStatus.running ? 'Connected' : 'Not running'}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <input
                    id="ollama-endpoint"
                    type="text"
                    value={ollamaEndpoint}
                    onChange={(e) => setOllamaEndpoint(e.target.value)}
                    placeholder="http://localhost:11434"
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={handleSaveOllamaEndpoint}
                    className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
                  >
                    Save
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">
                  Default: http://localhost:11434. Start Ollama with: <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">ollama serve</code>
                </p>
              </div>

              {/* LM Studio */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label
                    htmlFor="lmstudio-endpoint"
                    className="block text-sm font-semibold text-gray-700 dark:text-gray-300"
                  >
                    LM Studio Endpoint
                  </label>
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        lmstudioStatus.loading
                          ? 'bg-yellow-500 animate-pulse'
                          : lmstudioStatus.running
                          ? 'bg-green-500'
                          : 'bg-red-500'
                      }`}
                    />
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {lmstudioStatus.loading ? 'Checking...' : lmstudioStatus.running ? 'Connected' : 'Not running'}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <input
                    id="lmstudio-endpoint"
                    type="text"
                    value={lmstudioEndpoint}
                    onChange={(e) => setLmstudioEndpoint(e.target.value)}
                    placeholder="http://localhost:1234"
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={handleSaveLmstudioEndpoint}
                    className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
                  >
                    Save
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">
                  Default: http://localhost:1234. Open LM Studio and enable the local server in settings.
                </p>
              </div>

              {/* Refresh All Button */}
              <div className="pt-2">
                <button
                  onClick={checkLocalProviderHealth}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Check Connection Status
                </button>
              </div>
            </div>
          )}

          {/* Danger Zone */}
          <div className="mt-8 p-6 bg-white dark:bg-gray-800 border border-red-200 dark:border-red-800 rounded-lg">
            <h2 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-4">Danger Zone</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Clear API Keys</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Remove all saved API keys from this browser.</p>
                </div>
                <button
                  onClick={handleClearKeys}
                  className="w-36 px-4 py-2 border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 rounded-lg font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  Clear Keys
                </button>
              </div>
              <div className="border-t border-gray-200 dark:border-gray-700" />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Clear Projects</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Delete all projects, prompts, datasets, and evaluation history. API keys are preserved.</p>
                </div>
                <button
                  onClick={handleClearProjects}
                  className="w-36 px-4 py-2 border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 rounded-lg font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  Clear Projects
                </button>
              </div>
              <div className="border-t border-gray-200 dark:border-gray-700" />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Clear All Data</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Delete all projects, prompts, datasets, evaluation history, and API keys.</p>
                </div>
                <button
                  onClick={handleClearAll}
                  className="w-36 px-4 py-2 bg-red-600 dark:bg-red-500 text-white rounded-lg font-medium hover:bg-red-700 dark:hover:bg-red-600 transition-colors"
                >
                  Clear All Data
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
