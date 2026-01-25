'use client';

import { useState, useEffect } from 'react';
import { CommandLineIcon, CheckCircleIcon, ExclamationCircleIcon, ArrowPathIcon, ClipboardDocumentIcon, ClipboardDocumentCheckIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { isTauriEnvironment } from '@/lib/environment';

interface CliStatus {
  installed: boolean;
  path: string | null;
  current_exe: string;
}

export default function CliPage() {
  const [isTauri, setIsTauri] = useState(false);
  const [cliStatus, setCliStatus] = useState<CliStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [platform, setPlatform] = useState<'macos' | 'windows' | 'linux' | 'unknown'>('unknown');

  useEffect(() => {
    const init = async () => {
      const tauri = isTauriEnvironment();
      setIsTauri(tauri);

      if (tauri) {
        // Detect platform
        const userAgent = navigator.userAgent.toLowerCase();
        if (userAgent.includes('mac')) {
          setPlatform('macos');
        } else if (userAgent.includes('win')) {
          setPlatform('windows');
        } else if (userAgent.includes('linux')) {
          setPlatform('linux');
        }

        // Check CLI status
        await checkStatus();
      }
      setLoading(false);
    };

    init();
  }, []);

  const checkStatus = async () => {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const status = await invoke<CliStatus>('check_cli_installed');
      setCliStatus(status);
    } catch (error) {
      console.error('Failed to check CLI status:', error);
    }
  };

  const handleVerify = async () => {
    setVerifying(true);
    await checkStatus();
    setVerifying(false);
  };

  const getPlatformInstructions = () => {
    switch (platform) {
      case 'macos':
        return {
          location: '/usr/local/bin/evvl',
          command: `sudo ln -sf "${cliStatus?.current_exe || '/Applications/Evvl.app/Contents/MacOS/Evvl'}" /usr/local/bin/evvl`,
          note: 'Creates a symlink in /usr/local/bin which is in the default PATH.',
        };
      case 'linux':
        return {
          location: '~/.local/bin/evvl',
          command: `ln -sf "${cliStatus?.current_exe || '/path/to/Evvl'}" ~/.local/bin/evvl`,
          note: 'Creates a symlink in ~/.local/bin. Make sure this directory is in your PATH.',
        };
      case 'windows':
        return {
          location: 'Added to user PATH',
          command: `setx PATH "%PATH%;${cliStatus?.current_exe ? cliStatus.current_exe.replace(/\\[^\\]+$/, '') : 'C:\\Program Files\\Evvl'}"`,
          note: 'Adds the Evvl directory to your user PATH.',
        };
      default:
        return {
          location: 'Unknown',
          command: '',
          note: '',
        };
    }
  };

  const instructions = getPlatformInstructions();

  const copyCommand = async () => {
    try {
      await navigator.clipboard.writeText(instructions.command);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  if (!isTauri) {
    return (
      <div className="h-screen flex flex-col bg-white dark:bg-gray-900">
        <nav className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-6 py-3">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-xl font-bold text-gray-900 dark:text-white hover:opacity-80 transition-opacity">
              Evvl
            </Link>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <CommandLineIcon className="h-5 w-5" />
              <span>CLI Setup</span>
            </div>
          </div>
        </nav>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center p-8">
            <CommandLineIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">CLI Available in Desktop App</h1>
            <p className="text-gray-600 dark:text-gray-400">
              The CLI feature is only available in the Evvl desktop application.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-gray-900">
      {/* Navigation */}
      <nav className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-6 py-3">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-gray-900 dark:text-white hover:opacity-80 transition-opacity">
            Evvl
          </Link>
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <CommandLineIcon className="h-5 w-5" />
            <span>CLI Setup</span>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">Command Line Interface</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
            Use Evvl from your terminal to run evaluations, automate workflows, and integrate with your development tools.
          </p>

          {/* Status Card */}
          <div className={`p-6 rounded-lg border mb-8 ${
            cliStatus?.installed
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
              : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
          }`}>
            <div className="flex items-start gap-4">
              {loading ? (
                <ArrowPathIcon className="h-6 w-6 text-gray-400 animate-spin" />
              ) : cliStatus?.installed ? (
                <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
              ) : (
                <ExclamationCircleIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              )}
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                  {loading ? 'Checking...' : cliStatus?.installed ? 'CLI Installed' : 'CLI Not Installed'}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {cliStatus?.installed
                    ? `Available at: ${cliStatus.path}`
                    : 'Follow the steps below to install the CLI.'}
                </p>
              </div>
              {!loading && (
                <button
                  onClick={handleVerify}
                  disabled={verifying}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 ${
                    cliStatus?.installed
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {verifying ? (
                    <ArrowPathIcon className="h-5 w-5 animate-spin" />
                  ) : cliStatus?.installed ? (
                    'Verified ✓'
                  ) : (
                    'Verify Installation'
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Installation Steps */}
          {!cliStatus?.installed && instructions.command && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Installation</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-medium">1</div>
                  <div className="flex-1">
                    <p className="text-gray-700 dark:text-gray-300 mb-2">Copy this command and run it in your terminal:</p>
                    <div className="bg-gray-900 rounded-lg p-4 flex items-start gap-3">
                      <code className="text-green-400 text-sm font-mono flex-1 break-all">{instructions.command}</code>
                      <button
                        onClick={copyCommand}
                        className="flex-shrink-0 p-2 hover:bg-gray-700 rounded transition-colors"
                        title="Copy to clipboard"
                      >
                        {copied ? (
                          <ClipboardDocumentCheckIcon className="h-5 w-5 text-green-400" />
                        ) : (
                          <ClipboardDocumentIcon className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                      {instructions.note}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-medium">2</div>
                  <div className="flex-1">
                    <p className="text-gray-700 dark:text-gray-300">Click &quot;Verify Installation&quot; above to confirm it worked.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Usage Examples */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Usage Examples</h2>
            <div className="space-y-4">
              <div className="bg-gray-900 rounded-lg p-4">
                <p className="text-gray-400 text-sm mb-2"># Run a quick evaluation</p>
                <code className="text-green-400 font-mono">evvl &quot;Explain quantum computing&quot;</code>
              </div>
              <div className="bg-gray-900 rounded-lg p-4">
                <p className="text-gray-400 text-sm mb-2"># Open results in GUI</p>
                <code className="text-green-400 font-mono">evvl &quot;Review this code&quot; --open</code>
              </div>
              <div className="bg-gray-900 rounded-lg p-4">
                <p className="text-gray-400 text-sm mb-2"># Output as JSON for scripting</p>
                <code className="text-green-400 font-mono">evvl &quot;Summarize this&quot; --json</code>
              </div>
              <div className="bg-gray-900 rounded-lg p-4">
                <p className="text-gray-400 text-sm mb-2"># List all projects</p>
                <code className="text-green-400 font-mono">evvl projects</code>
              </div>
              <div className="bg-gray-900 rounded-lg p-4">
                <p className="text-gray-400 text-sm mb-2"># Get help</p>
                <code className="text-green-400 font-mono">evvl --help</code>
              </div>
            </div>
          </div>

          {/* Git Integration */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Git Integration</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-3">
              When you run <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">evvl</code> from within a git repository, it automatically:
            </p>
            <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-2">
              <li>Detects the repository name</li>
              <li>Creates or uses a project with that name</li>
              <li>Saves prompts as versions for tracking changes</li>
            </ul>
          </div>

          {/* Environment Variables */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Environment Variables</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-3">
              The CLI automatically uses API keys from standard environment variables:
            </p>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 dark:bg-gray-700">
                  <tr>
                    <th className="text-left px-4 py-2 text-gray-700 dark:text-gray-300">Variable</th>
                    <th className="text-left px-4 py-2 text-gray-700 dark:text-gray-300">Provider</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  <tr>
                    <td className="px-4 py-2 font-mono text-gray-900 dark:text-gray-100">OPENAI_API_KEY</td>
                    <td className="px-4 py-2 text-gray-600 dark:text-gray-400">OpenAI</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 font-mono text-gray-900 dark:text-gray-100">ANTHROPIC_API_KEY</td>
                    <td className="px-4 py-2 text-gray-600 dark:text-gray-400">Anthropic</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 font-mono text-gray-900 dark:text-gray-100">OPENROUTER_API_KEY</td>
                    <td className="px-4 py-2 text-gray-600 dark:text-gray-400">OpenRouter</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 font-mono text-gray-900 dark:text-gray-100">GOOGLE_API_KEY</td>
                    <td className="px-4 py-2 text-gray-600 dark:text-gray-400">Google Gemini</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Keys set in Settings will override environment variables.
            </p>
          </div>

          {/* Back Button */}
          <div className="pt-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-2 border-2 border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400 rounded-lg font-medium hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
            >
              <span>&larr;</span> Back to Projects
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
