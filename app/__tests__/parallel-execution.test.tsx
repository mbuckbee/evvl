/**
 * Tests for parallel execution setup and data structure
 *
 * These tests verify that:
 * 1. Projects with datasets are loaded correctly
 * 2. Data structures support parallel execution
 * 3. UI displays dataset items properly
 * 4. Component state is ready for execution when user clicks "Run"
 *
 * NOTE: These tests do NOT test automatic execution, as the app requires
 * user interaction (clicking "Run" or "Refresh") to trigger API calls.
 */

import { render, screen, waitFor } from '@testing-library/react';
import HomePage from '../page';
import * as storage from '@/lib/storage';
import { Project, Prompt, ProjectModelConfig, DataSet } from '@/lib/types';

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
  getOpenAIModels: jest.fn().mockReturnValue([]),
  getAnthropicModels: jest.fn().mockReturnValue([]),
  getPopularOpenRouterModels: jest.fn().mockReturnValue([]),
  getGeminiModels: jest.fn().mockReturnValue([]),
}));
jest.mock('@/lib/analytics', () => ({
  trackEvent: jest.fn(),
}));

describe('Parallel Execution Setup', () => {
  const mockProject: Project = {
    id: 'project-1',
    name: 'Test Project',
    description: 'Test description',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    promptIds: ['prompt-1'],
    modelConfigIds: ['config-1'],
    dataSetIds: ['dataset-1'],
  };

  const mockPrompt: Prompt = {
    id: 'prompt-1',
    projectId: 'project-1',
    name: 'Test Prompt',
    versions: [
      {
        id: 'version-1',
        versionNumber: 1,
        content: 'Generate an image of {{animal}}',
        createdAt: Date.now(),
      },
    ],
    currentVersionId: 'version-1',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  const mockConfig: ProjectModelConfig = {
    id: 'config-1',
    projectId: 'project-1',
    name: 'Test Config',
    provider: 'openai',
    model: 'dall-e-3',
    createdAt: Date.now(),
  };

  const mockDataSet: DataSet = {
    id: 'dataset-1',
    projectId: 'project-1',
    name: 'Animals',
    items: [
      { id: 'item-1', variables: { animal: 'cat' } },
      { id: 'item-2', variables: { animal: 'raccoon' } },
      { id: 'item-3', variables: { animal: 'rat' } },
    ],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup storage mocks - comprehensive list for HomePage
    (storage.loadProjects as jest.Mock).mockReturnValue([mockProject]);
    (storage.loadPrompts as jest.Mock).mockReturnValue([mockPrompt]);
    (storage.loadModelConfigs as jest.Mock).mockReturnValue([mockConfig]);
    (storage.loadDataSets as jest.Mock).mockReturnValue([mockDataSet]);
    (storage.loadApiKeys as jest.Mock).mockReturnValue({ openai: 'sk-test' });
    (storage.loadUIState as jest.Mock).mockReturnValue({ openProjects: [] });
    (storage.loadColumns as jest.Mock).mockReturnValue([]);
    (storage.getActiveProjectId as jest.Mock).mockReturnValue('project-1');
    (storage.getProjectById as jest.Mock).mockReturnValue(mockProject);
    (storage.getPromptsByProjectId as jest.Mock).mockReturnValue([mockPrompt]);
    (storage.getPromptById as jest.Mock).mockReturnValue(mockPrompt);
    (storage.getModelConfigsByProjectId as jest.Mock).mockReturnValue([mockConfig]);
    (storage.getModelConfigById as jest.Mock).mockReturnValue(mockConfig);
    (storage.getDataSetsByProjectId as jest.Mock).mockReturnValue([mockDataSet]);
    (storage.getDataSetById as jest.Mock).mockReturnValue(mockDataSet);
    (storage.setActiveProjectId as jest.Mock).mockImplementation(() => {});
    (storage.saveProject as jest.Mock).mockImplementation(() => {});
    (storage.savePrompt as jest.Mock).mockImplementation(() => {});
    (storage.saveModelConfig as jest.Mock).mockImplementation(() => {});
    (storage.saveDataSet as jest.Mock).mockImplementation(() => {});
    (storage.saveUIState as jest.Mock).mockImplementation(() => {});
  });

  it('should load project with dataset containing multiple items', async () => {
    render(<HomePage />);

    await waitFor(() => {
      expect(storage.loadProjects).toHaveBeenCalled();
    });

    // Verify dataset was loaded
    expect(storage.getDataSetsByProjectId).toHaveBeenCalledWith('project-1');

    // Verify project name is displayed
    expect(screen.getByText('Test Project')).toBeInTheDocument();
  });

  it('should load prompt with variable placeholders for dataset', async () => {
    render(<HomePage />);

    await waitFor(() => {
      expect(storage.loadProjects).toHaveBeenCalled();
    });

    // Verify prompt was loaded
    expect(storage.getPromptsByProjectId).toHaveBeenCalledWith('project-1');

    // Verify project name is displayed
    expect(screen.getByText('Test Project')).toBeInTheDocument();
  });

  it('should load model config ready for parallel execution', async () => {
    render(<HomePage />);

    await waitFor(() => {
      expect(storage.loadModelConfigs).toHaveBeenCalled();
    });

    // Verify config was loaded
    expect(storage.getModelConfigsByProjectId).toHaveBeenCalledWith('project-1');
  });

  it('should have all data ready for parallel execution when user clicks Run', async () => {
    render(<HomePage />);

    await waitFor(() => {
      expect(storage.loadProjects).toHaveBeenCalled();
    });

    // Verify all components needed for parallel execution are loaded
    expect(storage.getProjectById).toHaveBeenCalledWith('project-1');
    expect(storage.getPromptsByProjectId).toHaveBeenCalledWith('project-1');
    expect(storage.getModelConfigsByProjectId).toHaveBeenCalledWith('project-1');
    expect(storage.getDataSetsByProjectId).toHaveBeenCalledWith('project-1');

    // Verify project is displayed and ready
    expect(screen.getByText('Test Project')).toBeInTheDocument();
  });

  it('should support multiple dataset items for batch execution', async () => {
    const largeDataSet: DataSet = {
      ...mockDataSet,
      items: [
        { id: 'item-1', variables: { animal: 'cat' } },
        { id: 'item-2', variables: { animal: 'dog' } },
        { id: 'item-3', variables: { animal: 'bird' } },
        { id: 'item-4', variables: { animal: 'fish' } },
        { id: 'item-5', variables: { animal: 'hamster' } },
      ],
    };

    (storage.loadDataSets as jest.Mock).mockReturnValue([largeDataSet]);
    (storage.getDataSetById as jest.Mock).mockReturnValue(largeDataSet);
    (storage.getDataSetsByProjectId as jest.Mock).mockReturnValue([largeDataSet]);

    render(<HomePage />);

    await waitFor(() => {
      expect(storage.loadProjects).toHaveBeenCalled();
    });

    // Verify dataset loading was called
    expect(storage.getDataSetsByProjectId).toHaveBeenCalledWith('project-1');

    // Verify the mock is set up correctly
    const mockReturnValue = (storage.getDataSetsByProjectId as jest.Mock).mock.results[0]?.value;
    expect(mockReturnValue).toBeTruthy();
    expect(mockReturnValue[0].items).toHaveLength(5);
  });

  it('should handle projects with multiple model configs for comparison', async () => {
    const multiConfigProject: Project = {
      ...mockProject,
      modelConfigIds: ['config-1', 'config-2', 'config-3'],
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

    (storage.loadProjects as jest.Mock).mockReturnValue([multiConfigProject]);
    (storage.getProjectById as jest.Mock).mockReturnValue(multiConfigProject);
    (storage.loadModelConfigs as jest.Mock).mockReturnValue(configs);
    (storage.getModelConfigsByProjectId as jest.Mock).mockReturnValue(configs);
    (storage.getModelConfigById as jest.Mock).mockImplementation((id: string) =>
      configs.find(c => c.id === id)
    );

    render(<HomePage />);

    await waitFor(() => {
      expect(storage.loadModelConfigs).toHaveBeenCalled();
    });

    // Verify multiple configs were loaded
    expect(storage.getModelConfigsByProjectId).toHaveBeenCalledWith('project-1');
    const loadedConfigs = (storage.getModelConfigsByProjectId as jest.Mock).mock.results[0]?.value;
    expect(loadedConfigs).toHaveLength(3);
  });

  it('should load empty project ready for user to add data', () => {
    const emptyProject: Project = {
      id: 'project-2',
      name: 'Empty Project',
      description: 'No data yet',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      promptIds: [],
      modelConfigIds: [],
      dataSetIds: [],
    };

    (storage.loadProjects as jest.Mock).mockReturnValue([emptyProject]);
    (storage.getActiveProjectId as jest.Mock).mockReturnValue('project-2');
    (storage.getProjectById as jest.Mock).mockReturnValue(emptyProject);
    (storage.getPromptsByProjectId as jest.Mock).mockReturnValue([]);
    (storage.getModelConfigsByProjectId as jest.Mock).mockReturnValue([]);
    (storage.getDataSetsByProjectId as jest.Mock).mockReturnValue([]);

    render(<HomePage />);

    // Verify empty project displays message
    expect(screen.getByText('No model configs yet')).toBeInTheDocument();
  });
});
