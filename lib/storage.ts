import {
  ApiKeys,
  EvalResult,
  Project,
  Prompt,
  ProjectModelConfig,
  DataSet,
  EvaluationRun,
} from './types';
import { trackEvent } from './analytics';

const API_KEYS_KEY = 'evvl_api_keys';
const EVAL_HISTORY_KEY = 'evvl_eval_history';
const COLUMNS_KEY = 'evvl_columns';

// API Keys
export function saveApiKeys(keys: ApiKeys): void {
  if (typeof window !== 'undefined') {
    // Track what changed (added or removed)
    const oldKeys = loadApiKeys();

    // Check each provider for changes
    ['openai', 'anthropic', 'openrouter', 'gemini'].forEach((provider) => {
      const providerKey = provider as 'openai' | 'anthropic' | 'openrouter' | 'gemini';
      const hadKey = !!oldKeys[providerKey];
      const hasKey = !!keys[providerKey];

      if (!hadKey && hasKey) {
        // Key was added
        trackEvent('api_key_added', { provider: providerKey });
      } else if (hadKey && !hasKey) {
        // Key was removed
        trackEvent('api_key_removed', { provider: providerKey });
      }
    });

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
  provider?: 'openai' | 'anthropic' | 'openrouter' | 'gemini';
  model?: string;
  isConfiguring?: boolean;
}

export function saveColumns(columns: ColumnConfig[]): void {
  if (typeof window !== 'undefined') {
    // Normalize columns before saving - ensure configured columns are not in configuring mode
    const normalizedColumns = columns.map(col => ({
      ...col,
      isConfiguring: col.provider && col.model ? false : col.isConfiguring
    }));
    localStorage.setItem(COLUMNS_KEY, JSON.stringify(normalizedColumns));
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

// ============================================================================
// Phase 2: Project-Based Storage
// ============================================================================

const PROJECTS_KEY = 'evvl_projects_v2';
const PROMPTS_KEY = 'evvl_prompts_v2';
const MODEL_CONFIGS_KEY = 'evvl_model_configs_v2';
const DATA_SETS_KEY = 'evvl_data_sets_v2';
const EVALUATION_RUNS_KEY = 'evvl_evaluation_runs';
const ACTIVE_PROJECT_KEY = 'evvl_active_project_id';
const UI_STATE_KEY = 'evvl_ui_state';

interface UIState {
  openProjects: string[];
  openSections: string[];
  selectedPromptId?: string;
  selectedModelConfigs: string[];
  panelSizes: number[];
}

// Projects
export function saveProject(project: Project): void {
  if (typeof window !== 'undefined') {
    const projects = loadProjects();
    const existingIndex = projects.findIndex(p => p.id === project.id);

    if (existingIndex >= 0) {
      projects[existingIndex] = { ...project, updatedAt: Date.now() };
    } else {
      projects.push(project);
    }

    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
  }
}

export function loadProjects(): Project[] {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(PROJECTS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  }
  return [];
}

export function getProjectById(id: string): Project | undefined {
  return loadProjects().find(p => p.id === id);
}

export function deleteProject(id: string): void {
  if (typeof window !== 'undefined') {
    const projects = loadProjects();
    const filtered = projects.filter(p => p.id !== id);
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(filtered));

    // Also delete associated prompts, model configs, and data sets
    deletePromptsByProjectId(id);
    deleteModelConfigsByProjectId(id);
    deleteDataSetsByProjectId(id);
  }
}

// Prompts
export function savePrompt(prompt: Prompt): void {
  if (typeof window !== 'undefined') {
    const prompts = loadPrompts();
    const existingIndex = prompts.findIndex(p => p.id === prompt.id);

    if (existingIndex >= 0) {
      prompts[existingIndex] = { ...prompt, updatedAt: Date.now() };
    } else {
      prompts.push(prompt);
    }

    localStorage.setItem(PROMPTS_KEY, JSON.stringify(prompts));
  }
}

export function loadPrompts(): Prompt[] {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(PROMPTS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  }
  return [];
}

export function getPromptById(id: string): Prompt | undefined {
  return loadPrompts().find(p => p.id === id);
}

export function getPromptsByProjectId(projectId: string): Prompt[] {
  return loadPrompts().filter(p => p.projectId === projectId);
}

export function deletePrompt(id: string): void {
  if (typeof window !== 'undefined') {
    const prompts = loadPrompts();
    const filtered = prompts.filter(p => p.id !== id);
    localStorage.setItem(PROMPTS_KEY, JSON.stringify(filtered));
  }
}

function deletePromptsByProjectId(projectId: string): void {
  if (typeof window !== 'undefined') {
    const prompts = loadPrompts();
    const filtered = prompts.filter(p => p.projectId !== projectId);
    localStorage.setItem(PROMPTS_KEY, JSON.stringify(filtered));
  }
}

// Model Configs
export function saveModelConfig(config: ProjectModelConfig): void {
  if (typeof window !== 'undefined') {
    const configs = loadModelConfigs();
    const existingIndex = configs.findIndex(c => c.id === config.id);

    if (existingIndex >= 0) {
      configs[existingIndex] = config;
    } else {
      configs.push(config);
    }

    localStorage.setItem(MODEL_CONFIGS_KEY, JSON.stringify(configs));
  }
}

export function loadModelConfigs(): ProjectModelConfig[] {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(MODEL_CONFIGS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  }
  return [];
}

export function getModelConfigById(id: string): ProjectModelConfig | undefined {
  return loadModelConfigs().find(c => c.id === id);
}

export function getModelConfigsByProjectId(projectId: string): ProjectModelConfig[] {
  return loadModelConfigs().filter(c => c.projectId === projectId);
}

export function deleteModelConfig(id: string): void {
  if (typeof window !== 'undefined') {
    const configs = loadModelConfigs();
    const filtered = configs.filter(c => c.id !== id);
    localStorage.setItem(MODEL_CONFIGS_KEY, JSON.stringify(filtered));
  }
}

function deleteModelConfigsByProjectId(projectId: string): void {
  if (typeof window !== 'undefined') {
    const configs = loadModelConfigs();
    const filtered = configs.filter(c => c.projectId !== projectId);
    localStorage.setItem(MODEL_CONFIGS_KEY, JSON.stringify(filtered));
  }
}

// Data Sets
export function saveDataSet(dataSet: DataSet): void {
  if (typeof window !== 'undefined') {
    const dataSets = loadDataSets();
    const existingIndex = dataSets.findIndex(d => d.id === dataSet.id);

    if (existingIndex >= 0) {
      dataSets[existingIndex] = { ...dataSet, updatedAt: Date.now() };
    } else {
      dataSets.push(dataSet);
    }

    localStorage.setItem(DATA_SETS_KEY, JSON.stringify(dataSets));
  }
}

export function loadDataSets(): DataSet[] {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(DATA_SETS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  }
  return [];
}

export function getDataSetById(id: string): DataSet | undefined {
  return loadDataSets().find(d => d.id === id);
}

export function getDataSetsByProjectId(projectId: string): DataSet[] {
  return loadDataSets().filter(d => d.projectId === projectId);
}

export function deleteDataSet(id: string): void {
  if (typeof window !== 'undefined') {
    const dataSets = loadDataSets();
    const filtered = dataSets.filter(d => d.id !== id);
    localStorage.setItem(DATA_SETS_KEY, JSON.stringify(filtered));
  }
}

function deleteDataSetsByProjectId(projectId: string): void {
  if (typeof window !== 'undefined') {
    const dataSets = loadDataSets();
    const filtered = dataSets.filter(d => d.projectId !== projectId);
    localStorage.setItem(DATA_SETS_KEY, JSON.stringify(filtered));
  }
}

// Evaluation Runs
export function saveEvaluationRun(run: EvaluationRun): void {
  if (typeof window !== 'undefined') {
    const runs = loadEvaluationRuns();
    const existingIndex = runs.findIndex(r => r.id === run.id);

    if (existingIndex >= 0) {
      runs[existingIndex] = run;
    } else {
      runs.push(run);
    }

    localStorage.setItem(EVALUATION_RUNS_KEY, JSON.stringify(runs));
  }
}

export function loadEvaluationRuns(): EvaluationRun[] {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(EVALUATION_RUNS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  }
  return [];
}

export function getEvaluationRunById(id: string): EvaluationRun | undefined {
  return loadEvaluationRuns().find(r => r.id === id);
}

export function getEvaluationRunsByProjectId(projectId: string): EvaluationRun[] {
  return loadEvaluationRuns().filter(r => r.projectId === projectId);
}

export function deleteEvaluationRun(id: string): void {
  if (typeof window !== 'undefined') {
    const runs = loadEvaluationRuns();
    const filtered = runs.filter(r => r.id !== id);
    localStorage.setItem(EVALUATION_RUNS_KEY, JSON.stringify(filtered));
  }
}

// Active Project
export function setActiveProjectId(id: string | null): void {
  if (typeof window !== 'undefined') {
    if (id === null) {
      localStorage.removeItem(ACTIVE_PROJECT_KEY);
    } else {
      localStorage.setItem(ACTIVE_PROJECT_KEY, id);
    }
  }
}

export function getActiveProjectId(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(ACTIVE_PROJECT_KEY);
  }
  return null;
}

// UI State
export function saveUIState(state: UIState): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(UI_STATE_KEY, JSON.stringify(state));
  }
}

