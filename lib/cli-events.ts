/**
 * CLI Events Handler
 *
 * Handles events from CLI invocations when GUI is running.
 * This module sets up listeners for CLI-originated events and
 * provides utilities for processing pending CLI runs.
 */

import { isTauriEnvironment } from './environment';

// ============================================================================
// Types
// ============================================================================

export interface CliRunConfig {
  source: 'cli';
  prompt: string;
  models: string[];
  dataset?: string;
  promptId?: string;
  promptVersionId?: string;
  projectId?: string;
  projectName?: string;
  openGui: boolean;
  status: string;
  savedVersion: boolean;
}

export interface CliEventCallbacks {
  onNewEvaluation?: () => void;
  onCliArgsReceived?: (args: string[]) => void;
  onPendingCliRun?: (config: CliRunConfig) => void;
}

// ============================================================================
// Event Setup
// ============================================================================

let eventListenersSetup = false;
let callbacks: CliEventCallbacks = {};

/**
 * Initialize CLI event listeners (call once on app startup)
 */
export async function setupCliEventListeners(cb: CliEventCallbacks): Promise<() => void> {
  if (!isTauriEnvironment()) {
    // No-op for web environment
    return () => {};
  }

  callbacks = cb;

  if (eventListenersSetup) {
    return () => {};
  }

  eventListenersSetup = true;

  // Dynamic import Tauri event module
  const { listen } = await import('@tauri-apps/api/event');

  const unlisteners: Array<() => void> = [];

  // Listen for CLI args from second instance
  const unlistenCliArgs = await listen<string[]>('cli-args-received', (event) => {
    console.log('CLI args received:', event.payload);
    callbacks.onCliArgsReceived?.(event.payload);
  });
  unlisteners.push(unlistenCliArgs);

  // Listen for menu events
  const unlistenNewEval = await listen('menu-new-evaluation', () => {
    callbacks.onNewEvaluation?.();
  });
  unlisteners.push(unlistenNewEval);

  const unlistenShortcutNewEval = await listen('shortcut-new-evaluation', () => {
    callbacks.onNewEvaluation?.();
  });
  unlisteners.push(unlistenShortcutNewEval);

  // Return cleanup function
  return () => {
    unlisteners.forEach(unlisten => unlisten());
    eventListenersSetup = false;
  };
}

/**
 * Check for pending CLI runs and process them
 */
export async function checkPendingCliRuns(): Promise<CliRunConfig[]> {
  if (!isTauriEnvironment()) {
    return [];
  }

  try {
    const { invoke } = await import('@tauri-apps/api/core');
    const runs = await invoke<CliRunConfig[]>('get_pending_cli_runs');
    return runs || [];
  } catch (error) {
    console.error('Error checking pending CLI runs:', error);
    return [];
  }
}

/**
 * Process a single CLI run config
 * Returns the parsed prompt and model list ready for evaluation
 */
export function parseCliRunConfig(config: CliRunConfig): {
  prompt: string;
  systemPrompt?: string;
  models: Array<{ provider: string; model: string }>;
} {
  // Parse model strings into provider/model pairs
  const models = config.models.map(modelStr => {
    // Handle provider/model format (e.g., "openai/gpt-4")
    if (modelStr.includes('/')) {
      const [provider, model] = modelStr.split('/', 2);
      return { provider, model };
    }

    // Try to infer provider from model name
    const modelLower = modelStr.toLowerCase();
    if (modelLower.includes('gpt') || modelLower.includes('o1') || modelLower.includes('davinci')) {
      return { provider: 'openai', model: modelStr };
    }
    if (modelLower.includes('claude')) {
      return { provider: 'anthropic', model: modelStr };
    }
    if (modelLower.includes('gemini')) {
      return { provider: 'gemini', model: modelStr };
    }

    // Default to openrouter for unknown models
    return { provider: 'openrouter', model: modelStr };
  });

  return {
    prompt: config.prompt,
    systemPrompt: config.systemPrompt,
    models,
  };
}

// ============================================================================
// CLI Argument Parsing (for second instance)
// ============================================================================

interface ParsedCliArgs {
  command?: string;
  subcommand?: string;
  prompt?: string;
  promptName?: string;
  models?: string[];
  systemPrompt?: string;
  dataset?: string;
  project?: string;
  runId?: string;
  format?: string;
  open?: boolean;
  json?: boolean;
}

/**
 * Parse CLI arguments received from a second instance
 */
export function parseCliArgs(args: string[]): ParsedCliArgs {
  const parsed: ParsedCliArgs = {};

  // Skip the first argument (executable path)
  const relevantArgs = args.slice(1);

  for (let i = 0; i < relevantArgs.length; i++) {
    const arg = relevantArgs[i];
    const nextArg = relevantArgs[i + 1];

    // Subcommands
    if (!arg.startsWith('-')) {
      if (!parsed.command) {
        parsed.command = arg;
      } else if (!parsed.subcommand) {
        parsed.subcommand = arg;
      }
      continue;
    }

    // Flags
    switch (arg) {
      case '--open':
      case '-o':
        parsed.open = true;
        break;
      case '--json':
        parsed.json = true;
        break;
      case '--prompt':
        if (nextArg && !nextArg.startsWith('-')) {
          parsed.prompt = nextArg;
          i++;
        }
        break;
      case '--prompt-name':
        if (nextArg && !nextArg.startsWith('-')) {
          parsed.promptName = nextArg;
          i++;
        }
        break;
      case '--models':
      case '-m':
        if (nextArg && !nextArg.startsWith('-')) {
          parsed.models = nextArg.split(',').map(s => s.trim());
          i++;
        }
        break;
      case '--system':
      case '-s':
        if (nextArg && !nextArg.startsWith('-')) {
          parsed.systemPrompt = nextArg;
          i++;
        }
        break;
      case '--dataset':
      case '-d':
        if (nextArg && !nextArg.startsWith('-')) {
          parsed.dataset = nextArg;
          i++;
        }
        break;
      case '--project':
      case '-p':
        if (nextArg && !nextArg.startsWith('-')) {
          parsed.project = nextArg;
          i++;
        }
        break;
      case '--run':
      case '-r':
        if (nextArg && !nextArg.startsWith('-')) {
          parsed.runId = nextArg;
          i++;
        }
        break;
      case '--format':
      case '-f':
        if (nextArg && !nextArg.startsWith('-')) {
          parsed.format = nextArg;
          i++;
        }
        break;
    }
  }

  return parsed;
}

// ============================================================================
// Hook for React components
// ============================================================================

/**
 * Custom hook for using CLI events in React components
 * Call this in your main App component
 */
export function useCliEvents(callbacks: CliEventCallbacks): void {
  if (typeof window === 'undefined') return;

  // Use effect-like pattern
  const setup = async () => {
    const cleanup = await setupCliEventListeners(callbacks);

    // Check for pending runs on startup
    const pendingRuns = await checkPendingCliRuns();
    for (const run of pendingRuns) {
      callbacks.onPendingCliRun?.(run);
    }

    return cleanup;
  };

  // This would be called in useEffect in the actual component
  setup();
}
