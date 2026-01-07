/**
 * Tests for Sidebar component
 *
 * Tests for:
 * - Project selection
 * - Project edit mode
 * - Prompt selection
 * - Model config selection
 * - Dataset selection
 * - Tooltips on project names
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Sidebar from '../sidebar';
import * as storage from '@/lib/storage';
import { Project, Prompt, ProjectModelConfig, DataSet } from '@/lib/types';

// Mock storage module
jest.mock('@/lib/storage');
jest.mock('@/lib/migration', () => ({
  migrateEvalHistory: jest.fn(),
  isMigrationComplete: jest.fn().mockReturnValue(true),
}));

describe('Sidebar', () => {
  const mockProject: Project = {
    id: 'project-1',
    name: 'Test Project',
    description: 'A test project description',
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
    versions: [{
      id: 'version-1',
      content: 'Test content',
      createdAt: Date.now(),
    }],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  const mockConfig: ProjectModelConfig = {
    id: 'config-1',
    projectId: 'project-1',
    name: 'Test Config',
    provider: 'openai',
    model: 'gpt-4',
    createdAt: Date.now(),
  };

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

  beforeEach(() => {
    jest.clearAllMocks();
    (storage.loadProjects as jest.Mock).mockReturnValue([mockProject]);
    (storage.loadUIState as jest.Mock).mockReturnValue({ openProjects: [] });
    (storage.saveUIState as jest.Mock).mockImplementation(() => {});
    (storage.saveProject as jest.Mock).mockImplementation(() => {});
    (storage.getPromptsByProjectId as jest.Mock).mockReturnValue([mockPrompt]);
    (storage.getModelConfigsByProjectId as jest.Mock).mockReturnValue([mockConfig]);
    (storage.getDataSetsByProjectId as jest.Mock).mockReturnValue([mockDataSet]);
  });

  describe('Project Management', () => {
    it('should render projects from storage', () => {
      render(<Sidebar />);

      expect(screen.getByText('Test Project')).toBeInTheDocument();
    });

    it('should create default project if none exist', () => {
      (storage.loadProjects as jest.Mock).mockReturnValue([]);

      render(<Sidebar />);

      expect(storage.saveProject).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'My Project',
          description: 'Get started by creating prompts and model configs',
        })
      );
    });

    it('should toggle project open/closed when clicking chevron', async () => {
      render(<Sidebar />);

      const chevronButton = screen.getAllByRole('button')[1]; // First button is chevron
      await userEvent.click(chevronButton);

      // Project should expand and show Prompts section
      await waitFor(() => {
        expect(screen.getByText('Prompts')).toBeInTheDocument();
      });
    });

    it('should call onProjectSelect when clicking project name', async () => {
      const onProjectSelect = jest.fn();
      render(<Sidebar onProjectSelect={onProjectSelect} />);

      const projectButton = screen.getByText('Test Project');
      await userEvent.click(projectButton);

      expect(onProjectSelect).toHaveBeenCalledWith('project-1', false);
    });

    it('should call onProjectSelect with edit mode when clicking Edit button', async () => {
      const onProjectSelect = jest.fn();
      render(<Sidebar onProjectSelect={onProjectSelect} />);

      // Hover to show Edit button
      const projectRow = screen.getByText('Test Project').closest('.group');
      if (projectRow) {
        fireEvent.mouseEnter(projectRow);
      }

      const editButton = screen.getByText('Edit');
      await userEvent.click(editButton);

      expect(onProjectSelect).toHaveBeenCalledWith('project-1', true);
    });

    it('should display project description as tooltip', () => {
      render(<Sidebar />);

      const projectButton = screen.getByText('Test Project');

      // Check for tooltip element (it's hidden by default, shown on hover)
      const tooltipElement = screen.getByText('A test project description');
      expect(tooltipElement).toBeInTheDocument();
      expect(tooltipElement).toHaveClass('hidden');
    });

    it('should call onNewProject when clicking New button', async () => {
      const onNewProject = jest.fn();
      render(<Sidebar onNewProject={onNewProject} />);

      const newButton = screen.getByText('New');
      await userEvent.click(newButton);

      expect(onNewProject).toHaveBeenCalled();
    });
  });

  describe('Prompt Management', () => {
    it('should show prompts section when project is expanded', async () => {
      (storage.loadUIState as jest.Mock).mockReturnValue({ openProjects: ['project-1'] });

      render(<Sidebar />);

      expect(screen.getByText('Prompts')).toBeInTheDocument();

      // Expand prompts section
      const promptsSection = screen.getByText('Prompts');
      await userEvent.click(promptsSection);

      await waitFor(() => {
        expect(screen.getByText('Test Prompt')).toBeInTheDocument();
      });
    });

    it('should call onPromptSelect when clicking prompt', async () => {
      (storage.loadUIState as jest.Mock).mockReturnValue({ openProjects: ['project-1'] });
      const onPromptSelect = jest.fn();

      render(<Sidebar onPromptSelect={onPromptSelect} />);

      // Expand prompts section
      const promptsSection = screen.getByText('Prompts');
      await userEvent.click(promptsSection);

      await waitFor(() => {
        const promptButton = screen.getByText('Test Prompt');
        userEvent.click(promptButton);
      });

      await waitFor(() => {
        expect(onPromptSelect).toHaveBeenCalledWith('prompt-1', false);
      });
    });

    it('should call onNewPrompt when clicking New in Prompts section', async () => {
      (storage.loadUIState as jest.Mock).mockReturnValue({ openProjects: ['project-1'] });
      const onNewPrompt = jest.fn();

      render(<Sidebar onNewPrompt={onNewPrompt} />);

      const newButtons = screen.getAllByText('New');
      const promptNewButton = newButtons[1]; // Second "New" button is for prompts

      await userEvent.click(promptNewButton);

      expect(onNewPrompt).toHaveBeenCalledWith('project-1');
    });

    it('should show "No prompts yet" when project has no prompts', async () => {
      (storage.loadUIState as jest.Mock).mockReturnValue({ openProjects: ['project-1'] });
      (storage.getPromptsByProjectId as jest.Mock).mockReturnValue([]);

      render(<Sidebar />);

      // Expand prompts section
      const promptsSection = screen.getByText('Prompts');
      await userEvent.click(promptsSection);

      await waitFor(() => {
        expect(screen.getByText('No prompts yet')).toBeInTheDocument();
      });
    });
  });

  describe('Model Config Management', () => {
    it('should show model configs section when project is expanded', async () => {
      (storage.loadUIState as jest.Mock).mockReturnValue({ openProjects: ['project-1'] });

      render(<Sidebar />);

      expect(screen.getByText('Model Configs')).toBeInTheDocument();

      // Expand configs section
      const configsSection = screen.getByText('Model Configs');
      await userEvent.click(configsSection);

      await waitFor(() => {
        expect(screen.getByText('Test Config')).toBeInTheDocument();
      });
    });

    it('should call onModelConfigSelect when clicking config', async () => {
      (storage.loadUIState as jest.Mock).mockReturnValue({ openProjects: ['project-1'] });
      const onModelConfigSelect = jest.fn();

      render(<Sidebar onModelConfigSelect={onModelConfigSelect} />);

      // Expand configs section
      const configsSection = screen.getByText('Model Configs');
      await userEvent.click(configsSection);

      await waitFor(() => {
        const configButton = screen.getByText('Test Config');
        userEvent.click(configButton);
      });

      await waitFor(() => {
        expect(onModelConfigSelect).toHaveBeenCalledWith('config-1', false);
      });
    });

    it('should call onNewModelConfig when clicking New in Model Configs section', async () => {
      (storage.loadUIState as jest.Mock).mockReturnValue({ openProjects: ['project-1'] });
      const onNewModelConfig = jest.fn();

      render(<Sidebar onNewModelConfig={onNewModelConfig} />);

      const newButtons = screen.getAllByText('New');
      const configNewButton = newButtons[2]; // Third "New" button is for configs

      await userEvent.click(configNewButton);

      expect(onNewModelConfig).toHaveBeenCalledWith('project-1');
    });

    it('should show "No model configs yet" when project has no configs', async () => {
      (storage.loadUIState as jest.Mock).mockReturnValue({ openProjects: ['project-1'] });
      (storage.getModelConfigsByProjectId as jest.Mock).mockReturnValue([]);

      render(<Sidebar />);

      // Expand configs section
      const configsSection = screen.getByText('Model Configs');
      await userEvent.click(configsSection);

      await waitFor(() => {
        expect(screen.getByText('No model configs yet')).toBeInTheDocument();
      });
    });
  });

  describe('Dataset Management', () => {
    it('should show datasets section when project is expanded', async () => {
      (storage.loadUIState as jest.Mock).mockReturnValue({ openProjects: ['project-1'] });

      render(<Sidebar />);

      expect(screen.getByText('Data Sets')).toBeInTheDocument();

      // Expand datasets section
      const datasetsSection = screen.getByText('Data Sets');
      await userEvent.click(datasetsSection);

      await waitFor(() => {
        expect(screen.getByText('Test Dataset')).toBeInTheDocument();
      });
    });

    it('should call onDataSetSelect when clicking dataset', async () => {
      (storage.loadUIState as jest.Mock).mockReturnValue({ openProjects: ['project-1'] });
      const onDataSetSelect = jest.fn();

      render(<Sidebar onDataSetSelect={onDataSetSelect} />);

      // Expand datasets section
      const datasetsSection = screen.getByText('Data Sets');
      await userEvent.click(datasetsSection);

      await waitFor(() => {
        const datasetButton = screen.getByText('Test Dataset');
        userEvent.click(datasetButton);
      });

      await waitFor(() => {
        expect(onDataSetSelect).toHaveBeenCalledWith('dataset-1', false);
      });
    });

    it('should call onNewDataSet when clicking New in Data Sets section', async () => {
      (storage.loadUIState as jest.Mock).mockReturnValue({ openProjects: ['project-1'] });
      const onNewDataSet = jest.fn();

      render(<Sidebar onNewDataSet={onNewDataSet} />);

      const newButtons = screen.getAllByText('New');
      const datasetNewButton = newButtons[3]; // Fourth "New" button is for datasets

      await userEvent.click(datasetNewButton);

      expect(onNewDataSet).toHaveBeenCalledWith('project-1');
    });

    it('should show "No data sets yet" when project has no datasets', async () => {
      (storage.loadUIState as jest.Mock).mockReturnValue({ openProjects: ['project-1'] });
      (storage.getDataSetsByProjectId as jest.Mock).mockReturnValue([]);

      render(<Sidebar />);

      // Expand datasets section
      const datasetsSection = screen.getByText('Data Sets');
      await userEvent.click(datasetsSection);

      await waitFor(() => {
        expect(screen.getByText('No data sets yet')).toBeInTheDocument();
      });
    });
  });

  describe('UI State Persistence', () => {
    it('should save open projects to UI state', async () => {
      render(<Sidebar />);

      const chevronButton = screen.getAllByRole('button')[1];
      await userEvent.click(chevronButton);

      await waitFor(() => {
        expect(storage.saveUIState).toHaveBeenCalledWith(
          expect.objectContaining({
            openProjects: ['project-1'],
          })
        );
      });
    });

    it('should restore open projects from UI state', () => {
      (storage.loadUIState as jest.Mock).mockReturnValue({
        openProjects: ['project-1'],
      });

      render(<Sidebar />);

      // Project should be expanded
      expect(screen.getByText('Prompts')).toBeInTheDocument();
      expect(screen.getByText('Model Configs')).toBeInTheDocument();
      expect(screen.getByText('Data Sets')).toBeInTheDocument();
    });
  });

  describe('Footer Statistics', () => {
    it('should display total item count', () => {
      render(<Sidebar />);

      // 1 prompt + 1 config + 1 dataset = 3 items
      expect(screen.getByText('3 items')).toBeInTheDocument();
    });

    it('should display project count', () => {
      render(<Sidebar />);

      expect(screen.getByText('1 projects')).toBeInTheDocument();
    });

    it('should calculate counts from multiple projects', () => {
      const secondProject: Project = {
        ...mockProject,
        id: 'project-2',
        name: 'Second Project',
      };

      (storage.loadProjects as jest.Mock).mockReturnValue([mockProject, secondProject]);

      render(<Sidebar />);

      // 2 projects × 3 items each = 6 items total
      expect(screen.getByText('6 items')).toBeInTheDocument();
      expect(screen.getByText('2 projects')).toBeInTheDocument();
    });
  });
});
