'use client';

import { useState } from 'react';

export default function FAQPage() {
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
          <strong>None.</strong> Your API keys, prompts, and evaluation results are never sent
          to our servers. All data is stored locally in your browser&apos;s localStorage. When you
          generate outputs, your browser makes direct API calls to OpenAI, Anthropic, and OpenRouter using
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
          Yes. You need your own API keys from OpenAI, Anthropic, and/or OpenRouter, and you&apos;ll be
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

  return (
    <div className="w-[80%] mx-auto px-4 py-12">
      <div className="mb-10">
        <h1 className="text-4xl font-bold mb-3 text-gray-900">Frequently Asked Questions</h1>
        <p className="text-lg text-gray-600">
          Everything you need to know about Evvl
        </p>
      </div>

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
  );
}
