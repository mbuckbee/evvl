/**
 * Export Functionality
 *
 * Functions for exporting evaluation results as JSON and CSV.
 * Used by both CLI and GUI.
 */

import {
  EvaluationRun,
  EvaluationResult,
  ProjectModelConfig,
  Prompt,
  AIOutput,
} from './types';

// ============================================================================
// Export Types
// ============================================================================

export interface ExportedRun {
  id: string;
  timestamp: number;
  prompt: string;
  systemPrompt?: string;
  results: ExportedResult[];
  status: string;
}

export interface ExportedResult {
  model: string;
  provider: string;
  content: string | null;
  tokens: number | null;
  latency: number | null;
  error: string | null;
  dataSetItem?: string;
}

// ============================================================================
// JSON Export
// ============================================================================

export function exportRunToJSON(
  run: EvaluationRun,
  prompt: Prompt | undefined,
  modelConfigs: ProjectModelConfig[]
): string {
  const promptVersion = prompt?.versions.find(v => v.id === run.promptVersionId);

  const exportedRun: ExportedRun = {
    id: run.id,
    timestamp: run.createdAt,
    prompt: promptVersion?.content || 'Unknown',
    systemPrompt: promptVersion?.systemPrompt,
    status: run.status,
    results: run.results.map(result => {
      const config = modelConfigs.find(c => c.id === result.modelConfigId);
      const output = result.output;

      return {
        model: config?.model || 'unknown',
        provider: config?.provider || 'unknown',
        content: output?.content || null,
        tokens: output?.tokens || null,
        latency: output?.latency || null,
        error: output?.error || result.error || null,
        dataSetItem: result.dataSetItemId,
      };
    }),
  };

  return JSON.stringify(exportedRun, null, 2);
}

export function exportMultipleRunsToJSON(
  runs: EvaluationRun[],
  prompts: Prompt[],
  modelConfigs: ProjectModelConfig[]
): string {
  const exportedRuns = runs.map(run => {
    const prompt = prompts.find(p => p.id === run.promptId);
    const promptVersion = prompt?.versions.find(v => v.id === run.promptVersionId);

    return {
      id: run.id,
      timestamp: run.createdAt,
      prompt: promptVersion?.content || 'Unknown',
      systemPrompt: promptVersion?.systemPrompt,
      status: run.status,
      results: run.results.map(result => {
        const config = modelConfigs.find(c => c.id === result.modelConfigId);
        const output = result.output;

        return {
          model: config?.model || 'unknown',
          provider: config?.provider || 'unknown',
          content: output?.content || null,
          tokens: output?.tokens || null,
          latency: output?.latency || null,
          error: output?.error || result.error || null,
          dataSetItem: result.dataSetItemId,
        };
      }),
    };
  });

  return JSON.stringify(exportedRuns, null, 2);
}

// ============================================================================
// CSV Export
// ============================================================================

