/**
 * Tests for HomePage (Project-based workflow)
 *
 * These tests verify the main page functionality:
 * 1. Initial render with project sidebar
 * 2. Project creation and management
 * 3. PromptEditor display
 * 4. ResponsePanel integration
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Home from '../page';
import * as storage from '@/lib/storage';
import * as fetchModels from '@/lib/fetch-models';
import { Project, Prompt, ProjectModelConfig } from '@/lib/types';

// Mock Next.js components
jest.mock('next/link', () => {
  const MockLink = ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>;
  };
  MockLink.displayName = 'Link';
  return MockLink;
});

jest.mock('next/image', () => {
  const MockImage = ({ src, alt }: { src: string; alt: string }) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img src={src} alt={alt} />;
  };
  MockImage.displayName = 'Image';
  return MockImage;
});

// Mock the storage module
jest.mock('@/lib/storage');

// Mock fetch-models module
jest.mock('@/lib/fetch-models', () => ({
  fetchOpenRouterModels: jest.fn(),
  getOpenAIModels: jest.fn(),
  getAnthropicModels: jest.fn(),
  getPopularOpenRouterModels: jest.fn(),
  getGeminiModels: jest.fn(),
}));

// Mock analytics
jest.mock('@/lib/analytics', () => ({
  trackEvent: jest.fn(),
}));

// Mock migration
jest.mock('@/lib/migration', () => ({
  migrateEvalHistory: jest.fn(),
  isMigrationComplete: jest.fn().mockReturnValue(true),
  markMigrationComplete: jest.fn(),
  loadEvalHistory: jest.fn().mockReturnValue([]),
}));

// Mock fetch
global.fetch = jest.fn();

describe('Home (Project-based Workflow)', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Comprehensive storage mocks for HomePage
    (storage.loadProjects as jest.Mock).mockReturnValue([]);
    (storage.loadPrompts as jest.Mock).mockReturnValue([]);
    (storage.loadModelConfigs as jest.Mock).mockReturnValue([]);
    (storage.loadDataSets as jest.Mock).mockReturnValue([]);
    (storage.loadApiKeys as jest.Mock).mockReturnValue({});
    (storage.loadUIState as jest.Mock).mockReturnValue({ openProjects: [] });
    (storage.loadColumns as jest.Mock).mockReturnValue([]);
    (storage.getActiveProjectId as jest.Mock).mockReturnValue(null);
    (storage.getProjectById as jest.Mock).mockReturnValue(null);
    (storage.getPromptsByProjectId as jest.Mock).mockReturnValue([]);
    (storage.getPromptById as jest.Mock).mockReturnValue(null);
    (storage.getModelConfigsByProjectId as jest.Mock).mockReturnValue([]);
    (storage.getModelConfigById as jest.Mock).mockReturnValue(null);
    (storage.getDataSetsByProjectId as jest.Mock).mockReturnValue([]);
    (storage.getDataSetById as jest.Mock).mockReturnValue(null);
    (storage.setActiveProjectId as jest.Mock).mockImplementation(() => {});
    (storage.saveProject as jest.Mock).mockImplementation(() => {});
    (storage.savePrompt as jest.Mock).mockImplementation(() => {});
    (storage.saveModelConfig as jest.Mock).mockImplementation(() => {});
    (storage.saveDataSet as jest.Mock).mockImplementation(() => {});
    (storage.saveUIState as jest.Mock).mockImplementation(() => {});
    (storage.saveColumns as jest.Mock).mockImplementation(() => {});

    (fetchModels.fetchOpenRouterModels as jest.Mock).mockResolvedValue([]);
    (fetchModels.getOpenAIModels as jest.Mock).mockReturnValue([]);
    (fetchModels.getAnthropicModels as jest.Mock).mockReturnValue([]);
    (fetchModels.getPopularOpenRouterModels as jest.Mock).mockReturnValue([]);
    (fetchModels.getGeminiModels as jest.Mock).mockReturnValue([]);
    (global.fetch as jest.Mock).mockReset();
  });

  describe('Initial Render', () => {
    it('should render the Evvl header', () => {
      render(<Home />);

      expect(screen.getByText('Evvl')).toBeInTheDocument();
    });

    it('should render the Settings link', () => {
      render(<Home />);

      const settingsLink = screen.getByText('Settings');
      expect(settingsLink).toBeInTheDocument();
      expect(settingsLink.closest('a')).toHaveAttribute('href', '/settings');
    });

    it('should render the project sidebar', () => {
      render(<Home />);

      expect(screen.getByText('Projects')).toBeInTheDocument();
    });

    it('should render New buttons in sidebar', () => {
      render(<Home />);

      const newButtons = screen.getAllByText('New');
      expect(newButtons.length).toBeGreaterThan(0);
    });

    it('should load projects on mount', async () => {
      render(<Home />);

      await waitFor(() => {
        expect(storage.loadProjects).toHaveBeenCalled();
      });
    });
  });

  describe('Project Creation', () => {
    it('should create a default project for new users', async () => {
      let savedProject: Project | null = null;
      (storage.saveProject as jest.Mock).mockImplementation((project: Project) => {
        savedProject = project;
      });

      render(<Home />);

      await waitFor(() => {
        expect(storage.saveProject).toHaveBeenCalled();
      });

      expect(savedProject).toBeTruthy();
      expect(savedProject?.name).toBe('My Project');
    });
  });

  describe('With Existing Project', () => {
    const mockProject: Project = {
      id: 'project-1',
      name: 'Test Project',
      description: 'Test description',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      promptIds: ['prompt-1'],
      modelConfigIds: ['config-1'],
      dataSetIds: [],
    };

    const mockPrompt: Prompt = {
      id: 'prompt-1',
      projectId: 'project-1',
      name: 'Test Prompt',
      versions: [
        {
          id: 'version-1',
          versionNumber: 1,
          content: 'Test content',
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
      name: 'GPT-4',
      provider: 'openai',
      model: 'gpt-4',
      createdAt: Date.now(),
    };

    beforeEach(() => {
      (storage.loadProjects as jest.Mock).mockReturnValue([mockProject]);
      (storage.loadPrompts as jest.Mock).mockReturnValue([mockPrompt]);
      (storage.loadModelConfigs as jest.Mock).mockReturnValue([mockConfig]);
      (storage.getActiveProjectId as jest.Mock).mockReturnValue('project-1');
      (storage.getProjectById as jest.Mock).mockReturnValue(mockProject);
      (storage.getPromptsByProjectId as jest.Mock).mockReturnValue([mockPrompt]);
      (storage.getPromptById as jest.Mock).mockReturnValue(mockPrompt);
      (storage.getModelConfigsByProjectId as jest.Mock).mockReturnValue([mockConfig]);
      (storage.getModelConfigById as jest.Mock).mockReturnValue(mockConfig);
    });

    it('should display project name in sidebar', () => {
      render(<Home />);

      expect(screen.getByText('Test Project')).toBeInTheDocument();
    });

    it('should load prompts for the project', async () => {
      render(<Home />);

      await waitFor(() => {
        expect(storage.getPromptsByProjectId).toHaveBeenCalledWith('project-1');
      });
    });

    it('should load project data on mount', async () => {
      render(<Home />);

      await waitFor(() => {
        expect(storage.getProjectById).toHaveBeenCalledWith('project-1');
      });
    });

    it('should load prompts for active project', async () => {
      render(<Home />);

      await waitFor(() => {
        expect(storage.getPromptsByProjectId).toHaveBeenCalledWith('project-1');
      });
    });

    it('should load model configs for active project', async () => {
      render(<Home />);

      await waitFor(() => {
        expect(storage.getModelConfigsByProjectId).toHaveBeenCalledWith('project-1');
      });
    });
  });

  describe('Empty State', () => {
    it('should show no model configs message when project has no configs', () => {
      const mockProject: Project = {
        id: 'project-1',
        name: 'Empty Project',
        description: 'Project with no configs',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        promptIds: [],
        modelConfigIds: [],
        dataSetIds: [],
      };

      (storage.loadProjects as jest.Mock).mockReturnValue([mockProject]);
      (storage.getActiveProjectId as jest.Mock).mockReturnValue('project-1');
      (storage.getProjectById as jest.Mock).mockReturnValue(mockProject);
      (storage.getPromptsByProjectId as jest.Mock).mockReturnValue([]);
      (storage.getModelConfigsByProjectId as jest.Mock).mockReturnValue([]);

      render(<Home />);

      expect(screen.getByText('No model configs yet')).toBeInTheDocument();
    });
  });
});
