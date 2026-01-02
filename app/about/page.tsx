'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function AboutPage() {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

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
            Evvl currently supports the following AI providers:
          </p>
          <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
            <li><strong>OpenAI:</strong> GPT-4 Turbo and other ChatGPT models</li>
            <li><strong>Anthropic:</strong> Claude 3.5 Sonnet and other Claude models</li>
            <li><strong>OpenRouter:</strong> Access to multiple models through a single API</li>
          </ul>
        </>
      )
    },
    {
      question: "What data is sent to your servers?",
      answer: (
        <p className="text-gray-700">
          Your API requests (including keys, prompts, and model selections) are routed through our servers
          to reach OpenAI, Anthropic, and OpenRouter. However, <strong>API keys are automatically redacted
          from all logs, and prompts/responses are never logged.</strong> We maintain basic operational logs
          (provider, model, error types) for debugging only. No personal or sensitive data is stored. All your
          evaluation results and history are stored only in your browser&apos;s localStorage.
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
          Yes. You need your own API keys from OpenAI, Anthropic, and/or OpenRouter, and you&apos;ll be
          charged by those providers based on your usage. Evvl itself is free to use -
          you only pay for the API calls made to the AI providers.
        </p>
      )
    }
  ];

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

      <div className="w-[80%] mx-auto space-y-12">
        <section>
          <h2 className="text-2xl font-bold mb-4 text-gray-900">The Problem</h2>
          <p className="text-gray-700 mb-4">
            When you ask an AI model a question, it gives you an answer. But how do you know if it&apos;s a
            <em> good</em> answer? In isolation, it&apos;s surprisingly difficult to evaluate the quality of an AI response.
          </p>
          <p className="text-gray-700 mb-4">
            You might wonder: Is this the best response possible? Did the model miss important context? Would a
            different model have given a better answer? Without a point of comparison, you&apos;re left guessing.
          </p>
          <p className="text-gray-700">
            This is the fundamental challenge with evaluating AI outputs—you need context, and the best context
            is seeing how different models tackle the same task.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4 text-gray-900">The Solution</h2>
          <p className="text-gray-700 mb-4">
            Evvl lets you compare outputs from different AI models side by side. Enter a single prompt,
            select multiple AI providers, and instantly see how different models respond to the same input.
          </p>
          <p className="text-gray-700">
            By comparing responses, patterns emerge. You&apos;ll quickly notice which models excel at certain
            tasks, which ones provide more detailed answers, and which ones better understand your specific needs.
            This side-by-side comparison is the fastest way to build intuition about AI model capabilities.
          </p>
        </section>

        <section>
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
              <strong>Generate outputs:</strong> Click &ldquo;Generate Outputs&rdquo; to send your prompt to all
              configured AI providers simultaneously.
            </li>
            <li>
              <strong>Compare results:</strong> View the responses side by side, along with token counts
              and latency metrics for each model.
            </li>
          </ol>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4 text-gray-900">Privacy First</h2>
          <p className="text-gray-700 mb-4">
            Evvl takes your privacy seriously. Here&apos;s what makes it different:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
            <li>
              <strong>API keys protected:</strong> Your API keys are automatically redacted from all server logs.
              They are never stored in any database. Prompts and AI responses are never logged at all.
            </li>
            <li>
              <strong>Transparent proxy:</strong> Your requests are routed through our server (required for
              OpenAI compatibility). We maintain basic operational logs (provider, model, error types) for
              debugging, but no personal or sensitive data.
            </li>
            <li>
              <strong>No tracking:</strong> We don&apos;t track your usage, collect analytics, or store
              any information about your prompts or results.
            </li>
            <li>
              <strong>Open and transparent:</strong> The tool is straightforward and honest about
              how it works—no hidden features or data collection.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4 text-gray-900">Free to Use</h2>
          <p className="text-gray-700">
            Evvl itself is completely free to use. You only pay for the API calls made to the AI providers
            (OpenAI, Anthropic, OpenRouter) based on your usage with them. There are no subscription fees,
            no hidden costs, and no premium tiers.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-6 text-gray-900">Frequently Asked Questions</h2>
          <div className="space-y-3">
            {faqItems.map((faq, index) => (
              <div key={index} className="border-b border-gray-200 pb-4">
                <button
                  onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
                  className="w-full py-3 text-left flex justify-between items-center hover:text-gray-600 transition-colors duration-200"
                >
                  <h3 className="text-base font-semibold text-gray-900">{faq.question}</h3>
                  <span className="text-gray-400 text-xl font-light ml-4 flex-shrink-0">
                    {openFaqIndex === index ? '−' : '+'}
                  </span>
                </button>
                {openFaqIndex === index && (
                  <div className="pt-3">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