export function loadUIState(): UIState {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(UI_STATE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  }
  return {
    openProjects: [],
    openSections: [],
    selectedModelConfigs: [],
    panelSizes: [280, 500], // Default panel sizes
  };
}

// Clear all projects and related data (keeps API keys)
export function clearProjects(): void {
  if (typeof window !== 'undefined') {
    // Clear project-related data
    localStorage.removeItem(PROJECTS_KEY);
    localStorage.removeItem(PROMPTS_KEY);
    localStorage.removeItem(MODEL_CONFIGS_KEY);
    localStorage.removeItem(DATA_SETS_KEY);
    localStorage.removeItem(EVALUATION_RUNS_KEY);
    localStorage.removeItem(ACTIVE_PROJECT_KEY);
    localStorage.removeItem(UI_STATE_KEY);
    localStorage.removeItem(EVAL_HISTORY_KEY);
    localStorage.removeItem(COLUMNS_KEY);
    // Clear migration flags so example project is created on next load
    localStorage.removeItem('evvl_migration_complete_v2');
    localStorage.removeItem('evvl_migration_timestamp');
  }
}

// Clear all data (danger zone)
export function clearAllData(): void {
  if (typeof window !== 'undefined') {
    // Clear all evvl-related localStorage keys
    localStorage.removeItem(API_KEYS_KEY);
    localStorage.removeItem(EVAL_HISTORY_KEY);
    localStorage.removeItem(COLUMNS_KEY);
    localStorage.removeItem(PROJECTS_KEY);
    localStorage.removeItem(PROMPTS_KEY);
    localStorage.removeItem(MODEL_CONFIGS_KEY);
    localStorage.removeItem(DATA_SETS_KEY);
    localStorage.removeItem(EVALUATION_RUNS_KEY);
    localStorage.removeItem(ACTIVE_PROJECT_KEY);
    localStorage.removeItem(UI_STATE_KEY);
    // Also clear migration flags so example project is created on next load
    localStorage.removeItem('evvl_migration_complete_v2');
    localStorage.removeItem('evvl_migration_timestamp');
  }
}
