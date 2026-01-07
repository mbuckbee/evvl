/**
 * Tests for parallel execution and response ordering functionality
 *
 * These tests verify that:
 * 1. Dataset items execute in parallel
 * 2. Responses maintain correct order despite parallel completion
 * 3. UI updates incrementally as responses arrive
 */

import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HomePage from '../page';
import * as storage from '@/lib/storage';
import * as api from '@/lib/api';
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

describe('Parallel Execution and Response Ordering', () => {
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
        content: 'Generate an image of {{animal}}',
        createdAt: Date.now(),
      },
    ],
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

    // Setup storage mocks
    (storage.loadProjects as jest.Mock).mockReturnValue([mockProject]);
    (storage.getActiveProjectId as jest.Mock).mockReturnValue('project-1');
    (storage.getProjectById as jest.Mock).mockReturnValue(mockProject);
    (storage.getPromptsByProjectId as jest.Mock).mockReturnValue([mockPrompt]);
    (storage.getPromptById as jest.Mock).mockReturnValue(mockPrompt);
    (storage.getModelConfigsByProjectId as jest.Mock).mockReturnValue([mockConfig]);
    (storage.getModelConfigById as jest.Mock).mockReturnValue(mockConfig);
    (storage.getDataSetsByProjectId as jest.Mock).mockReturnValue([mockDataSet]);
    (storage.getDataSetById as jest.Mock).mockReturnValue(mockDataSet);
    (storage.loadApiKeys as jest.Mock).mockReturnValue({ openai: 'sk-test' });
    (storage.loadUIState as jest.Mock).mockReturnValue({ openProjects: [] });
    (storage.loadColumns as jest.Mock).mockReturnValue([]);
  });

  it('should execute dataset items in parallel', async () => {
    const generateImageCalls: number[] = [];
    const startTime = Date.now();

    // Mock API to track when each call starts
    (api.apiClient.generateImage as jest.Mock).mockImplementation(async (request) => {
      const callTime = Date.now() - startTime;
      generateImageCalls.push(callTime);

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 100));

      return {
        imageUrl: `https://example.com/${request.prompt}.jpg`,
        revisedPrompt: request.prompt,
        latency: 100,
      };
    });

    render(<HomePage />);

    // Wait for initial render
    await waitFor(() => {
      expect(storage.loadProjects).toHaveBeenCalled();
    });

    // Verify that all calls started within a short time window (parallel execution)
    // If they were sequential, the time differences would be ~100ms apart
    await waitFor(() => {
      expect(generateImageCalls.length).toBe(3);
    }, { timeout: 5000 });

    // Check that all calls started within 50ms of each other (parallel)
    const timeDifferences = [
      generateImageCalls[1] - generateImageCalls[0],
      generateImageCalls[2] - generateImageCalls[1],
    ];

    timeDifferences.forEach(diff => {
      expect(diff).toBeLessThan(50);
    });
  });

  it('should maintain correct response order despite parallel completion', async () => {
    const responses: { [key: string]: any } = {
      'cat': {
        imageUrl: 'https://example.com/cat.jpg',
        revisedPrompt: 'a cat',
        latency: 50,
      },
      'raccoon': {
        imageUrl: 'https://example.com/raccoon.jpg',
        revisedPrompt: 'a raccoon',
        latency: 30,
      },
      'rat': {
        imageUrl: 'https://example.com/rat.jpg',
        revisedPrompt: 'a rat',
        latency: 20,
      },
    };

    // Mock API to return responses in different order than requested
    // Raccoon finishes first (30ms), then rat (20ms), then cat (50ms)
    (api.apiClient.generateImage as jest.Mock).mockImplementation(async (request) => {
      const animal = request.prompt.replace('Generate an image of ', '');
      const response = responses[animal];

      // Simulate different completion times
      await new Promise(resolve => setTimeout(resolve, response.latency));

      return response;
    });

    render(<HomePage />);

    // Wait for responses to complete
    await waitFor(() => {
      expect(api.apiClient.generateImage).toHaveBeenCalledTimes(3);
    }, { timeout: 5000 });

    // Wait for all responses to be displayed
    await waitFor(() => {
      expect(screen.getByText(/cat.jpg/)).toBeInTheDocument();
      expect(screen.getByText(/raccoon.jpg/)).toBeInTheDocument();
      expect(screen.getByText(/rat.jpg/)).toBeInTheDocument();
    }, { timeout: 5000 });

    // Verify responses are in correct order by checking DOM structure
    const images = screen.getAllByRole('img');
    expect(images[0]).toHaveAttribute('src', expect.stringContaining('cat'));
    expect(images[1]).toHaveAttribute('src', expect.stringContaining('raccoon'));
    expect(images[2]).toHaveAttribute('src', expect.stringContaining('rat'));
  });

  it('should update UI incrementally as responses arrive', async () => {
    let completedCount = 0;

    (api.apiClient.generateImage as jest.Mock).mockImplementation(async (request) => {
      const animal = request.prompt.replace('Generate an image of ', '');

      // Simulate different completion times
      const delays = { cat: 100, raccoon: 50, rat: 150 };
      await new Promise(resolve => setTimeout(resolve, delays[animal as keyof typeof delays]));

      completedCount++;

      return {
        imageUrl: `https://example.com/${animal}.jpg`,
        revisedPrompt: animal,
        latency: delays[animal as keyof typeof delays],
      };
    });

    render(<HomePage />);

    // Wait for first response (raccoon - 50ms)
    await waitFor(() => {
      expect(screen.queryByText(/raccoon.jpg/)).toBeInTheDocument();
    }, { timeout: 2000 });

    // At this point, only raccoon should be visible
    expect(screen.queryByText(/raccoon.jpg/)).toBeInTheDocument();
    expect(completedCount).toBeGreaterThanOrEqual(1);

    // Wait for second response (cat - 100ms)
    await waitFor(() => {
      expect(screen.queryByText(/cat.jpg/)).toBeInTheDocument();
    }, { timeout: 2000 });

    expect(completedCount).toBeGreaterThanOrEqual(2);

    // Wait for third response (rat - 150ms)
    await waitFor(() => {
      expect(screen.queryByText(/rat.jpg/)).toBeInTheDocument();
    }, { timeout: 2000 });

    expect(completedCount).toBe(3);
  });

  it('should pre-allocate array slots to maintain order', async () => {
    const responseOrder: string[] = [];

    (api.apiClient.generateImage as jest.Mock).mockImplementation(async (request) => {
      const animal = request.prompt.replace('Generate an image of ', '');

      // Simulate responses completing in reverse order
      const delays = { cat: 150, raccoon: 100, rat: 50 };
      await new Promise(resolve => setTimeout(resolve, delays[animal as keyof typeof delays]));

      responseOrder.push(animal);

      return {
        imageUrl: `https://example.com/${animal}.jpg`,
        revisedPrompt: animal,
        latency: delays[animal as keyof typeof delays],
      };
    });

    render(<HomePage />);

    // Wait for all responses
    await waitFor(() => {
      expect(api.apiClient.generateImage).toHaveBeenCalledTimes(3);
      expect(responseOrder).toHaveLength(3);
    }, { timeout: 5000 });

    // Responses completed in order: rat, raccoon, cat
    expect(responseOrder).toEqual(['rat', 'raccoon', 'cat']);

    // But they should display in dataset order: cat, raccoon, rat
    const images = screen.getAllByRole('img');
    expect(images[0]).toHaveAttribute('src', expect.stringContaining('cat'));
    expect(images[1]).toHaveAttribute('src', expect.stringContaining('raccoon'));
    expect(images[2]).toHaveAttribute('src', expect.stringContaining('rat'));
  });

  it('should handle errors in parallel execution without breaking order', async () => {
    (api.apiClient.generateImage as jest.Mock).mockImplementation(async (request) => {
      const animal = request.prompt.replace('Generate an image of ', '');

      await new Promise(resolve => setTimeout(resolve, 50));

      // Fail on raccoon
      if (animal === 'raccoon') {
        return { error: 'API Error: Rate limit exceeded' };
      }

      return {
        imageUrl: `https://example.com/${animal}.jpg`,
        revisedPrompt: animal,
        latency: 50,
      };
    });

    render(<HomePage />);

    // Wait for all requests to complete
    await waitFor(() => {
      expect(api.apiClient.generateImage).toHaveBeenCalledTimes(3);
    }, { timeout: 5000 });

    // Verify successful responses are still in correct positions
    await waitFor(() => {
      expect(screen.queryByText(/cat.jpg/)).toBeInTheDocument();
      expect(screen.queryByText(/rat.jpg/)).toBeInTheDocument();
    }, { timeout: 2000 });

    // Verify error message for raccoon
    expect(screen.queryByText(/Rate limit exceeded/)).toBeInTheDocument();
  });
});
