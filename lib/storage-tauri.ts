/**
 * Tauri Store Implementation
 *
 * This module provides storage functions that use Tauri's store plugin
 * for file-based persistence. Used when running as a desktop app.
 *
 * Storage location: ~/.evvl/store.json
 */

import { invoke } from '@tauri-apps/api/core';
import {
  ApiKeys,
  Project,
  Prompt,
  ProjectModelConfig,
  DataSet,
  EvaluationRun,
} from './types';

// ============================================================================
// Core Store Functions (via Tauri commands)
// ============================================================================

async function getStoreData<T>(key: string): Promise<T | null> {
  try {
    const result = await invoke<T | null>('get_store_data', { key });
    return result;
  } catch (error) {
    console.error(`Error reading from store: ${key}`, error);
    return null;
  }
}

async function setStoreData<T>(key: string, value: T): Promise<void> {
  try {
    await invoke('set_store_data', { key, value });
  } catch (error) {
    console.error(`Error writing to store: ${key}`, error);
  }
}

// ============================================================================
// Storage Keys (same as localStorage keys for consistency)
// ============================================================================

const KEYS = {
  API_KEYS: 'evvl_api_keys',
  PROJECTS: 'evvl_projects_v2',
  PROMPTS: 'evvl_prompts_v2',
  MODEL_CONFIGS: 'evvl_model_configs_v2',
  DATA_SETS: 'evvl_data_sets_v2',
  EVALUATION_RUNS: 'evvl_evaluation_runs',
  ACTIVE_PROJECT: 'evvl_active_project_id',
  UI_STATE: 'evvl_ui_state',
  COLUMNS: 'evvl_columns',
  EVAL_HISTORY: 'evvl_eval_history',
};

// ============================================================================
// API Keys
// ============================================================================

export async function saveApiKeysTauri(keys: ApiKeys): Promise<void> {
  await setStoreData(KEYS.API_KEYS, keys);
}

export async function loadApiKeysTauri(): Promise<ApiKeys> {
  const keys = await getStoreData<ApiKeys>(KEYS.API_KEYS);
  return keys || {};
}

export async function clearApiKeysTauri(): Promise<void> {
  await setStoreData(KEYS.API_KEYS, {});
}

// ============================================================================
// Projects
// ============================================================================

export async function saveProjectTauri(project: Project): Promise<void> {
  const projects = await loadProjectsTauri();
  const existingIndex = projects.findIndex(p => p.id === project.id);

  if (existingIndex >= 0) {
    projects[existingIndex] = { ...project, updatedAt: Date.now() };
  } else {
    projects.push(project);
  }

  await setStoreData(KEYS.PROJECTS, projects);
}

export async function loadProjectsTauri(): Promise<Project[]> {
  const projects = await getStoreData<Project[]>(KEYS.PROJECTS);
  return projects || [];
}

export async function getProjectByIdTauri(id: string): Promise<Project | undefined> {
  const projects = await loadProjectsTauri();
  return projects.find(p => p.id === id);
}

export async function deleteProjectTauri(id: string): Promise<void> {
  const projects = await loadProjectsTauri();
  const filtered = projects.filter(p => p.id !== id);
  await setStoreData(KEYS.PROJECTS, filtered);

  // Also delete associated data
  await deletePromptsByProjectIdTauri(id);
  await deleteModelConfigsByProjectIdTauri(id);
  await deleteDataSetsByProjectIdTauri(id);
}

// ============================================================================
// Prompts
// ============================================================================

export async function savePromptTauri(prompt: Prompt): Promise<void> {
  const prompts = await loadPromptsTauri();
  const existingIndex = prompts.findIndex(p => p.id === prompt.id);

  if (existingIndex >= 0) {
    prompts[existingIndex] = { ...prompt, updatedAt: Date.now() };
  } else {
    prompts.push(prompt);
  }

  await setStoreData(KEYS.PROMPTS, prompts);
}

export async function loadPromptsTauri(): Promise<Prompt[]> {
  const prompts = await getStoreData<Prompt[]>(KEYS.PROMPTS);
  return prompts || [];
}

export async function getPromptByIdTauri(id: string): Promise<Prompt | undefined> {
  const prompts = await loadPromptsTauri();
  return prompts.find(p => p.id === id);
}

export async function getPromptsByProjectIdTauri(projectId: string): Promise<Prompt[]> {
  const prompts = await loadPromptsTauri();
  return prompts.filter(p => p.projectId === projectId);
}

export async function deletePromptTauri(id: string): Promise<void> {
  const prompts = await loadPromptsTauri();
  const filtered = prompts.filter(p => p.id !== id);
  await setStoreData(KEYS.PROMPTS, filtered);
}

