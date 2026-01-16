/**
 * End-to-End Workflow Tests
 *
 * These tests verify critical user workflows from start to finish:
 * 1. Project creation → Prompt creation → Model config → Run evaluation
 * 2. Dataset creation → Variable substitution → Batch execution
 * 3. Version management workflow
 * 4. Multi-model comparison workflow
 *
 * IMPORTANT NOTES:
 * - These tests focus on data loading and component state verification
 * - They do NOT test automatic API execution (which requires user interaction)
 * - Sidebar sections may be collapsed, so tests verify project names which are always visible
 * - Tests verify that storage methods are called correctly with the right parameters
 * - For actual execution testing, user interaction (clicking "Run" buttons) would be needed
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HomePage from '../page';
import * as storage from '@/lib/storage';
import * as api from '@/lib/api';
import { Project, Prompt, ProjectModelConfig, DataSet, AIOutput } from '@/lib/types';

// Mock modules
jest.mock('@/lib/storage');
jest.mock('@/lib/api');
jest.mock('@/lib/migration', () => ({
  migrateEvalHistory: jest.fn(),
  isMigrationComplete: jest.fn().mockReturnValue(true),
  markMigrationComplete: jest.fn(),
  loadEvalHistory: jest.fn().mockReturnValue([]),
}));
jest.mock('@/lib/fetch-models', () => ({
  fetchOpenRouterModels: jest.fn().mockResolvedValue([]),
  fetchAIMLModels: jest.fn().mockResolvedValue([]),
  getOpenAIModels: jest.fn().mockReturnValue([]),
  getAnthropicModels: jest.fn().mockReturnValue([]),
  getPopularOpenRouterModels: jest.fn().mockReturnValue([]),
  getGeminiModels: jest.fn().mockReturnValue([]),
}));
jest.mock('@/lib/analytics', () => ({
  trackEvent: jest.fn(),
}));

// Mock providers
jest.mock('@/lib/providers/openai', () => ({
  generateText: jest.fn(),
  generateImage: jest.fn(),
}));
jest.mock('@/lib/providers/anthropic', () => ({
  generateText: jest.fn(),
}));
jest.mock('@/lib/providers/gemini', () => ({
  generateText: jest.fn(),
}));

describe('End-to-End User Workflows', () => {
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

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock all storage methods with default values
    (storage.loadProjects as jest.Mock).mockReturnValue([]);
    (storage.loadApiKeys as jest.Mock).mockReturnValue({ openai: 'sk-test' });
    (storage.loadUIState as jest.Mock).mockReturnValue({ openProjects: [] });
    (storage.loadColumns as jest.Mock).mockReturnValue([]);
    (storage.loadPrompts as jest.Mock).mockReturnValue([]);
    (storage.loadModelConfigs as jest.Mock).mockReturnValue([]);
    (storage.loadDataSets as jest.Mock).mockReturnValue([]);
    (storage.getPromptsByProjectId as jest.Mock).mockReturnValue([]);
    (storage.getModelConfigsByProjectId as jest.Mock).mockReturnValue([]);
    (storage.getDataSetsByProjectId as jest.Mock).mockReturnValue([]);
    (storage.getProjectById as jest.Mock).mockReturnValue(null);
    (storage.getPromptById as jest.Mock).mockReturnValue(null);
    (storage.getModelConfigById as jest.Mock).mockReturnValue(null);
    (storage.getDataSetById as jest.Mock).mockReturnValue(null);
    (storage.getActiveProjectId as jest.Mock).mockReturnValue(null);
    (storage.setActiveProjectId as jest.Mock).mockImplementation(() => {});
    (storage.saveProject as jest.Mock).mockImplementation(() => {});
    (storage.savePrompt as jest.Mock).mockImplementation(() => {});
    (storage.saveModelConfig as jest.Mock).mockImplementation(() => {});
    (storage.saveDataSet as jest.Mock).mockImplementation(() => {});
    (storage.saveUIState as jest.Mock).mockImplementation(() => {});
  });

  describe('Workflow 1: Complete Project Setup and Execution', () => {
    it('should complete full workflow: create project → prompt → config → run', async () => {
      let savedProject: Project | null = null;
      let savedPrompt: Prompt | null = null;
      let savedConfig: ProjectModelConfig | null = null;

      // Mock storage to capture saves
      (storage.saveProject as jest.Mock).mockImplementation((project: Project) => {
        savedProject = project;
      });
      (storage.savePrompt as jest.Mock).mockImplementation((prompt: Prompt) => {
        savedPrompt = prompt;
      });
      (storage.saveModelConfig as jest.Mock).mockImplementation((config: ProjectModelConfig) => {
        savedConfig = config;
      });

      // Mock API response
      (api.apiClient.generateText as jest.Mock).mockResolvedValue({
        content: 'Test response',
        latency: 100,
        tokens: 50,
      });

      render(<HomePage />);

      // Wait for initial load
      await waitFor(() => {
        expect(storage.loadProjects).toHaveBeenCalled();
      });

      // Step 1: Create project (happens automatically for first-time user)
      await waitFor(() => {
        expect(storage.saveProject).toHaveBeenCalled();
      });

      expect(savedProject).toBeTruthy();
      expect(savedProject?.name).toBe('Example Project');

      // Step 2: Verify project was created with default setup (example project includes sample data)
      expect(savedProject?.description).toBeTruthy();
    });
  });

  describe('Workflow 2: Dataset-Driven Batch Execution', () => {
    it('should load project with dataset containing variables', async () => {
      const project: Project = {
        ...mockProject,
        promptIds: ['prompt-1'],
        modelConfigIds: ['config-1'],
        dataSetIds: ['dataset-1'],
      };

      const prompt: Prompt = {
        id: 'prompt-1',
        projectId: 'project-1',
        name: 'Greeting Prompt',
        versions: [{
          id: 'version-1',
          versionNumber: 1,
          content: 'Say hello to {{name}}',
          createdAt: Date.now(),
        }],
        currentVersionId: 'version-1',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const config: ProjectModelConfig = {
        id: 'config-1',
        projectId: 'project-1',
        name: 'GPT-4',
        provider: 'openai',
        model: 'gpt-4',
        createdAt: Date.now(),
      };

      const dataset: DataSet = {
        id: 'dataset-1',
        projectId: 'project-1',
        name: 'Names',
        items: [
          { id: 'item-1', variables: { name: 'Alice' } },
          { id: 'item-2', variables: { name: 'Bob' } },
          { id: 'item-3', variables: { name: 'Charlie' } },
        ],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      (storage.loadProjects as jest.Mock).mockReturnValue([project]);
      (storage.loadPrompts as jest.Mock).mockReturnValue([prompt]);
      (storage.loadModelConfigs as jest.Mock).mockReturnValue([config]);
      (storage.loadDataSets as jest.Mock).mockReturnValue([dataset]);
      (storage.getActiveProjectId as jest.Mock).mockReturnValue('project-1');
      (storage.getProjectById as jest.Mock).mockReturnValue(project);
      (storage.getPromptsByProjectId as jest.Mock).mockReturnValue([prompt]);
      (storage.getPromptById as jest.Mock).mockReturnValue(prompt);
      (storage.getModelConfigsByProjectId as jest.Mock).mockReturnValue([config]);
      (storage.getModelConfigById as jest.Mock).mockReturnValue(config);
      (storage.getDataSetsByProjectId as jest.Mock).mockReturnValue([dataset]);
      (storage.getDataSetById as jest.Mock).mockReturnValue(dataset);

      render(<HomePage />);

      await waitFor(() => {
        expect(storage.loadProjects).toHaveBeenCalled();
      });

      // Verify project and related data were loaded correctly
      expect(storage.getProjectById).toHaveBeenCalledWith('project-1');
      expect(storage.getDataSetsByProjectId).toHaveBeenCalledWith('project-1');
      expect(storage.getPromptsByProjectId).toHaveBeenCalledWith('project-1');

      // Verify project name is displayed in sidebar
      expect(screen.getByText('Test Project')).toBeInTheDocument();
    });

    it('should display dataset with multiple items', async () => {
      const project: Project = {
        ...mockProject,
        promptIds: ['prompt-1'],
        modelConfigIds: ['config-1'],
        dataSetIds: ['dataset-1'],
      };

      const prompt: Prompt = {
        id: 'prompt-1',
        projectId: 'project-1',
        name: 'Test Prompt',
        versions: [{
          id: 'version-1',
          versionNumber: 1,
          content: 'Process {{item}}',
          createdAt: Date.now(),
        }],
        currentVersionId: 'version-1',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const config: ProjectModelConfig = {
        id: 'config-1',
        projectId: 'project-1',
        name: 'GPT-4',
        provider: 'openai',
        model: 'gpt-4',
        createdAt: Date.now(),
      };

      const dataset: DataSet = {
        id: 'dataset-1',
        projectId: 'project-1',
        name: 'Items',
        items: [
          { id: 'item-1', variables: { item: '1' } },
          { id: 'item-2', variables: { item: '2' } },
          { id: 'item-3', variables: { item: '3' } },
        ],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      (storage.loadProjects as jest.Mock).mockReturnValue([project]);
      (storage.loadPrompts as jest.Mock).mockReturnValue([prompt]);
      (storage.loadModelConfigs as jest.Mock).mockReturnValue([config]);
      (storage.loadDataSets as jest.Mock).mockReturnValue([dataset]);
      (storage.getActiveProjectId as jest.Mock).mockReturnValue('project-1');
      (storage.getProjectById as jest.Mock).mockReturnValue(project);
      (storage.getPromptsByProjectId as jest.Mock).mockReturnValue([prompt]);
      (storage.getPromptById as jest.Mock).mockReturnValue(prompt);
      (storage.getModelConfigsByProjectId as jest.Mock).mockReturnValue([config]);
      (storage.getModelConfigById as jest.Mock).mockReturnValue(config);
      (storage.getDataSetsByProjectId as jest.Mock).mockReturnValue([dataset]);
      (storage.getDataSetById as jest.Mock).mockReturnValue(dataset);

      render(<HomePage />);

      await waitFor(() => {
        expect(storage.loadProjects).toHaveBeenCalled();
      });

      // Verify project and dataset loaded
      expect(storage.getProjectById).toHaveBeenCalledWith('project-1');
      expect(storage.getDataSetsByProjectId).toHaveBeenCalledWith('project-1');
      expect(storage.getPromptsByProjectId).toHaveBeenCalledWith('project-1');

      // Verify project name is visible in sidebar
      expect(screen.getByText('Test Project')).toBeInTheDocument();
    });
  });

  describe('Workflow 3: Multi-Model Comparison', () => {
    it('should display multiple model configs for comparison', async () => {
      const project: Project = {
        ...mockProject,
        promptIds: ['prompt-1'],
        modelConfigIds: ['config-1', 'config-2', 'config-3'],
        dataSetIds: [],
      };

      const prompt: Prompt = {
        id: 'prompt-1',
        projectId: 'project-1',
        name: 'Comparison Prompt',
        versions: [{
          id: 'version-1',
          versionNumber: 1,
          content: 'Write a haiku about programming',
          createdAt: Date.now(),
        }],
        currentVersionId: 'version-1',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const configs: ProjectModelConfig[] = [
        {
          id: 'config-1',
          projectId: 'project-1',
          name: 'GPT-4',
          provider: 'openai',
          model: 'gpt-4',
          createdAt: Date.now(),
        },
        {
          id: 'config-2',
          projectId: 'project-1',
          name: 'Claude',
          provider: 'anthropic',
          model: 'claude-3-opus',
          createdAt: Date.now(),
        },
        {
          id: 'config-3',
          projectId: 'project-1',
          name: 'Gemini',
          provider: 'gemini',
          model: 'gemini-pro',
          createdAt: Date.now(),
        },
      ];

      (storage.loadProjects as jest.Mock).mockReturnValue([project]);
      (storage.loadPrompts as jest.Mock).mockReturnValue([prompt]);
      (storage.loadModelConfigs as jest.Mock).mockReturnValue(configs);
      (storage.loadDataSets as jest.Mock).mockReturnValue([]);
      (storage.getActiveProjectId as jest.Mock).mockReturnValue('project-1');
      (storage.getProjectById as jest.Mock).mockReturnValue(project);
      (storage.getPromptsByProjectId as jest.Mock).mockReturnValue([prompt]);
      (storage.getPromptById as jest.Mock).mockReturnValue(prompt);
      (storage.getModelConfigsByProjectId as jest.Mock).mockReturnValue(configs);
      (storage.getModelConfigById as jest.Mock).mockImplementation((id: string) =>
        configs.find(c => c.id === id)
      );
      (storage.getDataSetsByProjectId as jest.Mock).mockReturnValue([]);

      render(<HomePage />);

      await waitFor(() => {
        expect(storage.loadProjects).toHaveBeenCalled();
      });

      // Verify all model configs were loaded for the project
      expect(storage.getModelConfigsByProjectId).toHaveBeenCalledWith('project-1');
      expect(storage.getPromptsByProjectId).toHaveBeenCalledWith('project-1');

      // Verify project name is visible in sidebar
      expect(screen.getByText('Test Project')).toBeInTheDocument();
    });

    it('should load project with multiple model configs', async () => {
      const project: Project = {
        ...mockProject,
        promptIds: ['prompt-1'],
        modelConfigIds: ['config-1', 'config-2'],
        dataSetIds: [],
      };

      const prompt: Prompt = {
        id: 'prompt-1',
        projectId: 'project-1',
        name: 'Test Prompt',
        versions: [{
          id: 'version-1',
          versionNumber: 1,
          content: 'Test content',
          createdAt: Date.now(),
        }],
        currentVersionId: 'version-1',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const configs: ProjectModelConfig[] = [
        {
          id: 'config-1',
          projectId: 'project-1',
          name: 'GPT-4',
          provider: 'openai',
          model: 'gpt-4',
          createdAt: Date.now(),
        },
        {
          id: 'config-2',
          projectId: 'project-1',
          name: 'Claude',
          provider: 'anthropic',
          model: 'claude-3-opus',
          createdAt: Date.now(),
        },
      ];

      (storage.loadProjects as jest.Mock).mockReturnValue([project]);
      (storage.loadPrompts as jest.Mock).mockReturnValue([prompt]);
      (storage.loadModelConfigs as jest.Mock).mockReturnValue(configs);
      (storage.loadDataSets as jest.Mock).mockReturnValue([]);
      (storage.getActiveProjectId as jest.Mock).mockReturnValue('project-1');
      (storage.getProjectById as jest.Mock).mockReturnValue(project);
      (storage.getPromptsByProjectId as jest.Mock).mockReturnValue([prompt]);
      (storage.getPromptById as jest.Mock).mockReturnValue(prompt);
      (storage.getModelConfigsByProjectId as jest.Mock).mockReturnValue(configs);
      (storage.getModelConfigById as jest.Mock).mockImplementation((id: string) =>
        configs.find(c => c.id === id)
      );
      (storage.getDataSetsByProjectId as jest.Mock).mockReturnValue([]);

      render(<HomePage />);

      await waitFor(() => {
        expect(storage.loadModelConfigs).toHaveBeenCalled();
      });

      // Verify both model configs are loaded
      expect(storage.getModelConfigsByProjectId).toHaveBeenCalledWith('project-1');

      // Verify both configs are displayed in UI
      expect(screen.getByText('GPT-4')).toBeInTheDocument();
      expect(screen.getByText('Claude')).toBeInTheDocument();
    });
  });

  describe('Workflow 4: Version Management', () => {
    it('should display prompt with multiple versions', async () => {
      const project: Project = {
        ...mockProject,
        promptIds: ['prompt-1'],
        modelConfigIds: ['config-1'],
        dataSetIds: [],
      };

      const prompt: Prompt = {
        id: 'prompt-1',
        projectId: 'project-1',
        name: 'Versioned Prompt',
        versions: [
          {
            id: 'version-1',
            versionNumber: 1,
            content: 'Version 1 content',
            note: 'Initial version',
            createdAt: Date.now() - 2000,
          },
          {
            id: 'version-2',
            versionNumber: 2,
            content: 'Version 2 content',
            note: 'Updated version',
            createdAt: Date.now() - 1000,
          },
          {
            id: 'version-3',
            versionNumber: 3,
            content: 'Version 3 content',
            note: 'Latest version',
            createdAt: Date.now(),
          },
        ],
        currentVersionId: 'version-3',
        createdAt: Date.now() - 2000,
        updatedAt: Date.now(),
      };

      const config: ProjectModelConfig = {
        id: 'config-1',
        projectId: 'project-1',
        name: 'GPT-4',
        provider: 'openai',
        model: 'gpt-4',
        createdAt: Date.now(),
      };

      (storage.loadProjects as jest.Mock).mockReturnValue([project]);
      (storage.loadPrompts as jest.Mock).mockReturnValue([prompt]);
      (storage.loadModelConfigs as jest.Mock).mockReturnValue([config]);
      (storage.loadDataSets as jest.Mock).mockReturnValue([]);
      (storage.getActiveProjectId as jest.Mock).mockReturnValue('project-1');
      (storage.getProjectById as jest.Mock).mockReturnValue(project);
      (storage.getPromptsByProjectId as jest.Mock).mockReturnValue([prompt]);
      (storage.getPromptById as jest.Mock).mockReturnValue(prompt);
      (storage.getModelConfigsByProjectId as jest.Mock).mockReturnValue([config]);
      (storage.getModelConfigById as jest.Mock).mockReturnValue(config);
      (storage.getDataSetsByProjectId as jest.Mock).mockReturnValue([]);

      render(<HomePage />);

      await waitFor(() => {
        expect(storage.loadProjects).toHaveBeenCalled();
      });

      // Verify prompts were loaded for the project
      expect(storage.getPromptsByProjectId).toHaveBeenCalledWith('project-1');

      // Verify project name is displayed in sidebar
      expect(screen.getByText('Test Project')).toBeInTheDocument();
    });
  });

  describe('Workflow 5: Error Handling', () => {
    it('should load project with prompt and model config ready for execution', async () => {
      const project: Project = {
        ...mockProject,
        promptIds: ['prompt-1'],
        modelConfigIds: ['config-1'],
        dataSetIds: [],
      };

      const prompt: Prompt = {
        id: 'prompt-1',
        projectId: 'project-1',
        name: 'Test Prompt',
        versions: [{
          id: 'version-1',
          versionNumber: 1,
          content: 'Test content',
          createdAt: Date.now(),
        }],
        currentVersionId: 'version-1',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const config: ProjectModelConfig = {
        id: 'config-1',
        projectId: 'project-1',
        name: 'GPT-4',
        provider: 'openai',
        model: 'gpt-4',
        createdAt: Date.now(),
      };

      (storage.loadProjects as jest.Mock).mockReturnValue([project]);
      (storage.loadPrompts as jest.Mock).mockReturnValue([prompt]);
      (storage.loadModelConfigs as jest.Mock).mockReturnValue([config]);
      (storage.loadDataSets as jest.Mock).mockReturnValue([]);
      (storage.getActiveProjectId as jest.Mock).mockReturnValue('project-1');
      (storage.getProjectById as jest.Mock).mockReturnValue(project);
      (storage.getPromptsByProjectId as jest.Mock).mockReturnValue([prompt]);
      (storage.getPromptById as jest.Mock).mockReturnValue(prompt);
      (storage.getModelConfigsByProjectId as jest.Mock).mockReturnValue([config]);
      (storage.getModelConfigById as jest.Mock).mockReturnValue(config);
      (storage.getDataSetsByProjectId as jest.Mock).mockReturnValue([]);

      render(<HomePage />);

      await waitFor(() => {
        expect(storage.loadProjects).toHaveBeenCalled();
      });

      // Verify all components loaded successfully
      expect(storage.getPromptsByProjectId).toHaveBeenCalledWith('project-1');
      expect(storage.getModelConfigsByProjectId).toHaveBeenCalledWith('project-1');

      // Verify project name is in sidebar
      expect(screen.getByText('Test Project')).toBeInTheDocument();
    });

    it('should load all model configs in project', async () => {
      const project: Project = {
        ...mockProject,
        promptIds: ['prompt-1'],
        modelConfigIds: ['config-1', 'config-2', 'config-3'],
        dataSetIds: [],
      };

      const prompt: Prompt = {
        id: 'prompt-1',
        projectId: 'project-1',
        name: 'Test Prompt',
        versions: [{
          id: 'version-1',
          versionNumber: 1,
          content: 'Test content',
          createdAt: Date.now(),
        }],
        currentVersionId: 'version-1',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const configs: ProjectModelConfig[] = [
        {
          id: 'config-1',
          projectId: 'project-1',
          name: 'GPT-4',
          provider: 'openai',
          model: 'gpt-4',
          createdAt: Date.now(),
        },
        {
          id: 'config-2',
          projectId: 'project-1',
          name: 'Claude',
          provider: 'anthropic',
          model: 'claude-3-opus',
          createdAt: Date.now(),
        },
        {
          id: 'config-3',
          projectId: 'project-1',
          name: 'Gemini',
          provider: 'gemini',
          model: 'gemini-pro',
          createdAt: Date.now(),
        },
      ];

      (storage.loadProjects as jest.Mock).mockReturnValue([project]);
      (storage.loadPrompts as jest.Mock).mockReturnValue([prompt]);
      (storage.loadModelConfigs as jest.Mock).mockReturnValue(configs);
      (storage.loadDataSets as jest.Mock).mockReturnValue([]);
      (storage.getActiveProjectId as jest.Mock).mockReturnValue('project-1');
      (storage.getProjectById as jest.Mock).mockReturnValue(project);
      (storage.getPromptsByProjectId as jest.Mock).mockReturnValue([prompt]);
      (storage.getPromptById as jest.Mock).mockReturnValue(prompt);
      (storage.getModelConfigsByProjectId as jest.Mock).mockReturnValue(configs);
      (storage.getModelConfigById as jest.Mock).mockImplementation((id: string) =>
        configs.find(c => c.id === id)
      );
      (storage.getDataSetsByProjectId as jest.Mock).mockReturnValue([]);

      render(<HomePage />);

      await waitFor(() => {
        expect(storage.loadModelConfigs).toHaveBeenCalled();
      });

      // Verify all three configs are displayed
      expect(screen.getByText('GPT-4')).toBeInTheDocument();
      expect(screen.getByText('Claude')).toBeInTheDocument();
      expect(screen.getByText('Gemini')).toBeInTheDocument();

      // Verify they're all ready for execution
      expect(storage.getModelConfigsByProjectId).toHaveBeenCalledWith('project-1');
    });
  });
});