function escapeCSV(value: string | null | undefined): string {
  if (value === null || value === undefined) {
    return '';
  }
  // Escape double quotes and wrap in quotes if needed
  const escaped = value.replace(/"/g, '""');
  if (escaped.includes(',') || escaped.includes('"') || escaped.includes('\n')) {
    return `"${escaped}"`;
  }
  return escaped;
}

export function exportRunToCSV(
  run: EvaluationRun,
  prompt: Prompt | undefined,
  modelConfigs: ProjectModelConfig[]
): string {
  const promptVersion = prompt?.versions.find(v => v.id === run.promptVersionId);
  const promptText = promptVersion?.content || 'Unknown';

  // CSV Header
  const headers = [
    'run_id',
    'timestamp',
    'prompt',
    'model',
    'provider',
    'content',
    'tokens',
    'latency_ms',
    'error',
    'dataset_item',
  ];

  const rows: string[] = [headers.join(',')];

  for (const result of run.results) {
    const config = modelConfigs.find(c => c.id === result.modelConfigId);
    const output = result.output;

    const row = [
      escapeCSV(run.id),
      run.createdAt.toString(),
      escapeCSV(promptText),
      escapeCSV(config?.model),
      escapeCSV(config?.provider),
      escapeCSV(output?.content),
      output?.tokens?.toString() || '',
      output?.latency?.toString() || '',
      escapeCSV(output?.error || result.error),
      escapeCSV(result.dataSetItemId),
    ];

    rows.push(row.join(','));
  }

  return rows.join('\n');
}

export function exportMultipleRunsToCSV(
  runs: EvaluationRun[],
  prompts: Prompt[],
  modelConfigs: ProjectModelConfig[]
): string {
  // CSV Header
  const headers = [
    'run_id',
    'timestamp',
    'prompt',
    'model',
    'provider',
    'content',
    'tokens',
    'latency_ms',
    'error',
    'dataset_item',
    'status',
  ];

  const rows: string[] = [headers.join(',')];

  for (const run of runs) {
    const prompt = prompts.find(p => p.id === run.promptId);
    const promptVersion = prompt?.versions.find(v => v.id === run.promptVersionId);
    const promptText = promptVersion?.content || 'Unknown';

    for (const result of run.results) {
      const config = modelConfigs.find(c => c.id === result.modelConfigId);
      const output = result.output;

      const row = [
        escapeCSV(run.id),
        run.createdAt.toString(),
        escapeCSV(promptText),
        escapeCSV(config?.model),
        escapeCSV(config?.provider),
        escapeCSV(output?.content),
        output?.tokens?.toString() || '',
        output?.latency?.toString() || '',
        escapeCSV(output?.error || result.error),
        escapeCSV(result.dataSetItemId),
        escapeCSV(run.status),
      ];

      rows.push(row.join(','));
    }
  }

  return rows.join('\n');
}

// ============================================================================
// Download Helpers (for GUI)
// ============================================================================

export function downloadAsFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function downloadJSON(content: string, filename: string = 'evvl-export.json'): void {
  downloadAsFile(content, filename, 'application/json');
}

export function downloadCSV(content: string, filename: string = 'evvl-export.csv'): void {
  downloadAsFile(content, filename, 'text/csv');
}

// ============================================================================
// Convenience Functions
// ============================================================================

export function exportAndDownloadRunJSON(
  run: EvaluationRun,
  prompt: Prompt | undefined,
  modelConfigs: ProjectModelConfig[],
  filename?: string
): void {
  const json = exportRunToJSON(run, prompt, modelConfigs);
  const defaultFilename = `evvl-run-${run.id.slice(0, 8)}-${new Date(run.createdAt).toISOString().slice(0, 10)}.json`;
  downloadJSON(json, filename || defaultFilename);
}

export function exportAndDownloadRunCSV(
  run: EvaluationRun,
  prompt: Prompt | undefined,
  modelConfigs: ProjectModelConfig[],
  filename?: string
): void {
  const csv = exportRunToCSV(run, prompt, modelConfigs);
  const defaultFilename = `evvl-run-${run.id.slice(0, 8)}-${new Date(run.createdAt).toISOString().slice(0, 10)}.csv`;
  downloadCSV(csv, filename || defaultFilename);
}

// ============================================================================
// Format for current evaluation state (not yet saved as a run)
// ============================================================================

export interface CurrentEvalExport {
  timestamp: number;
  prompt: string;
  systemPrompt?: string;
  outputs: {
    model: string;
    provider: string;
    content: string | null;
    tokens: number | null;
    latency: number | null;
    error: string | null;
  }[];
}

export function exportCurrentEvaluationToJSON(
  prompt: string,
  systemPrompt: string | undefined,
  outputs: AIOutput[]
): string {
  const exported: CurrentEvalExport = {
    timestamp: Date.now(),
    prompt,
    systemPrompt,
    outputs: outputs.map(output => ({
      model: output.modelConfig.model,
      provider: output.modelConfig.provider,
      content: output.content || null,
      tokens: output.tokens || null,
      latency: output.latency || null,
      error: output.error || null,
    })),
  };

  return JSON.stringify(exported, null, 2);
}

export function exportCurrentEvaluationToCSV(
  prompt: string,
  systemPrompt: string | undefined,
  outputs: AIOutput[]
): string {
  const headers = ['timestamp', 'prompt', 'system_prompt', 'model', 'provider', 'content', 'tokens', 'latency_ms', 'error'];
  const rows: string[] = [headers.join(',')];
  const timestamp = Date.now();

  for (const output of outputs) {
    const row = [
      timestamp.toString(),
      escapeCSV(prompt),
      escapeCSV(systemPrompt),
      escapeCSV(output.modelConfig.model),
      escapeCSV(output.modelConfig.provider),
      escapeCSV(output.content),
      output.tokens?.toString() || '',
      output.latency?.toString() || '',
      escapeCSV(output.error),
    ];
    rows.push(row.join(','));
  }

  return rows.join('\n');
}
