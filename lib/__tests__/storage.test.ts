import {
  saveApiKeys,
  loadApiKeys,
  clearApiKeys,
  saveEvalResult,
  loadEvalHistory,
  deleteEvalResult,
  clearEvalHistory,
  getEvalById,
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
} from '../storage';
import { ApiKeys, EvalResult, Project, Prompt, ProjectModelConfig, DataSet } from '../types';

// Mock analytics
jest.mock('../analytics', () => ({
  trackEvent: jest.fn(),
}));

describe('Storage Utilities', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    jest.clearAllMocks();
  });

  describe('API Keys', () => {
    it('should save API keys to localStorage', () => {
      const keys: ApiKeys = {
        openai: 'sk-test-123',
        anthropic: 'sk-ant-test-456',
        openrouter: 'sk-or-test-789',
      };

      saveApiKeys(keys);

      const stored = localStorage.getItem('evvl_api_keys');
      expect(stored).toBe(JSON.stringify(keys));
    });

    it('should load API keys from localStorage', () => {
      const keys: ApiKeys = {
        openai: 'sk-test-123',
        anthropic: 'sk-ant-test-456',
      };

      localStorage.setItem('evvl_api_keys', JSON.stringify(keys));

      const result = loadApiKeys();

      expect(result).toEqual(keys);
    });

    it('should return empty object when no API keys are stored', () => {
      const result = loadApiKeys();

      expect(result).toEqual({});
    });

    it('should clear API keys from localStorage', () => {
      const keys: ApiKeys = {
        openai: 'sk-test-123',
      };

      localStorage.setItem('evvl_api_keys', JSON.stringify(keys));

      clearApiKeys();

      const stored = localStorage.getItem('evvl_api_keys');
      expect(stored).toBeNull();
    });
  });

  describe('Eval History', () => {
    const mockEvalResult: EvalResult = {
      id: 'eval-123',
      prompt: 'Test prompt',
      outputs: [
        {
          id: 'output-1',
          modelConfig: { provider: 'openai', model: 'gpt-4-turbo-preview', label: 'GPT-4 Turbo' },
          content: 'Test response',
          tokens: 100,
          latency: 500,
          timestamp: Date.now(),
        },
      ],
      timestamp: Date.now(),
    };

    it('should save eval result to localStorage', () => {
      saveEvalResult(mockEvalResult);

      const stored = localStorage.getItem('evvl_eval_history');
      const history = JSON.parse(stored!);

      expect(history).toHaveLength(1);
      expect(history[0]).toEqual(mockEvalResult);
    });

    it('should add new eval to beginning of history', () => {
      const existingEval: EvalResult = {
        ...mockEvalResult,
        id: 'eval-old',
        prompt: 'Old prompt',
      };

      localStorage.setItem('evvl_eval_history', JSON.stringify([existingEval]));

      const newEval: EvalResult = {
        ...mockEvalResult,
        id: 'eval-new',
        prompt: 'New prompt',
      };

      saveEvalResult(newEval);

      const stored = localStorage.getItem('evvl_eval_history');
      const history = JSON.parse(stored!);

      expect(history[0].id).toBe('eval-new');
      expect(history[1].id).toBe('eval-old');
    });

    it('should limit history to 50 items', () => {
      // Create 50 eval results
      const manyEvals: EvalResult[] = Array.from({ length: 50 }, (_, i) => ({
        ...mockEvalResult,
        id: `eval-${i}`,
      }));

      localStorage.setItem('evvl_eval_history', JSON.stringify(manyEvals));

      const newEval: EvalResult = {
        ...mockEvalResult,
        id: 'eval-new',
      };

      saveEvalResult(newEval);

      const stored = localStorage.getItem('evvl_eval_history');
      const history = JSON.parse(stored!);

      expect(history.length).toBe(50);
      expect(history[0].id).toBe('eval-new');
      expect(history[49].id).toBe('eval-48');
      // eval-49 should be removed (it was the last item)
      expect(history.find((e: EvalResult) => e.id === 'eval-49')).toBeUndefined();
    });

    it('should load eval history from localStorage', () => {
      const history: EvalResult[] = [mockEvalResult];

      localStorage.setItem('evvl_eval_history', JSON.stringify(history));

      const result = loadEvalHistory();

      expect(result).toEqual(history);
    });

    it('should return empty array when no history exists', () => {
      const result = loadEvalHistory();

      expect(result).toEqual([]);
    });

    it('should delete eval result by id', () => {
      const history: EvalResult[] = [
        { ...mockEvalResult, id: 'eval-1' },
        { ...mockEvalResult, id: 'eval-2' },
        { ...mockEvalResult, id: 'eval-3' },
      ];

      localStorage.setItem('evvl_eval_history', JSON.stringify(history));

      deleteEvalResult('eval-2');

      const stored = localStorage.getItem('evvl_eval_history');
      const updatedHistory = JSON.parse(stored!);

      expect(updatedHistory.length).toBe(2);
      expect(updatedHistory.find((e: EvalResult) => e.id === 'eval-2')).toBeUndefined();
      expect(updatedHistory.find((e: EvalResult) => e.id === 'eval-1')).toBeDefined();
      expect(updatedHistory.find((e: EvalResult) => e.id === 'eval-3')).toBeDefined();
    });

    it('should clear eval history from localStorage', () => {
      const history: EvalResult[] = [mockEvalResult];

      localStorage.setItem('evvl_eval_history', JSON.stringify(history));

      clearEvalHistory();

      const stored = localStorage.getItem('evvl_eval_history');
      expect(stored).toBeNull();
    });

    it('should get eval by id', () => {
      const history: EvalResult[] = [
        { ...mockEvalResult, id: 'eval-1', prompt: 'First' },
        { ...mockEvalResult, id: 'eval-2', prompt: 'Second' },
      ];

      localStorage.setItem('evvl_eval_history', JSON.stringify(history));

      const result = getEvalById('eval-2');

      expect(result?.id).toBe('eval-2');
      expect(result?.prompt).toBe('Second');
    });

    it('should return undefined when eval id not found', () => {
      localStorage.setItem('evvl_eval_history', JSON.stringify([]));

      const result = getEvalById('nonexistent');

      expect(result).toBeUndefined();
    });
  });

  describe('Project CRUD Operations', () => {
    const mockProject: Project = {
      id: 'project-1',
      name: 'Test Project',
      description: 'A test project',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      promptIds: [],
      modelConfigIds: [],
      dataSetIds: [],
    };

    it('should save a new project', () => {
      saveProject(mockProject);

      const projects = loadProjects();
      expect(projects).toHaveLength(1);
      expect(projects[0]).toEqual(mockProject);
    });

    it('should update an existing project', () => {
      saveProject(mockProject);

      const updatedProject = {
        ...mockProject,
        name: 'Updated Project',
      };

      saveProject(updatedProject);

      const projects = loadProjects();
      expect(projects).toHaveLength(1);
      expect(projects[0].name).toBe('Updated Project');
      expect(projects[0].updatedAt).toBeGreaterThan(mockProject.updatedAt);
    });

    it('should get a project by ID', () => {
      saveProject(mockProject);

      const retrieved = getProjectById('project-1');
      expect(retrieved).toEqual(mockProject);
    });

    it('should return undefined for non-existent project', () => {
      const retrieved = getProjectById('non-existent');
      expect(retrieved).toBeUndefined();
    });

    it('should delete a project and its associated data', () => {
      const project = mockProject;
      const prompt: Prompt = {
        id: 'prompt-1',
        projectId: 'project-1',
        name: 'Test Prompt',
        versions: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      saveProject(project);
      savePrompt(prompt);

      expect(loadProjects()).toHaveLength(1);
      expect(loadPrompts()).toHaveLength(1);

      deleteProject('project-1');

      expect(loadProjects()).toHaveLength(0);
      expect(loadPrompts()).toHaveLength(0);
    });

    it('should return empty array when no projects exist', () => {
      const projects = loadProjects();
      expect(projects).toEqual([]);
    });
  });

  describe('Prompt CRUD Operations', () => {
    const mockPrompt: Prompt = {
      id: 'prompt-1',
      projectId: 'project-1',
      name: 'Test Prompt',
      versions: [
        {
          id: 'version-1',
          content: 'Test content',
          createdAt: Date.now(),
        },
      ],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    it('should save a new prompt', () => {
      savePrompt(mockPrompt);

      const prompts = loadPrompts();
      expect(prompts).toHaveLength(1);
      expect(prompts[0]).toEqual(mockPrompt);
    });

    it('should update an existing prompt', () => {
      savePrompt(mockPrompt);

      const updatedPrompt = {
        ...mockPrompt,
        name: 'Updated Prompt',
      };

      savePrompt(updatedPrompt);

      const prompts = loadPrompts();
      expect(prompts).toHaveLength(1);
      expect(prompts[0].name).toBe('Updated Prompt');
      expect(prompts[0].updatedAt).toBeGreaterThan(mockPrompt.updatedAt);
    });

    it('should get a prompt by ID', () => {
      savePrompt(mockPrompt);

      const retrieved = getPromptById('prompt-1');
      expect(retrieved).toEqual(mockPrompt);
    });

    it('should get prompts by project ID', () => {
      const prompt1: Prompt = { ...mockPrompt, id: 'prompt-1', projectId: 'project-1' };
      const prompt2: Prompt = { ...mockPrompt, id: 'prompt-2', projectId: 'project-1' };
      const prompt3: Prompt = { ...mockPrompt, id: 'prompt-3', projectId: 'project-2' };

      savePrompt(prompt1);
      savePrompt(prompt2);
      savePrompt(prompt3);

      const project1Prompts = getPromptsByProjectId('project-1');
      expect(project1Prompts).toHaveLength(2);
      expect(project1Prompts.every(p => p.projectId === 'project-1')).toBe(true);
    });

    it('should delete a prompt', () => {
      savePrompt(mockPrompt);
      expect(loadPrompts()).toHaveLength(1);

      deletePrompt('prompt-1');
      expect(loadPrompts()).toHaveLength(0);
    });

    it('should return empty array when no prompts exist', () => {
      const prompts = loadPrompts();
      expect(prompts).toEqual([]);
    });
  });

  describe('Model Config CRUD Operations', () => {
    const mockConfig: ProjectModelConfig = {
      id: 'config-1',
      projectId: 'project-1',
      name: 'Test Config',
      provider: 'openai',
      model: 'gpt-4',
      createdAt: Date.now(),
    };

    it('should save a new model config', () => {
      saveModelConfig(mockConfig);

      const configs = loadModelConfigs();
      expect(configs).toHaveLength(1);
      expect(configs[0]).toEqual(mockConfig);
    });

    it('should update an existing model config', () => {
      saveModelConfig(mockConfig);

      const updatedConfig = {
        ...mockConfig,
        name: 'Updated Config',
      };

      saveModelConfig(updatedConfig);

      const configs = loadModelConfigs();
      expect(configs).toHaveLength(1);
      expect(configs[0].name).toBe('Updated Config');
    });

    it('should get a model config by ID', () => {
      saveModelConfig(mockConfig);

      const retrieved = getModelConfigById('config-1');
      expect(retrieved).toEqual(mockConfig);
    });

    it('should get model configs by project ID', () => {
      const config1: ProjectModelConfig = { ...mockConfig, id: 'config-1', projectId: 'project-1' };
      const config2: ProjectModelConfig = { ...mockConfig, id: 'config-2', projectId: 'project-1' };
      const config3: ProjectModelConfig = { ...mockConfig, id: 'config-3', projectId: 'project-2' };

      saveModelConfig(config1);
      saveModelConfig(config2);
      saveModelConfig(config3);

      const project1Configs = getModelConfigsByProjectId('project-1');
      expect(project1Configs).toHaveLength(2);
      expect(project1Configs.every(c => c.projectId === 'project-1')).toBe(true);
    });

    it('should delete a model config', () => {
      saveModelConfig(mockConfig);
      expect(loadModelConfigs()).toHaveLength(1);

      deleteModelConfig('config-1');
      expect(loadModelConfigs()).toHaveLength(0);
    });

    it('should return empty array when no configs exist', () => {
      const configs = loadModelConfigs();
      expect(configs).toEqual([]);
    });
  });

  describe('DataSet CRUD Operations', () => {
    const mockDataSet: DataSet = {
      id: 'dataset-1',
      projectId: 'project-1',
      name: 'Test Dataset',
      items: [
        { id: 'item-1', variables: { name: 'test' } },
      ],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    it('should save a new dataset', () => {
      saveDataSet(mockDataSet);

      const dataSets = loadDataSets();
      expect(dataSets).toHaveLength(1);
      expect(dataSets[0]).toEqual(mockDataSet);
    });

    it('should update an existing dataset', () => {
      saveDataSet(mockDataSet);

      const updatedDataSet = {
        ...mockDataSet,
        name: 'Updated Dataset',
      };

      saveDataSet(updatedDataSet);

      const dataSets = loadDataSets();
      expect(dataSets).toHaveLength(1);
      expect(dataSets[0].name).toBe('Updated Dataset');
      expect(dataSets[0].updatedAt).toBeGreaterThan(mockDataSet.updatedAt);
    });

    it('should get a dataset by ID', () => {
      saveDataSet(mockDataSet);

      const retrieved = getDataSetById('dataset-1');
      expect(retrieved).toEqual(mockDataSet);
    });

    it('should get datasets by project ID', () => {
      const dataset1: DataSet = { ...mockDataSet, id: 'dataset-1', projectId: 'project-1' };
      const dataset2: DataSet = { ...mockDataSet, id: 'dataset-2', projectId: 'project-1' };
      const dataset3: DataSet = { ...mockDataSet, id: 'dataset-3', projectId: 'project-2' };

      saveDataSet(dataset1);
      saveDataSet(dataset2);
      saveDataSet(dataset3);

      const project1DataSets = getDataSetsByProjectId('project-1');
      expect(project1DataSets).toHaveLength(2);
      expect(project1DataSets.every(d => d.projectId === 'project-1')).toBe(true);
    });

    it('should delete a dataset', () => {
      saveDataSet(mockDataSet);
      expect(loadDataSets()).toHaveLength(1);

      deleteDataSet('dataset-1');
      expect(loadDataSets()).toHaveLength(0);
    });

    it('should return empty array when no datasets exist', () => {
      const dataSets = loadDataSets();
      expect(dataSets).toEqual([]);
    });
  });
});
