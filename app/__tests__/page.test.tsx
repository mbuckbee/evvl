import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Home from '../page';
import * as storage from '@/lib/storage';
import * as fetchModels from '@/lib/fetch-models';

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
jest.mock('@/lib/storage', () => ({
  loadApiKeys: jest.fn(),
  loadColumns: jest.fn(),
  saveColumns: jest.fn(),
  loadEvalHistory: jest.fn(),
  saveEvalHistory: jest.fn(),
  saveEvalResult: jest.fn(),
}));

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

// Mock fetch
global.fetch = jest.fn();

describe('Home (Eval Page)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (storage.loadApiKeys as jest.Mock).mockReturnValue({});
    (storage.loadColumns as jest.Mock).mockReturnValue([]);
    (storage.loadEvalHistory as jest.Mock).mockReturnValue([]);
    (fetchModels.fetchOpenRouterModels as jest.Mock).mockResolvedValue([]);
    (fetchModels.getOpenAIModels as jest.Mock).mockReturnValue([]);
    (fetchModels.getAnthropicModels as jest.Mock).mockReturnValue([]);
    (fetchModels.getPopularOpenRouterModels as jest.Mock).mockReturnValue([]);
    (fetchModels.getGeminiModels as jest.Mock).mockReturnValue([]);
    (global.fetch as jest.Mock).mockReset();
  });

  describe('Initial Render', () => {
    it('should render the prompt textarea', () => {
      render(<Home />);

      const textarea = screen.getByPlaceholderText('Enter your prompt here...');
      expect(textarea).toBeInTheDocument();
    });

    it('should render Save and Refresh button', () => {
      render(<Home />);

      const button = screen.getByText('Save and Refresh');
      expect(button).toBeInTheDocument();
    });

    it('should render Clear Prompt and Responses button', () => {
      render(<Home />);

      const button = screen.getByText('Clear Prompt and Responses');
      expect(button).toBeInTheDocument();
    });

    it('should load saved columns from localStorage', () => {
      const savedColumns = [
        { id: '1', provider: 'openai', model: 'gpt-4', isConfiguring: false },
        { id: '2', provider: 'anthropic', model: 'claude-3', isConfiguring: false },
      ];
      (storage.loadColumns as jest.Mock).mockReturnValue(savedColumns);

      render(<Home />);

      expect(storage.loadColumns).toHaveBeenCalled();
    });

    it('should load API keys from localStorage', () => {
      render(<Home />);

      expect(storage.loadApiKeys).toHaveBeenCalled();
    });
  });

  describe('Prompt Input', () => {
    it('should update prompt value when typing', async () => {
      const user = userEvent.setup();
      render(<Home />);

      const textarea = screen.getByPlaceholderText('Enter your prompt here...') as HTMLTextAreaElement;

      await user.type(textarea, 'Test prompt');

      expect(textarea.value).toBe('Test prompt');
    });

    it('should disable Save and Refresh button when prompt is empty', () => {
      render(<Home />);

      const button = screen.getByText('Save and Refresh') as HTMLButtonElement;
      expect(button).toBeDisabled();
    });

    it('should enable Save and Refresh button when prompt has content', async () => {
      const user = userEvent.setup();
      (storage.loadApiKeys as jest.Mock).mockReturnValue({
        openai: 'sk-test-123',
      });

      render(<Home />);

      const textarea = screen.getByPlaceholderText('Enter your prompt here...');
      const button = screen.getByText('Save and Refresh') as HTMLButtonElement;

      await user.type(textarea, 'Test prompt');

      expect(button).not.toBeDisabled();
    });
  });

  describe('Clear Functionality', () => {
    it('should clear prompt when Clear button is clicked', async () => {
      const user = userEvent.setup();
      render(<Home />);

      const textarea = screen.getByPlaceholderText('Enter your prompt here...') as HTMLTextAreaElement;
      const clearButton = screen.getByText('Clear Prompt and Responses');

      await user.type(textarea, 'Test prompt');
      expect(textarea.value).toBe('Test prompt');

      await user.click(clearButton);

      expect(textarea.value).toBe('');
    });
  });

  describe('Model Loading', () => {
    it('should fetch models from OpenRouter on mount', async () => {
      const mockModels = [
        { id: 'openai/gpt-4', name: 'GPT-4' },
        { id: 'anthropic/claude-3', name: 'Claude 3' },
      ];

      (fetchModels.fetchOpenRouterModels as jest.Mock).mockResolvedValue(mockModels);

      render(<Home />);

      await waitFor(() => {
        expect(fetchModels.fetchOpenRouterModels).toHaveBeenCalled();
      });
    });
  });

  describe('Eval History', () => {
    it('should load last prompt from eval history', () => {
      const mockHistory = [
        { id: '1', prompt: 'Previous prompt', timestamp: Date.now(), results: {} },
      ];

      (storage.loadEvalHistory as jest.Mock).mockReturnValue(mockHistory);

      render(<Home />);

      const textarea = screen.getByPlaceholderText('Enter your prompt here...') as HTMLTextAreaElement;
      expect(textarea.value).toBe('Previous prompt');
    });
  });
});