async function deletePromptsByProjectIdTauri(projectId: string): Promise<void> {
  const prompts = await loadPromptsTauri();
  const filtered = prompts.filter(p => p.projectId !== projectId);
  await setStoreData(KEYS.PROMPTS, filtered);
}

// ============================================================================
// Model Configs
// ============================================================================

export async function saveModelConfigTauri(config: ProjectModelConfig): Promise<void> {
  const configs = await loadModelConfigsTauri();
  const existingIndex = configs.findIndex(c => c.id === config.id);

  if (existingIndex >= 0) {
    configs[existingIndex] = config;
  } else {
    configs.push(config);
  }

  await setStoreData(KEYS.MODEL_CONFIGS, configs);
}

export async function loadModelConfigsTauri(): Promise<ProjectModelConfig[]> {
  const configs = await getStoreData<ProjectModelConfig[]>(KEYS.MODEL_CONFIGS);
  return configs || [];
}

export async function getModelConfigByIdTauri(id: string): Promise<ProjectModelConfig | undefined> {
  const configs = await loadModelConfigsTauri();
  return configs.find(c => c.id === id);
}

export async function getModelConfigsByProjectIdTauri(projectId: string): Promise<ProjectModelConfig[]> {
  const configs = await loadModelConfigsTauri();
  return configs.filter(c => c.projectId === projectId);
}

export async function deleteModelConfigTauri(id: string): Promise<void> {
  const configs = await loadModelConfigsTauri();
  const filtered = configs.filter(c => c.id !== id);
  await setStoreData(KEYS.MODEL_CONFIGS, filtered);
}

async function deleteModelConfigsByProjectIdTauri(projectId: string): Promise<void> {
  const configs = await loadModelConfigsTauri();
  const filtered = configs.filter(c => c.projectId !== projectId);
  await setStoreData(KEYS.MODEL_CONFIGS, filtered);
}

// ============================================================================
// Data Sets
// ============================================================================

export async function saveDataSetTauri(dataSet: DataSet): Promise<void> {
  const dataSets = await loadDataSetsTauri();
  const existingIndex = dataSets.findIndex(d => d.id === dataSet.id);

  if (existingIndex >= 0) {
    dataSets[existingIndex] = { ...dataSet, updatedAt: Date.now() };
  } else {
    dataSets.push(dataSet);
  }

  await setStoreData(KEYS.DATA_SETS, dataSets);
}

export async function loadDataSetsTauri(): Promise<DataSet[]> {
  const dataSets = await getStoreData<DataSet[]>(KEYS.DATA_SETS);
  return dataSets || [];
}

export async function getDataSetByIdTauri(id: string): Promise<DataSet | undefined> {
  const dataSets = await loadDataSetsTauri();
  return dataSets.find(d => d.id === id);
}

export async function getDataSetsByProjectIdTauri(projectId: string): Promise<DataSet[]> {
  const dataSets = await loadDataSetsTauri();
  return dataSets.filter(d => d.projectId === projectId);
}

export async function deleteDataSetTauri(id: string): Promise<void> {
  const dataSets = await loadDataSetsTauri();
  const filtered = dataSets.filter(d => d.id !== id);
  await setStoreData(KEYS.DATA_SETS, filtered);
}

async function deleteDataSetsByProjectIdTauri(projectId: string): Promise<void> {
  const dataSets = await loadDataSetsTauri();
  const filtered = dataSets.filter(d => d.projectId !== projectId);
  await setStoreData(KEYS.DATA_SETS, filtered);
}

// ============================================================================
// Evaluation Runs
// ============================================================================

export async function saveEvaluationRunTauri(run: EvaluationRun): Promise<void> {
  const runs = await loadEvaluationRunsTauri();
  const existingIndex = runs.findIndex(r => r.id === run.id);

  if (existingIndex >= 0) {
    runs[existingIndex] = run;
  } else {
    runs.push(run);
  }

  await setStoreData(KEYS.EVALUATION_RUNS, runs);
}

export async function loadEvaluationRunsTauri(): Promise<EvaluationRun[]> {
  const runs = await getStoreData<EvaluationRun[]>(KEYS.EVALUATION_RUNS);
  return runs || [];
}

export async function getEvaluationRunByIdTauri(id: string): Promise<EvaluationRun | undefined> {
  const runs = await loadEvaluationRunsTauri();
  return runs.find(r => r.id === id);
}

export async function getEvaluationRunsByProjectIdTauri(projectId: string): Promise<EvaluationRun[]> {
  const runs = await loadEvaluationRunsTauri();
  return runs.filter(r => r.projectId === projectId);
}

