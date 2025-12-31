import { ApiKeys, EvalResult } from './types';

const API_KEYS_KEY = 'evvl_api_keys';
const EVAL_HISTORY_KEY = 'evvl_eval_history';
const COLUMNS_KEY = 'evvl_columns';

// API Keys
export function saveApiKeys(keys: ApiKeys): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(API_KEYS_KEY, JSON.stringify(keys));
  }
}

export function loadApiKeys(): ApiKeys {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(API_KEYS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  }
  return {};
}

export function clearApiKeys(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(API_KEYS_KEY);
  }
}

// Eval History
export function saveEvalResult(result: EvalResult): void {
  if (typeof window !== 'undefined') {
    const history = loadEvalHistory();
    history.unshift(result); // Add to beginning
    // Keep only last 50 evals
    const trimmed = history.slice(0, 50);
    localStorage.setItem(EVAL_HISTORY_KEY, JSON.stringify(trimmed));
  }
}

export function loadEvalHistory(): EvalResult[] {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(EVAL_HISTORY_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  }
  return [];
}

export function deleteEvalResult(id: string): void {
  if (typeof window !== 'undefined') {
    const history = loadEvalHistory();
    const filtered = history.filter(e => e.id !== id);
    localStorage.setItem(EVAL_HISTORY_KEY, JSON.stringify(filtered));
  }
}

export function clearEvalHistory(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(EVAL_HISTORY_KEY);
  }
}

export function getEvalById(id: string): EvalResult | undefined {
  const history = loadEvalHistory();
  return history.find(e => e.id === id);
}

// Column Configurations
export interface ColumnConfig {
  id: string;
  provider?: 'openai' | 'anthropic' | 'openrouter';
  model?: string;
  isConfiguring?: boolean;
}

export function saveColumns(columns: ColumnConfig[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(COLUMNS_KEY, JSON.stringify(columns));
  }
}

export function loadColumns(): ColumnConfig[] | null {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(COLUMNS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  }
  return null;
}

export function clearColumns(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(COLUMNS_KEY);
  }
}
