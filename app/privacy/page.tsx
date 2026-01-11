'use client';

import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="w-[80%] mx-auto px-4 py-12 overflow-y-auto h-full">
      <div className="mb-6">
        <Link
          href="/"
          className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-1"
        >
          <span>←</span> Back to Eval
        </Link>
      </div>
      <div className="mb-10">
        <h1 className="text-4xl font-bold mb-3 text-gray-900">Privacy Policy</h1>
        <p className="text-lg text-gray-600">
          Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      <div className="max-w-3xl space-y-6 prose prose-gray">
        <section>
          <h2 className="text-2xl font-bold mb-3 text-gray-900">Our Commitment to Privacy</h2>
          <p className="text-gray-700">
            At Evvl, we take your privacy seriously. This Privacy Policy explains how we handle your data when you
            use our service. The short version: <strong>we don&apos;t store any of your personal data, and API keys are
            automatically redacted from all logs.</strong>
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-3 text-gray-900">What Data We Collect and Store</h2>
          <p className="text-gray-700 mb-3">
            <strong>We do not store any of your personal data.</strong> While your API requests are routed through
            our servers to reach OpenAI, Anthropic, and OpenRouter (required due to browser security restrictions),
            we do not store your API keys, prompts, or AI responses.
          </p>
          <p className="text-gray-700">
            Our server logs only contain basic operational information (provider name, model name, error types)
            for debugging purposes. <strong>API keys are automatically redacted from all logs.</strong> We do not
            log your prompts or the content of AI responses.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-3 text-gray-900">How Your Data is Stored</h2>
          <p className="text-gray-700 mb-3">
            All data is stored locally in your browser using localStorage, including:
          </p>
          <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
            <li>Your API keys for OpenAI, Anthropic, and OpenRouter</li>
            <li>Your prompts and evaluation history</li>
            <li>AI-generated outputs and responses</li>
            <li>Your ratings and notes</li>
            <li>Column configurations and preferences</li>
          </ul>
          <p className="text-gray-700 mt-3">
            This data remains on your device and is only accessible from your browser. If you clear your browser
            data or use a different browser/device, you will not have access to your previously stored data.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-3 text-gray-900">How API Calls Work</h2>
          <p className="text-gray-700 mb-3">
            When you generate AI outputs, your browser sends requests to our server, which then forwards them to
            the AI providers (OpenAI, Anthropic, and OpenRouter). This proxy setup is necessary because OpenAI
            doesn&apos;t support direct browser calls due to CORS restrictions.
          </p>
          <p className="text-gray-700 mb-3">
            <strong>Important: We do not store your API keys, prompts, or responses.</strong> Your API keys are
            automatically redacted from all server logs. Prompts and responses are never logged. We maintain basic
            operational logs (provider, model, error types) for debugging, but no personal or sensitive data.
          </p>
          <p className="text-gray-700">
            The data you send to AI providers is subject to their respective privacy policies:
          </p>
          <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4 mt-3">
            <li>OpenAI Privacy Policy: <a href="https://openai.com/policies/privacy-policy" className="text-blue-600 hover:text-blue-700" target="_blank" rel="noopener noreferrer">openai.com/policies/privacy-policy</a></li>
            <li>Anthropic Privacy Policy: <a href="https://www.anthropic.com/legal/privacy" className="text-blue-600 hover:text-blue-700" target="_blank" rel="noopener noreferrer">anthropic.com/legal/privacy</a></li>
            <li>OpenRouter Privacy Policy: <a href="https://openrouter.ai/privacy" className="text-blue-600 hover:text-blue-700" target="_blank" rel="noopener noreferrer">openrouter.ai/privacy</a></li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-3 text-gray-900">Analytics and Tracking (Web App Only)</h2>
          <p className="text-gray-700 mb-3">
            The web application uses privacy-focused analytics to understand basic usage patterns:
          </p>
          <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4 mb-3">
            <li><strong>Plausible Analytics:</strong> Privacy-friendly analytics that doesn&apos;t use cookies or collect personal data. Only anonymous page views. <a href="https://plausible.io/privacy" className="text-blue-600 hover:text-blue-700" target="_blank" rel="noopener noreferrer">Learn more</a></li>
            <li><strong>Vercel Analytics:</strong> Basic performance and usage metrics. <a href="https://vercel.com/docs/analytics/privacy-policy" className="text-blue-600 hover:text-blue-700" target="_blank" rel="noopener noreferrer">Learn more</a></li>
            <li><strong>Vercel Speed Insights:</strong> Page load performance monitoring. <a href="https://vercel.com/docs/speed-insights" className="text-blue-600 hover:text-blue-700" target="_blank" rel="noopener noreferrer">Learn more</a></li>
          </ul>
          <p className="text-gray-700 mb-3">
            We do not use advertising networks or any other third-party tracking tools.
          </p>
          <p className="text-gray-700">
            <strong>Desktop Application:</strong> The desktop app has zero analytics—no tracking of any kind. All data stays entirely on your device.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-3 text-gray-900">Data Security</h2>
          <p className="text-gray-700">
            Since all data is stored locally in your browser, the security of your data depends on:
          </p>
          <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4 mt-3">
            <li>The security of your device</li>
            <li>Your browser&apos;s built-in security features</li>
            <li>Your management of your API keys</li>
          </ul>
          <p className="text-gray-700 mt-3">
            We recommend keeping your API keys secure and not sharing them with others. If you believe your API
            keys have been compromised, revoke them immediately through the respective provider&apos;s dashboard.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-3 text-gray-900">Children&apos;s Privacy</h2>
          <p className="text-gray-700">
            Evvl is not directed to children under 13. We do not knowingly collect information from children.
            Since we don&apos;t collect any data at all, this is not a concern, but parents should supervise their
            children&apos;s use of AI services.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-3 text-gray-900">Changes to Privacy Policy</h2>
          <p className="text-gray-700">
            We may update this Privacy Policy from time to time. Any changes will be posted on this page with
            an updated &ldquo;Last updated&rdquo; date. Your continued use of Evvl after any changes constitutes your
            acceptance of the updated policy.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-3 text-gray-900">Contact</h2>
          <p className="text-gray-700">
            If you have any questions about this Privacy Policy, please contact us through our GitHub repository.
          </p>
        </section>
      </div>
    </div>
  );
}
