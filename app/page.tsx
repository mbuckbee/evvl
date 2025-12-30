'use client';

import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { loadApiKeys } from '@/lib/storage';
import { ApiKeys, AIOutput } from '@/lib/types';
import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [apiKeys, setApiKeys] = useState<ApiKeys>({});
  const [outputs, setOutputs] = useState<{
    openai?: AIOutput;
    anthropic?: AIOutput;
    openrouter?: AIOutput;
  }>({});

  useEffect(() => {
    setApiKeys(loadApiKeys());
  }, []);

  const generateOutputs = async () => {
    if (!prompt.trim()) return;

    setGenerating(true);
    setOutputs({});

    const providers: Array<{ key: 'openai' | 'anthropic' | 'openrouter'; model: string; label: string }> = [];

    if (apiKeys.openai) {
      providers.push({ key: 'openai', model: 'gpt-4-turbo-preview', label: 'GPT-4 Turbo' });
    }
    if (apiKeys.anthropic) {
      providers.push({ key: 'anthropic', model: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet' });
    }
    if (apiKeys.openrouter) {
      providers.push({ key: 'openrouter', model: 'openai/gpt-4-turbo', label: 'OpenRouter' });
    }

    // Generate for each provider in parallel
    const promises = providers.map(async ({ key, model, label }) => {
      const outputId = uuidv4();
      const apiKey = apiKeys[key];

      try {
        const response = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt,
            provider: key,
            model,
            apiKey,
          }),
        });

        const data = await response.json();

        if (response.ok) {
          return {
            key,
            output: {
              id: outputId,
              modelConfig: { provider: key, model, label },
              content: data.content,
              tokens: data.tokens,
              latency: data.latency,
              timestamp: Date.now(),
            }
          };
        } else {
          return {
            key,
            output: {
              id: outputId,
              modelConfig: { provider: key, model, label },
              content: '',
              error: data.error || 'Failed to generate',
              timestamp: Date.now(),
            }
          };
        }
      } catch (error: any) {
        return {
          key,
          output: {
            id: outputId,
            modelConfig: { provider: key, model, label },
            content: '',
            error: error.message || 'Network error',
            timestamp: Date.now(),
          }
        };
      }
    });

    const results = await Promise.all(promises);
    const newOutputs: any = {};
    results.forEach(({ key, output }) => {
      newOutputs[key] = output;
    });

    setOutputs(newOutputs);
    setGenerating(false);
  };

  return (
    <div className="w-[80%] mx-auto px-4 py-12">
      {/* Prompt Section */}
      <div className="mb-10">
        <div className="mb-4">
          <label htmlFor="prompt" className="block text-sm font-semibold text-gray-700 mb-2">
            Prompt
          </label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter your prompt here..."
            rows={5}
            className="input resize-none"
          />
        </div>

        <div className="flex justify-end">
          <button
            onClick={generateOutputs}
            disabled={generating || !prompt.trim()}
            className="btn-primary"
          >
            {generating ? 'Generating...' : 'Generate Outputs'}
          </button>
        </div>
      </div>

      {/* Three Column Layout */}
      <div className="grid grid-cols-3 gap-6">
        {/* OpenAI Column */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Image src="/logos/chatgpt.svg" alt="ChatGPT" width={24} height={24} />
            <h3 className="text-lg font-bold text-gray-900">ChatGPT</h3>
          </div>
          {!apiKeys.openai ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">Not configured</p>
              <Link
                href="/settings"
                className="text-blue-600 hover:text-blue-700 font-medium text-sm"
              >
                Configure OpenAI →
              </Link>
            </div>
          ) : outputs.openai ? (
            <div>
              <div className="mb-2 text-xs text-gray-500">
                {outputs.openai.tokens && <span>{outputs.openai.tokens} tokens</span>}
                {outputs.openai.latency && <span className="ml-3">{outputs.openai.latency}ms</span>}
              </div>
              {outputs.openai.error ? (
                <div className="text-red-600 text-sm">{outputs.openai.error}</div>
              ) : (
                <div className="text-gray-700 text-sm whitespace-pre-wrap leading-relaxed">
                  {outputs.openai.content}
                </div>
              )}
            </div>
          ) : generating ? (
            <div className="text-center py-12 text-gray-400">Generating...</div>
          ) : (
            <div className="text-center py-12 text-gray-400">Ready</div>
          )}
        </div>

        {/* Claude Column */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Image src="/logos/claude.svg" alt="Claude" width={24} height={24} />
            <h3 className="text-lg font-bold text-gray-900">Claude</h3>
          </div>
          {!apiKeys.anthropic ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">Not configured</p>
              <Link
                href="/settings"
                className="text-blue-600 hover:text-blue-700 font-medium text-sm"
              >
                Configure Claude →
              </Link>
            </div>
          ) : outputs.anthropic ? (
            <div>
              <div className="mb-2 text-xs text-gray-500">
                {outputs.anthropic.tokens && <span>{outputs.anthropic.tokens} tokens</span>}
                {outputs.anthropic.latency && <span className="ml-3">{outputs.anthropic.latency}ms</span>}
              </div>
              {outputs.anthropic.error ? (
                <div className="text-red-600 text-sm">{outputs.anthropic.error}</div>
              ) : (
                <div className="text-gray-700 text-sm whitespace-pre-wrap leading-relaxed">
                  {outputs.anthropic.content}
                </div>
              )}
            </div>
          ) : generating ? (
            <div className="text-center py-12 text-gray-400">Generating...</div>
          ) : (
            <div className="text-center py-12 text-gray-400">Ready</div>
          )}
        </div>

        {/* OpenRouter Column */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Image src="/logos/openrouter.svg" alt="OpenRouter" width={24} height={24} />
            <h3 className="text-lg font-bold text-gray-900">OpenRouter</h3>
          </div>
          {!apiKeys.openrouter ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">Not configured</p>
              <Link
                href="/settings"
                className="text-blue-600 hover:text-blue-700 font-medium text-sm"
              >
                Configure OpenRouter →
              </Link>
            </div>
          ) : outputs.openrouter ? (
            <div>
              <div className="mb-2 text-xs text-gray-500">
                {outputs.openrouter.tokens && <span>{outputs.openrouter.tokens} tokens</span>}
                {outputs.openrouter.latency && <span className="ml-3">{outputs.openrouter.latency}ms</span>}
              </div>
              {outputs.openrouter.error ? (
                <div className="text-red-600 text-sm">{outputs.openrouter.error}</div>
              ) : (
                <div className="text-gray-700 text-sm whitespace-pre-wrap leading-relaxed">
                  {outputs.openrouter.content}
                </div>
              )}
            </div>
          ) : generating ? (
            <div className="text-center py-12 text-gray-400">Generating...</div>
          ) : (
            <div className="text-center py-12 text-gray-400">Ready</div>
          )}
        </div>
      </div>
    </div>
  );
}
