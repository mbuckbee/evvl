/**
 * Tests for ResponsePanel component
 *
 * Tests verify that:
 * 1. Layout switching works correctly (grid, columns, stacked, table)
 * 2. Model configs are displayed in different layouts
 * 3. Response data is rendered correctly in each layout
 * 4. Dataset selection works
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ResponsePanel from '../response-panel';
import * as storage from '@/lib/storage';
import { ProjectModelConfig, Prompt, DataSet, AIOutput } from '@/lib/types';

// Mock storage module
jest.mock('@/lib/storage');

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

// Mock next/link
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe('ResponsePanel', () => {
  const mockConfigs: ProjectModelConfig[] = [
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

  const mockConfigResponses: Record<string, AIOutput[]> = {
    'config-1': [
      {
        id: 'output-1',
        content: 'GPT-4 response',
        latency: 1000,
        tokens: 50,
      },
    ],
    'config-2': [
      {
        id: 'output-2',
        content: 'Claude response',
        latency: 1500,
        tokens: 60,
      },
    ],
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
    (storage.loadApiKeys as jest.Mock).mockReturnValue({
      openai: 'sk-test',
      anthropic: 'sk-ant-test',
    });
    (storage.loadModelConfigs as jest.Mock).mockReturnValue(mockConfigs);
    (storage.getDataSetsByProjectId as jest.Mock).mockReturnValue([mockDataSet]);
  });

  describe('Layout Switching', () => {
    it('should render with grid layout by default', () => {
      const { container } = render(
        <ResponsePanel
          projectId="project-1"
          configResponses={mockConfigResponses}
          currentPrompt={mockPrompt}
        />
      );

      // Grid button should be active (has different classes)
      const buttons = container.querySelectorAll('button');
      const layoutButtons = Array.from(buttons).filter(b =>
        b.querySelector('svg') && b.classList.contains('p-2')
      );
      // First layout button (grid) should be active
      expect(layoutButtons[0]).toHaveClass('bg-white');
    });

    it('should switch to columns layout when columns button is clicked', async () => {
      const { container } = render(
        <ResponsePanel
          projectId="project-1"
          configResponses={mockConfigResponses}
          currentPrompt={mockPrompt}
        />
      );

      const buttons = container.querySelectorAll('button');
      const layoutButtons = Array.from(buttons).filter(b =>
        b.querySelector('svg') && b.classList.contains('p-2')
      );

      // Click columns button (second button)
      await userEvent.click(layoutButtons[1]);

      // Columns button should now be active
      expect(layoutButtons[1]).toHaveClass('bg-white');
    });

    it('should switch to stacked layout when stacked button is clicked', async () => {
      const { container } = render(
        <ResponsePanel
          projectId="project-1"
          configResponses={mockConfigResponses}
          currentPrompt={mockPrompt}
        />
      );

      const buttons = container.querySelectorAll('button');
      const layoutButtons = Array.from(buttons).filter(b =>
        b.querySelector('svg') && b.classList.contains('p-2')
      );

      // Click stacked button (third button)
      await userEvent.click(layoutButtons[2]);

      // Stacked button should now be active
      expect(layoutButtons[2]).toHaveClass('bg-white');
    });

    it('should switch to table layout when table button is clicked', async () => {
      const { container } = render(
        <ResponsePanel
          projectId="project-1"
          configResponses={mockConfigResponses}
          currentPrompt={mockPrompt}
        />
      );

      const buttons = container.querySelectorAll('button');
      const layoutButtons = Array.from(buttons).filter(b =>
        b.querySelector('svg') && b.classList.contains('p-2')
      );

      // Click table button (fourth button)
      await userEvent.click(layoutButtons[3]);

      // Table button should now be active
      expect(layoutButtons[3]).toHaveClass('bg-white');
    });

    it('should display all layout options', () => {
      render(
        <ResponsePanel
          projectId="project-1"
          configResponses={mockConfigResponses}
          currentPrompt={mockPrompt}
        />
      );

      // Tooltips appear on hover, so we check they exist in the DOM
      expect(screen.getByText('Grid')).toBeInTheDocument();
      expect(screen.getByText('Columns')).toBeInTheDocument();
      expect(screen.getByText('Stacked')).toBeInTheDocument();
      expect(screen.getByText('Table')).toBeInTheDocument();
    });

    it('should maintain layout state when switching between layouts', async () => {
      const { container } = render(
        <ResponsePanel
          projectId="project-1"
          configResponses={mockConfigResponses}
          currentPrompt={mockPrompt}
        />
      );

      const buttons = container.querySelectorAll('button');
      const layoutButtons = Array.from(buttons).filter(b =>
        b.querySelector('svg') && b.classList.contains('p-2')
      );

      // Switch to columns
      await userEvent.click(layoutButtons[1]);
      expect(layoutButtons[1]).toHaveClass('bg-white');

      // Switch to stacked
      await userEvent.click(layoutButtons[2]);
      expect(layoutButtons[2]).toHaveClass('bg-white');
      expect(layoutButtons[1]).not.toHaveClass('bg-white');

      // Switch back to grid
      await userEvent.click(layoutButtons[0]);
      expect(layoutButtons[0]).toHaveClass('bg-white');
      expect(layoutButtons[2]).not.toHaveClass('bg-white');
    });
  });

  describe('Response Display', () => {
    it('should display config responses in grid layout', () => {
      render(
        <ResponsePanel
          projectId="project-1"
          configResponses={mockConfigResponses}
          currentPrompt={mockPrompt}
        />
      );

      expect(screen.getByText('GPT-4 response')).toBeInTheDocument();
      expect(screen.getByText('Claude response')).toBeInTheDocument();
    });

    it('should display model config names', () => {
      render(
        <ResponsePanel
          projectId="project-1"
          configResponses={mockConfigResponses}
          currentPrompt={mockPrompt}
        />
      );

      expect(screen.getByText('GPT-4')).toBeInTheDocument();
      expect(screen.getByText('Claude')).toBeInTheDocument();
    });

    it('should show generating state for configs', () => {
      render(
        <ResponsePanel
          projectId="project-1"
          configResponses={{}}
          generatingConfigs={{ 'config-1': true }}
          currentPrompt={mockPrompt}
        />
      );

      expect(screen.getByText('Generating...')).toBeInTheDocument();
    });

    it('should display latency information', () => {
      render(
        <ResponsePanel
          projectId="project-1"
          configResponses={mockConfigResponses}
          currentPrompt={mockPrompt}
        />
      );

      // Latency is formatted in seconds (1000ms = 1s, 1500ms = 2s)
      expect(screen.getByText('1s')).toBeInTheDocument();
      expect(screen.getByText('2s')).toBeInTheDocument();
    });

    it('should display token count', () => {
      render(
        <ResponsePanel
          projectId="project-1"
          configResponses={mockConfigResponses}
          currentPrompt={mockPrompt}
        />
      );

      expect(screen.getByText(/50/)).toBeInTheDocument();
      expect(screen.getByText(/60/)).toBeInTheDocument();
    });
  });

  describe('Table Layout', () => {
    it('should switch to table layout', async () => {
      const { container } = render(
        <ResponsePanel
          projectId="project-1"
          configResponses={mockConfigResponses}
          currentPrompt={mockPrompt}
        />
      );

      const buttons = container.querySelectorAll('button');
      const layoutButtons = Array.from(buttons).filter(b =>
        b.querySelector('svg') && b.classList.contains('p-2')
      );

      // Click table button (fourth button)
      await userEvent.click(layoutButtons[3]);

      // Table button should be active
      expect(layoutButtons[3]).toHaveClass('bg-white');
    });
  });

  describe('Dataset Selection', () => {
    it('should display dataset dropdown when project has datasets', () => {
      render(
        <ResponsePanel
          projectId="project-1"
          configResponses={mockConfigResponses}
          currentPrompt={mockPrompt}
        />
      );

      expect(screen.getByText('No data set')).toBeInTheDocument();
    });

    it('should open dataset dropdown when clicked', async () => {
      render(
        <ResponsePanel
          projectId="project-1"
          configResponses={mockConfigResponses}
          currentPrompt={mockPrompt}
          onDataSetChange={jest.fn()}
        />
      );

      const dropdown = screen.getByText('No data set');
      await userEvent.click(dropdown);

      expect(screen.getByText('Test Dataset')).toBeInTheDocument();
    });

    it('should call onDataSetChange when dataset is selected', async () => {
      const onDataSetChange = jest.fn();

      render(
        <ResponsePanel
          projectId="project-1"
          configResponses={mockConfigResponses}
          currentPrompt={mockPrompt}
          onDataSetChange={onDataSetChange}
        />
      );

      const dropdown = screen.getByText('No data set');
      await userEvent.click(dropdown);

      const datasetOption = screen.getByText('Test Dataset');
      await userEvent.click(datasetOption);

      expect(onDataSetChange).toHaveBeenCalledWith('dataset-1');
    });

    it('should display selected dataset name', () => {
      render(
        <ResponsePanel
          projectId="project-1"
          configResponses={mockConfigResponses}
          currentPrompt={mockPrompt}
          selectedDataSetId="dataset-1"
          selectedDataSet={mockDataSet}
        />
      );

      expect(screen.getByText('Test Dataset')).toBeInTheDocument();
    });

    it('should allow clearing dataset selection', async () => {
      const onDataSetChange = jest.fn();

      render(
        <ResponsePanel
          projectId="project-1"
          configResponses={mockConfigResponses}
          currentPrompt={mockPrompt}
          selectedDataSetId="dataset-1"
          selectedDataSet={mockDataSet}
          onDataSetChange={onDataSetChange}
        />
      );

      const dropdown = screen.getByText('Test Dataset');
      await userEvent.click(dropdown);

      const noneOption = screen.getByText('No data set');
      await userEvent.click(noneOption);

      expect(onDataSetChange).toHaveBeenCalledWith(null);
    });
  });

  describe('Empty States', () => {
    it('should show message when no configs exist', () => {
      (storage.loadModelConfigs as jest.Mock).mockReturnValue([]);

      render(
        <ResponsePanel
          projectId="project-1"
          configResponses={{}}
          currentPrompt={mockPrompt}
        />
      );

      expect(screen.getByText('No model configs yet')).toBeInTheDocument();
      expect(screen.getByText('Create a model config to get started')).toBeInTheDocument();
    });

    it('should show button to create new model config', () => {
      (storage.loadModelConfigs as jest.Mock).mockReturnValue([]);

      render(
        <ResponsePanel
          projectId="project-1"
          configResponses={{}}
          currentPrompt={mockPrompt}
          onNewModelConfig={jest.fn()}
        />
      );

      expect(screen.getByText('Add Model Config')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should display error message in response', () => {
      const errorResponses: Record<string, AIOutput[]> = {
        'config-1': [
          {
            id: 'output-1',
            content: '',
            error: 'API Error: Rate limit exceeded',
          },
        ],
      };

      render(
        <ResponsePanel
          projectId="project-1"
          configResponses={errorResponses}
          currentPrompt={mockPrompt}
        />
      );

      expect(screen.getByText(/Rate limit exceeded/)).toBeInTheDocument();
    });
  });

  describe('Highlighted Config', () => {
    it('should highlight specified config', () => {
      const { container } = render(
        <ResponsePanel
          projectId="project-1"
          configResponses={mockConfigResponses}
          currentPrompt={mockPrompt}
          highlightedConfigId="config-1"
        />
      );

      // Find the card containing GPT-4 and check for highlight classes
      const gpt4Text = screen.getByText('GPT-4');
      const gpt4Card = gpt4Text.closest('.bg-white');

      expect(gpt4Card).toHaveClass('ring-4');
      expect(gpt4Card).toHaveClass('ring-blue-500');
    });
  });
});