export async function deleteEvaluationRunTauri(id: string): Promise<void> {
  const runs = await loadEvaluationRunsTauri();
  const filtered = runs.filter(r => r.id !== id);
  await setStoreData(KEYS.EVALUATION_RUNS, filtered);
}

// ============================================================================
// Active Project
// ============================================================================

export async function setActiveProjectIdTauri(id: string | null): Promise<void> {
  await setStoreData(KEYS.ACTIVE_PROJECT, id);
}

export async function getActiveProjectIdTauri(): Promise<string | null> {
  return await getStoreData<string>(KEYS.ACTIVE_PROJECT);
}

// ============================================================================
// UI State
// ============================================================================

interface UIState {
  openProjects: string[];
  openSections: string[];
  selectedPromptId?: string;
  selectedModelConfigs: string[];
  panelSizes: number[];
}

export async function saveUIStateTauri(state: UIState): Promise<void> {
  await setStoreData(KEYS.UI_STATE, state);
}

export async function loadUIStateTauri(): Promise<UIState> {
  const state = await getStoreData<UIState>(KEYS.UI_STATE);
  return state || {
    openProjects: [],
    openSections: [],
    selectedModelConfigs: [],
    panelSizes: [280, 500],
  };
}

// ============================================================================
// Clear All Data
// ============================================================================

export async function clearProjectsTauri(): Promise<void> {
  await setStoreData(KEYS.PROJECTS, []);
  await setStoreData(KEYS.PROMPTS, []);
  await setStoreData(KEYS.MODEL_CONFIGS, []);
  await setStoreData(KEYS.DATA_SETS, []);
  await setStoreData(KEYS.EVALUATION_RUNS, []);
  await setStoreData(KEYS.ACTIVE_PROJECT, null);
  await setStoreData(KEYS.UI_STATE, null);
}

export async function clearAllDataTauri(): Promise<void> {
  await clearProjectsTauri();
  await setStoreData(KEYS.API_KEYS, {});
}

// ============================================================================
// CLI Pending Runs (for GUI to pick up)
// ============================================================================

export interface PendingCliRun {
  prompt: string;
  systemPrompt?: string;
  models: string[];
  dataset?: string;
  openGui: boolean;
  status: string;
}

export async function getPendingCliRuns(): Promise<PendingCliRun[]> {
  try {
    const runs = await invoke<PendingCliRun[]>('get_pending_cli_runs');
    return runs || [];
  } catch (error) {
    console.error('Error getting pending CLI runs:', error);
    return [];
  }
}

// ============================================================================
// Sync utilities (for migrating localStorage to Tauri store)
// ============================================================================

export async function syncLocalStorageToTauriStore(): Promise<void> {
  // Only run in Tauri environment
  if (typeof window === 'undefined' || !(window as any).__TAURI__) {
    return;
  }

  // Check if we've already synced
  const syncedKey = 'evvl_tauri_synced';
  if (localStorage.getItem(syncedKey)) {
    return;
  }

  console.log('Syncing localStorage to Tauri store...');

  // Sync each data type
  const localProjects = localStorage.getItem(KEYS.PROJECTS);
  if (localProjects) {
    await setStoreData(KEYS.PROJECTS, JSON.parse(localProjects));
  }

  const localPrompts = localStorage.getItem(KEYS.PROMPTS);
  if (localPrompts) {
    await setStoreData(KEYS.PROMPTS, JSON.parse(localPrompts));
  }

  const localModelConfigs = localStorage.getItem(KEYS.MODEL_CONFIGS);
  if (localModelConfigs) {
    await setStoreData(KEYS.MODEL_CONFIGS, JSON.parse(localModelConfigs));
  }

  const localDataSets = localStorage.getItem(KEYS.DATA_SETS);
  if (localDataSets) {
    await setStoreData(KEYS.DATA_SETS, JSON.parse(localDataSets));
  }

  const localRuns = localStorage.getItem(KEYS.EVALUATION_RUNS);
  if (localRuns) {
    await setStoreData(KEYS.EVALUATION_RUNS, JSON.parse(localRuns));
  }

  const localApiKeys = localStorage.getItem(KEYS.API_KEYS);
  if (localApiKeys) {
    await setStoreData(KEYS.API_KEYS, JSON.parse(localApiKeys));
  }

  const localActiveProject = localStorage.getItem(KEYS.ACTIVE_PROJECT);
  if (localActiveProject) {
    await setStoreData(KEYS.ACTIVE_PROJECT, localActiveProject);
  }

  const localUIState = localStorage.getItem(KEYS.UI_STATE);
  if (localUIState) {
    await setStoreData(KEYS.UI_STATE, JSON.parse(localUIState));
  }

  // Mark as synced
  localStorage.setItem(syncedKey, 'true');
  console.log('Sync complete!');
}
