import {
  saveApiKeys,
  loadApiKeys,
  clearApiKeys,
  saveEvalResult,
  loadEvalHistory,
  deleteEvalResult,
  clearEvalHistory,
  getEvalById,
  saveColumns,
  loadColumns,
  clearColumns,
  saveProject,
  loadProjects,
  getProjectById,
  deleteProject,
  savePrompt,
  loadPrompts,
  getPromptById,
  getPromptsByProjectId,
  deletePrompt,
  saveModelConfig,
  loadModelConfigs,
  getModelConfigById,
  getModelConfigsByProjectId,
  deleteModelConfig,
  saveDataSet,
  loadDataSets,
  getDataSetById,
  getDataSetsByProjectId,
  deleteDataSet,
  saveEvaluationRun,
  loadEvaluationRuns,
  getEvaluationRunById,
  getEvaluationRunsByProjectId,
  deleteEvaluationRun,
  setActiveProjectId,
  getActiveProjectId,
  saveUIState,
  loadUIState,
  clearProjects,
  clearAllData,
  ColumnConfig,
} from '../storage';
import { Project, Prompt, ProjectModelConfig, DataSet, EvaluationRun, EvalResult } from '../types';

// Mock analytics
jest.mock('../analytics', () => ({
  trackEvent: jest.fn(),
}));

// Mock environment
jest.mock('../environment', () => ({
  isTauriEnvironment: jest.fn(() => false),
}));

