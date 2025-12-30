'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { loadApiKeys, saveEvalResult } from '@/lib/storage';
import { ApiKeys, ModelConfig, AIOutput, EvalResult, AVAILABLE_MODELS } from '@/lib/types';
import Link from 'next/link';

export default function Home() {
  const router = useRouter();
  const [prompt, setPrompt] = useState('');
  const [selectedModels, setSelectedModels] = useState<ModelConfig[]>([]);
  const [generating, setGenerating] = useState(false);
  const [apiKeys, setApiKeys] = useState<ApiKeys>({});
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  useEffect(() => {
    setApiKeys(loadApiKeys());
  }, []);

  const toggleModel = (model: ModelConfig) => {
    if (selectedModels.find(m => m.model === model.model)) {
      setSelectedModels(selectedModels.filter(m => m.model !== model.model));
    } else {
      setSelectedModels([...selectedModels, model]);
    }
  };

  const hasAnyKeys = !!(apiKeys.openai || apiKeys.anthropic);

  const faqItems = [
    {
      question: "What is Evvl?",
      answer: (
        <p className="text-gray-700">
          Evvl is a tool for comparing and evaluating AI model outputs side by side.
          Enter a single prompt, select multiple AI models, and see their responses
          displayed together for easy comparison. You can rate each output, add notes,
          and save your evaluations for future reference.
        </p>
      )
    },
    {
      question: "What AI services are currently supported?",
      answer: (
        <>
          <p className="text-gray-700 mb-2">
            Evvl currently supports the following AI providers and models:
          </p>
          <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
            <li><strong>OpenAI:</strong> GPT-4 Turbo, GPT-4, and GPT-3.5 Turbo</li>
            <li><strong>Anthropic:</strong> Claude 3.5 Sonnet, Claude 3 Opus, and Claude 3 Haiku</li>
          </ul>
        </>
      )
    },
    {
      question: "What data is sent to your servers?",
      answer: (
        <p className="text-gray-700">
          <strong>None.</strong> Your API keys, prompts, and evaluation results are never sent
          to our servers. All data is stored locally in your browser&apos;s localStorage. When you
          generate outputs, your browser makes direct API calls to OpenAI and Anthropic using
          your own API keys. We never see or store any of your data.
        </p>
      )
    },
    {
      question: "Where is my data stored?",
      answer: (
        <>
          <p className="text-gray-700">
            Everything is stored in your browser&apos;s localStorage, including:
          </p>
          <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
            <li>Your API keys (encrypted by your browser)</li>
            <li>Your prompts and AI-generated outputs</li>
            <li>Your ratings and notes</li>
            <li>Evaluation history (limited to the last 50 evaluations)</li>
          </ul>
          <p className="text-gray-700 mt-2">
            This means your data stays on your device and is only accessible from this browser.
            If you clear your browser data, your Evvl data will be deleted.
          </p>
        </>
      )
    },
    {
      question: "Do I need to pay for API access?",
      answer: (
        <p className="text-gray-700">
          Yes. You need your own API keys from OpenAI and/or Anthropic, and you&apos;ll be
          charged by those providers based on your usage. Evvl itself is free to use -
          you only pay for the API calls made to the AI providers.
        </p>
      )
    },
    {
      question: "Can I export my evaluation results?",
      answer: (
        <p className="text-gray-700">
          Yes! From the History page, you can export any evaluation to JSON or CSV format.
          This is useful for sharing results, creating reports, or importing into other tools.
        </p>
      )
    }
  ];

  const hasRequiredKeys = () => {
    const providers = selectedModels.map(m => m.provider);
    const openaiNeeded = providers.includes('openai');
    const anthropicNeeded = providers.includes('anthropic');

    if (openaiNeeded && !apiKeys.openai) return false;
    if (anthropicNeeded && !apiKeys.anthropic) return false;
    return true;
  };

  const generateOutputs = async () => {
    if (!prompt.trim() || selectedModels.length === 0) return;
    if (!hasRequiredKeys()) {
      alert('Please configure API keys in Settings for the selected models');
      return;
    }

    setGenerating(true);

    const newOutputs: AIOutput[] = [];

    // Generate outputs sequentially for better UX
    for (const modelConfig of selectedModels) {
      const outputId = uuidv4();
      const apiKey = modelConfig.provider === 'openai' ? apiKeys.openai : apiKeys.anthropic;

      try {
        const response = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt,
            provider: modelConfig.provider,
            model: modelConfig.model,
            apiKey,
          }),
        });

        const data = await response.json();

        if (response.ok) {
          const output: AIOutput = {
            id: outputId,
            modelConfig,
            content: data.content,
            tokens: data.tokens,
            latency: data.latency,
            timestamp: Date.now(),
          };
          newOutputs.push(output);
        } else {
          const output: AIOutput = {
            id: outputId,
            modelConfig,
            content: '',
            error: data.error || 'Failed to generate',
            timestamp: Date.now(),
          };
          newOutputs.push(output);
        }
      } catch (error: any) {
        const output: AIOutput = {
          id: outputId,
          modelConfig,
          content: '',
          error: error.message || 'Network error',
          timestamp: Date.now(),
        };
        newOutputs.push(output);
      }
    }

    // Save eval result and redirect
    const evalResult: EvalResult = {
      id: uuidv4(),
      prompt,
      outputs: newOutputs,
      ratings: [],
      timestamp: Date.now(),
    };
    saveEvalResult(evalResult);

    setGenerating(false);
    router.push(`/eval/${evalResult.id}`);
  };

  return (
    <div className="w-[80%] mx-auto px-4 py-12">
      <div className="mb-12">
        <h1 className="text-4xl font-bold mb-3 text-gray-900">AI Output Evaluation</h1>
        <p className="text-lg text-gray-600">
          Compare outputs from multiple AI models side by side
        </p>
      </div>

      {/* Prompt Input */}
      <div className="mb-8">
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

      {/* Model Selection */}
      {hasAnyKeys && (
        <div className="mb-8">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Select Models ({selectedModels.length} selected)
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {AVAILABLE_MODELS.map((model) => (
              <button
                key={model.model}
                onClick={() => toggleModel(model)}
                className={`px-4 py-3 rounded-lg border text-sm font-medium transition-all duration-200 ${
                  selectedModels.find(m => m.model === model.model)
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm hover:bg-blue-700'
                    : 'bg-white border-gray-300 hover:border-gray-400 hover:shadow-sm'
                }`}
              >
                {model.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Generate Button */}
      <div className="mb-10 flex justify-end">
        <button
          onClick={generateOutputs}
          disabled={generating || !prompt.trim()}
          className="btn-primary"
        >
          {generating ? 'Generating...' : 'Generate Outputs'}
        </button>
      </div>

      {/* Missing API Keys Warning */}
      {selectedModels.length > 0 && !hasRequiredKeys() && (
        <div className="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            Please configure your API keys in{' '}
            <Link href="/settings" className="underline font-semibold hover:text-yellow-900">
              Settings
            </Link>
            {' '}for the selected models.
          </p>
        </div>
      )}

      {/* FAQ Section */}
      <div className="mt-20 pt-16 border-t border-gray-200">
        <h2 className="text-3xl font-bold mb-10 text-gray-900">Frequently Asked Questions</h2>

        <div className="space-y-3 max-w-3xl">
          {faqItems.map((faq, index) => (
            <div key={index} className="card overflow-hidden">
              <button
                onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
                className="w-full px-6 py-5 text-left flex justify-between items-center hover:bg-gray-50 transition-colors duration-200"
              >
                <h3 className="text-base font-semibold text-gray-900">{faq.question}</h3>
                <span className="text-gray-400 text-xl font-light ml-4 flex-shrink-0">
                  {openFaqIndex === index ? '−' : '+'}
                </span>
              </button>
              {openFaqIndex === index && (
                <div className="px-6 pb-5 pt-1 border-t border-gray-100">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
