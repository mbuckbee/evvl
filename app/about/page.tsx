'use client';

import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="w-[80%] mx-auto px-4 py-12">
      <div className="mb-6">
        <Link
          href="/"
          className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-1"
        >
          <span>←</span> Back to Eval
        </Link>
      </div>
      <div className="mb-10">
        <h1 className="text-4xl font-bold mb-3 text-gray-900">About Evvl</h1>
        <p className="text-lg text-gray-600">
          A privacy-first tool for comparing AI model outputs
        </p>
      </div>

      <div className="max-w-3xl space-y-8">
        <section className="card p-8">
          <h2 className="text-2xl font-bold mb-4 text-gray-900">What is Evvl?</h2>
          <p className="text-gray-700 mb-4">
            Evvl is a simple, privacy-focused tool that lets you compare outputs from different AI models side by side.
            Enter a single prompt, select which AI providers you want to use, and instantly see how different models
            respond to the same input.
          </p>
          <p className="text-gray-700">
            Whether you're evaluating which AI model works best for your use case, testing prompt variations,
            or just curious about how different models approach the same question, Evvl makes it easy to
            compare and contrast their outputs.
          </p>
        </section>

        <section className="card p-8">
          <h2 className="text-2xl font-bold mb-4 text-gray-900">How It Works</h2>
          <ol className="list-decimal list-inside space-y-3 text-gray-700">
            <li>
              <strong>Add your API keys:</strong> Visit the Settings page and add API keys from OpenAI,
              Anthropic, and/or OpenRouter. These are stored locally in your browser.
            </li>
            <li>
              <strong>Enter a prompt:</strong> Type the prompt you want to test on the main Eval page.
            </li>
            <li>
              <strong>Generate outputs:</strong> Click "Generate Outputs" to send your prompt to all
              configured AI providers simultaneously.
            </li>
            <li>
              <strong>Compare results:</strong> View the responses side by side, along with token counts
              and latency metrics for each model.
            </li>
          </ol>
        </section>

        <section className="card p-8">
          <h2 className="text-2xl font-bold mb-4 text-gray-900">Privacy First</h2>
          <p className="text-gray-700 mb-4">
            Evvl takes your privacy seriously. Here's what makes it different:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
            <li>
              <strong>No backend servers:</strong> Your API keys and data are never sent to our servers.
              Everything is stored locally in your browser.
            </li>
            <li>
              <strong>Direct API calls:</strong> When you generate outputs, your browser makes direct
              API calls to OpenAI, Anthropic, and OpenRouter using your own API keys.
            </li>
            <li>
              <strong>No tracking:</strong> We don't track your usage, collect analytics, or store
              any information about your prompts or results.
            </li>
            <li>
              <strong>Open and transparent:</strong> The tool is straightforward and honest about
              how it works—no hidden features or data collection.
            </li>
          </ul>
        </section>

        <section className="card p-8">
          <h2 className="text-2xl font-bold mb-4 text-gray-900">Free to Use</h2>
          <p className="text-gray-700">
            Evvl itself is completely free to use. You only pay for the API calls made to the AI providers
            (OpenAI, Anthropic, OpenRouter) based on your usage with them. There are no subscription fees,
            no hidden costs, and no premium tiers.
          </p>
        </section>
      </div>
    </div>
  );
}