describe('Storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  // ===========================================================================
  // API Keys
  // ===========================================================================
  describe('API Keys', () => {
    it('should save and load API keys', () => {
      const keys = { openai: 'sk-test', anthropic: 'ant-test' };
      saveApiKeys(keys);
      expect(loadApiKeys()).toEqual(keys);
    });

    it('should return empty object when no keys saved', () => {
      expect(loadApiKeys()).toEqual({});
    });

    it('should clear API keys', () => {
      saveApiKeys({ openai: 'sk-test' });
      clearApiKeys();
      expect(loadApiKeys()).toEqual({});
    });
  });

  // ===========================================================================
  // Eval History
  // ===========================================================================
  describe('Eval History', () => {
    const mockEval: EvalResult = {
      id: 'eval-1',
      prompt: 'Test prompt',
      timestamp: Date.now(),
      outputs: [],
      ratings: [],
    };

    it('should save and load eval results', () => {
      saveEvalResult(mockEval);
      const history = loadEvalHistory();
      expect(history).toHaveLength(1);
      expect(history[0].id).toBe('eval-1');
    });

    it('should prepend new evals to history', () => {
      saveEvalResult({ ...mockEval, id: 'eval-1' });
      saveEvalResult({ ...mockEval, id: 'eval-2' });
      const history = loadEvalHistory();
      expect(history[0].id).toBe('eval-2');
      expect(history[1].id).toBe('eval-1');
    });

    it('should limit history to 50 items', () => {
      for (let i = 0; i < 60; i++) {
        saveEvalResult({ ...mockEval, id: `eval-${i}` });
      }
      expect(loadEvalHistory()).toHaveLength(50);
    });

    it('should delete eval by id', () => {
      saveEvalResult({ ...mockEval, id: 'eval-1' });
      saveEvalResult({ ...mockEval, id: 'eval-2' });
      deleteEvalResult('eval-1');
      const history = loadEvalHistory();
      expect(history).toHaveLength(1);
      expect(history[0].id).toBe('eval-2');
    });

    it('should get eval by id', () => {
      saveEvalResult(mockEval);
      expect(getEvalById('eval-1')).toEqual(mockEval);
      expect(getEvalById('nonexistent')).toBeUndefined();
    });

    it('should clear eval history', () => {
      saveEvalResult(mockEval);
      clearEvalHistory();
      expect(loadEvalHistory()).toEqual([]);
    });
  });

  // ===========================================================================
  // Columns
  // ===========================================================================
  describe('Columns', () => {
    it('should save and load columns', () => {
      const columns: ColumnConfig[] = [
        { id: 'col-1', provider: 'openai', model: 'gpt-4' },
        { id: 'col-2', provider: 'anthropic', model: 'claude-3' },
      ];
      saveColumns(columns);
      // saveColumns normalizes columns by adding isConfiguring: false for configured columns
      const loaded = loadColumns();
      expect(loaded).toHaveLength(2);
      expect(loaded?.[0].id).toBe('col-1');
      expect(loaded?.[0].provider).toBe('openai');
      expect(loaded?.[1].id).toBe('col-2');
      expect(loaded?.[1].provider).toBe('anthropic');
    });

    it('should return null when no columns saved', () => {
      expect(loadColumns()).toBeNull();
    });

    it('should clear columns', () => {
      saveColumns([{ id: 'col-1' }]);
      clearColumns();
      expect(loadColumns()).toBeNull();
    });

    it('should normalize isConfiguring flag when saving', () => {
      const columns: ColumnConfig[] = [
        { id: 'col-1', provider: 'openai', model: 'gpt-4', isConfiguring: true },
      ];
      saveColumns(columns);
      const loaded = loadColumns();
      expect(loaded?.[0].isConfiguring).toBe(false);
    });
  });

  // ===========================================================================
  // Projects
  // ===========================================================================
  describe('Projects', () => {
    const mockProject: Project = {
      id: 'proj-1',
      name: 'Test Project',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      promptIds: [],
      modelConfigIds: [],
      dataSetIds: [],
    };

    it('should save and load projects', () => {
      saveProject(mockProject);
      const projects = loadProjects();
      expect(projects).toHaveLength(1);
      expect(projects[0].name).toBe('Test Project');
    });

    it('should update existing project', () => {
      saveProject(mockProject);
      saveProject({ ...mockProject, name: 'Updated Name' });
      const projects = loadProjects();
      expect(projects).toHaveLength(1);
      expect(projects[0].name).toBe('Updated Name');
    });

    it('should get project by id', () => {
      saveProject(mockProject);
      expect(getProjectById('proj-1')?.name).toBe('Test Project');
      expect(getProjectById('nonexistent')).toBeUndefined();
    });

    it('should delete project and associated data', () => {
      saveProject(mockProject);
      const prompt: Prompt = {
        id: 'prompt-1',
        projectId: 'proj-1',
        name: 'Test Prompt',
        versions: [],
        currentVersionId: '',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      savePrompt(prompt);

      deleteProject('proj-1');

      expect(loadProjects()).toHaveLength(0);
      expect(loadPrompts()).toHaveLength(0);
    });
  });

  // ===========================================================================
  // Prompts
  // ===========================================================================
  describe('Prompts', () => {
    const mockPrompt: Prompt = {
      id: 'prompt-1',
      projectId: 'proj-1',
      name: 'Test Prompt',
      versions: [{ id: 'v1', versionNumber: 1, content: 'Hello', createdAt: Date.now() }],
      currentVersionId: 'v1',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    it('should save and load prompts', () => {
      savePrompt(mockPrompt);
      expect(loadPrompts()).toHaveLength(1);
    });

    it('should get prompt by id', () => {
      savePrompt(mockPrompt);
      expect(getPromptById('prompt-1')?.name).toBe('Test Prompt');
    });

    it('should get prompts by project id', () => {
      savePrompt(mockPrompt);
      savePrompt({ ...mockPrompt, id: 'prompt-2', projectId: 'proj-2' });
      expect(getPromptsByProjectId('proj-1')).toHaveLength(1);
      expect(getPromptsByProjectId('proj-2')).toHaveLength(1);
    });

    it('should delete prompt', () => {
      savePrompt(mockPrompt);
      deletePrompt('prompt-1');
      expect(loadPrompts()).toHaveLength(0);
    });
  });

  // ===========================================================================
  // Model Configs
  // ===========================================================================
  describe('Model Configs', () => {
    const mockConfig: ProjectModelConfig = {
      id: 'config-1',
      projectId: 'proj-1',
      name: 'GPT-4',
      provider: 'openai',
      model: 'gpt-4',
      createdAt: Date.now(),
    };

    it('should save and load model configs', () => {
      saveModelConfig(mockConfig);
      expect(loadModelConfigs()).toHaveLength(1);
    });

    it('should get config by id', () => {
      saveModelConfig(mockConfig);
      expect(getModelConfigById('config-1')?.model).toBe('gpt-4');
    });

    it('should get configs by project id', () => {
      saveModelConfig(mockConfig);
      saveModelConfig({ ...mockConfig, id: 'config-2', projectId: 'proj-2' });
      expect(getModelConfigsByProjectId('proj-1')).toHaveLength(1);
    });

    it('should delete config', () => {
      saveModelConfig(mockConfig);
      deleteModelConfig('config-1');
      expect(loadModelConfigs()).toHaveLength(0);
    });
  });

  // ===========================================================================
  // Data Sets
  // ===========================================================================
  describe('Data Sets', () => {
    const mockDataSet: DataSet = {
      id: 'ds-1',
      projectId: 'proj-1',
      name: 'Test Dataset',
      items: [{ id: 'item-1', variables: { name: 'Alice' } }],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    it('should save and load data sets', () => {
      saveDataSet(mockDataSet);
      expect(loadDataSets()).toHaveLength(1);
    });

    it('should get data set by id', () => {
      saveDataSet(mockDataSet);
      expect(getDataSetById('ds-1')?.name).toBe('Test Dataset');
    });

    it('should get data sets by project id', () => {
      saveDataSet(mockDataSet);
      saveDataSet({ ...mockDataSet, id: 'ds-2', projectId: 'proj-2' });
      expect(getDataSetsByProjectId('proj-1')).toHaveLength(1);
    });

    it('should delete data set', () => {
      saveDataSet(mockDataSet);
      deleteDataSet('ds-1');
      expect(loadDataSets()).toHaveLength(0);
    });
  });

  // ===========================================================================
  // Evaluation Runs
  // ===========================================================================
  describe('Evaluation Runs', () => {
    const mockRun: EvaluationRun = {
      id: 'run-1',
      projectId: 'proj-1',
      promptId: 'prompt-1',
      promptVersionId: 'v1',
      modelConfigIds: ['config-1'],
      results: [],
      status: 'completed',
      createdAt: Date.now(),
    };

    it('should save and load evaluation runs', () => {
      saveEvaluationRun(mockRun);
      expect(loadEvaluationRuns()).toHaveLength(1);
    });

    it('should get run by id', () => {
      saveEvaluationRun(mockRun);
      expect(getEvaluationRunById('run-1')?.status).toBe('completed');
    });

    it('should get runs by project id', () => {
      saveEvaluationRun(mockRun);
      saveEvaluationRun({ ...mockRun, id: 'run-2', projectId: 'proj-2' });
      expect(getEvaluationRunsByProjectId('proj-1')).toHaveLength(1);
    });

    it('should delete run', () => {
      saveEvaluationRun(mockRun);
      deleteEvaluationRun('run-1');
      expect(loadEvaluationRuns()).toHaveLength(0);
    });
  });

  // ===========================================================================
  // Active Project
  // ===========================================================================
  describe('Active Project', () => {
    it('should set and get active project id', () => {
      setActiveProjectId('proj-1');
      expect(getActiveProjectId()).toBe('proj-1');
    });

    it('should return null when no active project', () => {
      expect(getActiveProjectId()).toBeNull();
    });

    it('should clear active project when set to null', () => {
      setActiveProjectId('proj-1');
      setActiveProjectId(null);
      expect(getActiveProjectId()).toBeNull();
    });
  });

  // ===========================================================================
  // UI State
  // ===========================================================================
  describe('UI State', () => {
    it('should save and load UI state', () => {
      const state = {
        openProjects: ['proj-1'],
        openSections: ['section-1'],
        selectedModelConfigs: ['config-1'],
        panelSizes: [300, 600],
      };
      saveUIState(state);
      expect(loadUIState()).toEqual(state);
    });

    it('should return default state when none saved', () => {
      const state = loadUIState();
      expect(state.openProjects).toEqual([]);
      expect(state.openSections).toEqual([]);
      expect(state.selectedModelConfigs).toEqual([]);
      expect(state.panelSizes).toEqual([280, 500]);
    });
  });

  // ===========================================================================
  // Clear Functions
  // ===========================================================================
  describe('Clear Functions', () => {
    it('should clear projects and related data', () => {
      saveProject({
        id: 'proj-1',
        name: 'Test',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        promptIds: [],
        modelConfigIds: [],
        dataSetIds: [],
      });
      saveApiKeys({ openai: 'sk-test' });

      clearProjects();

      expect(loadProjects()).toHaveLength(0);
      // API keys should be preserved
      expect(loadApiKeys()).toEqual({ openai: 'sk-test' });
    });

    it('should clear all data including API keys', () => {
      saveProject({
        id: 'proj-1',
        name: 'Test',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        promptIds: [],
        modelConfigIds: [],
        dataSetIds: [],
      });
      saveApiKeys({ openai: 'sk-test' });

      clearAllData();

      expect(loadProjects()).toHaveLength(0);
      expect(loadApiKeys()).toEqual({});
    });
  });
});
