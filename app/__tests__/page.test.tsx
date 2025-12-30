import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Home from '../page';
import * as storage from '@/lib/storage';

// Mock Next.js components
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>;
  };
});

jest.mock('next/image', () => {
  return ({ src, alt }: { src: string; alt: string }) => {
    return <img src={src} alt={alt} />;
  };
});

// Mock the storage module
jest.mock('@/lib/storage', () => ({
  loadApiKeys: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

describe('Home (Eval Page)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (storage.loadApiKeys as jest.Mock).mockReturnValue({});
    (global.fetch as jest.Mock).mockReset();
  });

  describe('Initial Render', () => {
    it('should render the prompt textarea', () => {
      render(<Home />);

      const textarea = screen.getByPlaceholderText('Enter your prompt here...');
      expect(textarea).toBeInTheDocument();
    });

    it('should render Generate Outputs button', () => {
      render(<Home />);

      const button = screen.getByText('Generate Outputs');
      expect(button).toBeInTheDocument();
    });

    it('should render all three provider columns', () => {
      render(<Home />);

      expect(screen.getByText('ChatGPT')).toBeInTheDocument();
      expect(screen.getByText('Claude')).toBeInTheDocument();
      expect(screen.getByText('OpenRouter')).toBeInTheDocument();
    });

    it('should render logos for each provider', () => {
      render(<Home />);

      const chatgptLogo = screen.getByAltText('ChatGPT');
      const claudeLogo = screen.getByAltText('Claude');
      const openrouterLogo = screen.getByAltText('OpenRouter');

      expect(chatgptLogo).toBeInTheDocument();
      expect(claudeLogo).toBeInTheDocument();
      expect(openrouterLogo).toBeInTheDocument();
    });
  });

  describe('Configuration State', () => {
    it('should show "Not configured" for providers without API keys', () => {
      (storage.loadApiKeys as jest.Mock).mockReturnValue({});

      render(<Home />);

      const notConfiguredMessages = screen.getAllByText('Not configured');
      expect(notConfiguredMessages).toHaveLength(3);
    });

    it('should show configure links for unconfigured providers', () => {
      (storage.loadApiKeys as jest.Mock).mockReturnValue({});

      render(<Home />);

      expect(screen.getByText('Configure OpenAI →')).toBeInTheDocument();
      expect(screen.getByText('Configure Claude →')).toBeInTheDocument();
      expect(screen.getByText('Configure OpenRouter →')).toBeInTheDocument();
    });

    it('should show "Ready" state when API keys are configured', () => {
      (storage.loadApiKeys as jest.Mock).mockReturnValue({
        openai: 'sk-test-123',
        anthropic: 'sk-ant-test-456',
        openrouter: 'sk-or-test-789',
      });

      render(<Home />);

      const readyMessages = screen.getAllByText('Ready');
      expect(readyMessages).toHaveLength(3);
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

    it('should disable Generate button when prompt is empty', () => {
      render(<Home />);

      const button = screen.getByText('Generate Outputs') as HTMLButtonElement;
      expect(button).toBeDisabled();
    });

    it('should enable Generate button when prompt has content', async () => {
      const user = userEvent.setup();
      (storage.loadApiKeys as jest.Mock).mockReturnValue({
        openai: 'sk-test-123',
      });

      render(<Home />);

      const textarea = screen.getByPlaceholderText('Enter your prompt here...');
      const button = screen.getByText('Generate Outputs') as HTMLButtonElement;

      await user.type(textarea, 'Test prompt');

      expect(button).not.toBeDisabled();
    });
  });

  describe('Output Generation', () => {
    it('should call API for configured providers when generating', async () => {
      const user = userEvent.setup();
      (storage.loadApiKeys as jest.Mock).mockReturnValue({
        openai: 'sk-test-openai',
        anthropic: 'sk-ant-test',
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          content: 'Test response',
          tokens: 100,
          latency: 500,
        }),
      });

      render(<Home />);

      const textarea = screen.getByPlaceholderText('Enter your prompt here...');
      const button = screen.getByText('Generate Outputs');

      await user.type(textarea, 'Test prompt');
      await user.click(button);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(2); // OpenAI and Anthropic
      });
    });

    it('should show "Generating..." while generating', async () => {
      const user = userEvent.setup();
      (storage.loadApiKeys as jest.Mock).mockReturnValue({
        openai: 'sk-test-openai',
      });

      (global.fetch as jest.Mock).mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: async () => ({ content: 'Test', tokens: 100, latency: 500 }),
                }),
              100
            );
          })
      );

      render(<Home />);

      const textarea = screen.getByPlaceholderText('Enter your prompt here...');
      const button = screen.getByText('Generate Outputs');

      await user.type(textarea, 'Test prompt');
      await user.click(button);

      expect(screen.getAllByText('Generating...').length).toBeGreaterThan(0);
    });

    it('should display generated content', async () => {
      const user = userEvent.setup();
      (storage.loadApiKeys as jest.Mock).mockReturnValue({
        openai: 'sk-test-openai',
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          content: 'This is a generated response from GPT-4',
          tokens: 150,
          latency: 1200,
        }),
      });

      render(<Home />);

      const textarea = screen.getByPlaceholderText('Enter your prompt here...');
      const button = screen.getByText('Generate Outputs');

      await user.type(textarea, 'Test prompt');
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText('This is a generated response from GPT-4')).toBeInTheDocument();
      });
    });

    it('should display token count and latency', async () => {
      const user = userEvent.setup();
      (storage.loadApiKeys as jest.Mock).mockReturnValue({
        openai: 'sk-test-openai',
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          content: 'Test response',
          tokens: 150,
          latency: 1200,
        }),
      });

      render(<Home />);

      const textarea = screen.getByPlaceholderText('Enter your prompt here...');
      const button = screen.getByText('Generate Outputs');

      await user.type(textarea, 'Test prompt');
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText(/150 tokens/)).toBeInTheDocument();
        expect(screen.getByText(/1200ms/)).toBeInTheDocument();
      });
    });

    it('should display error message on API failure', async () => {
      const user = userEvent.setup();
      (storage.loadApiKeys as jest.Mock).mockReturnValue({
        openai: 'sk-test-openai',
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => ({
          error: 'Invalid API key',
        }),
      });

      render(<Home />);

      const textarea = screen.getByPlaceholderText('Enter your prompt here...');
      const button = screen.getByText('Generate Outputs');

      await user.type(textarea, 'Test prompt');
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText('Invalid API key')).toBeInTheDocument();
      });
    });

    it('should handle network errors', async () => {
      const user = userEvent.setup();
      (storage.loadApiKeys as jest.Mock).mockReturnValue({
        openai: 'sk-test-openai',
      });

      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      render(<Home />);

      const textarea = screen.getByPlaceholderText('Enter your prompt here...');
      const button = screen.getByText('Generate Outputs');

      await user.type(textarea, 'Test prompt');
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });

    it('should generate outputs in parallel for multiple providers', async () => {
      const user = userEvent.setup();
      (storage.loadApiKeys as jest.Mock).mockReturnValue({
        openai: 'sk-test-openai',
        anthropic: 'sk-ant-test',
        openrouter: 'sk-or-test',
      });

      const mockResponses = [
        { content: 'OpenAI response', tokens: 100, latency: 500 },
        { content: 'Anthropic response', tokens: 120, latency: 600 },
        { content: 'OpenRouter response', tokens: 110, latency: 550 },
      ];

      let callCount = 0;
      (global.fetch as jest.Mock).mockImplementation(() => {
        const response = mockResponses[callCount++];
        return Promise.resolve({
          ok: true,
          json: async () => response,
        });
      });

      render(<Home />);

      const textarea = screen.getByPlaceholderText('Enter your prompt here...');
      const button = screen.getByText('Generate Outputs');

      await user.type(textarea, 'Test prompt');
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText('OpenAI response')).toBeInTheDocument();
        expect(screen.getByText('Anthropic response')).toBeInTheDocument();
        expect(screen.getByText('OpenRouter response')).toBeInTheDocument();
      });
    });
  });
});
