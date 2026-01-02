import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SettingsPage from '../page';
import * as storage from '@/lib/storage';
import { useRouter } from 'next/navigation';

// Mock the storage module
jest.mock('@/lib/storage', () => ({
  saveApiKeys: jest.fn(),
  loadApiKeys: jest.fn(),
  clearApiKeys: jest.fn(),
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

describe('SettingsPage', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (storage.loadApiKeys as jest.Mock).mockReturnValue({});
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
  });

  it('should render the settings page with all input fields', () => {
    render(<SettingsPage />);

    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByLabelText('OpenAI API Key')).toBeInTheDocument();
    expect(screen.getByLabelText('Anthropic API Key')).toBeInTheDocument();
    expect(screen.getByLabelText('OpenRouter API Key')).toBeInTheDocument();
    expect(screen.getByText('Save Keys')).toBeInTheDocument();
    expect(screen.getByText('Clear All')).toBeInTheDocument();
  });

  it('should load existing API keys on mount', () => {
    const mockKeys = {
      openai: 'sk-test-openai',
      anthropic: 'sk-ant-test',
      openrouter: 'sk-or-test',
    };

    (storage.loadApiKeys as jest.Mock).mockReturnValue(mockKeys);

    render(<SettingsPage />);

    const openaiInput = screen.getByLabelText('OpenAI API Key') as HTMLInputElement;
    const anthropicInput = screen.getByLabelText('Anthropic API Key') as HTMLInputElement;
    const openrouterInput = screen.getByLabelText('OpenRouter API Key') as HTMLInputElement;

    expect(openaiInput.value).toBe('sk-test-openai');
    expect(anthropicInput.value).toBe('sk-ant-test');
    expect(openrouterInput.value).toBe('sk-or-test');
  });

  it('should update input values when typing', async () => {
    const user = userEvent.setup();
    render(<SettingsPage />);

    const openaiInput = screen.getByLabelText('OpenAI API Key') as HTMLInputElement;

    await user.type(openaiInput, 'sk-new-key');

    expect(openaiInput.value).toBe('sk-new-key');
  });

  it('should save API keys when Save Keys button is clicked', async () => {
    const user = userEvent.setup();
    render(<SettingsPage />);

    const openaiInput = screen.getByLabelText('OpenAI API Key');
    const saveButton = screen.getByText('Save Keys');

    await user.type(openaiInput, 'sk-test-123');
    await user.click(saveButton);

    expect(storage.saveApiKeys).toHaveBeenCalledWith({
      openai: 'sk-test-123',
    });
  });

  it('should show success message after saving', async () => {
    const user = userEvent.setup();
    render(<SettingsPage />);

    const saveButton = screen.getByText('Save Keys');
    await user.click(saveButton);

    expect(screen.getByText('API keys saved successfully!')).toBeInTheDocument();

    // Wait for the message to disappear
    await waitFor(
      () => {
        expect(screen.queryByText('API keys saved successfully!')).not.toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });

  it('should redirect to home page after saving keys', async () => {
    jest.useFakeTimers();
    const user = userEvent.setup({ delay: null });
    render(<SettingsPage />);

    const saveButton = screen.getByText('Save Keys');
    await user.click(saveButton);

    // Verify success message appears
    expect(screen.getByText('API keys saved successfully!')).toBeInTheDocument();

    // Fast-forward time by 1500ms
    await act(async () => {
      jest.advanceTimersByTime(1500);
    });

    // Verify router.push was called with correct path
    expect(mockPush).toHaveBeenCalledWith('/');

    jest.useRealTimers();
  });

  it('should clear all API keys when Clear All button is clicked', async () => {
    const user = userEvent.setup();
    const mockKeys = {
      openai: 'sk-test-openai',
      anthropic: 'sk-ant-test',
    };

    (storage.loadApiKeys as jest.Mock).mockReturnValue(mockKeys);

    render(<SettingsPage />);

    const openaiInput = screen.getByLabelText('OpenAI API Key') as HTMLInputElement;
    expect(openaiInput.value).toBe('sk-test-openai');

    const clearButton = screen.getByText('Clear All');
    await user.click(clearButton);

    expect(storage.clearApiKeys).toHaveBeenCalled();
    expect(openaiInput.value).toBe('');
  });

  it('should have text type inputs for API keys', () => {
    render(<SettingsPage />);

    const openaiInput = screen.getByLabelText('OpenAI API Key');
    const anthropicInput = screen.getByLabelText('Anthropic API Key');
    const openrouterInput = screen.getByLabelText('OpenRouter API Key');
    const geminiInput = screen.getByLabelText('Google Gemini API Key');

    expect(openaiInput).toHaveAttribute('type', 'text');
    expect(anthropicInput).toHaveAttribute('type', 'text');
    expect(openrouterInput).toHaveAttribute('type', 'text');
    expect(geminiInput).toHaveAttribute('type', 'text');
  });

  it('should display privacy note', () => {
    render(<SettingsPage />);

    expect(screen.getByText(/Privacy Note:/)).toBeInTheDocument();
    expect(
      screen.getByText(/Your API keys are stored locally in your browser/)
    ).toBeInTheDocument();
  });

  it('should have links to get API keys', () => {
    render(<SettingsPage />);

    const openaiLink = screen.getByRole('link', { name: /platform.openai.com/i });
    const anthropicLink = screen.getByRole('link', { name: /console.anthropic.com/i });
    const openrouterLink = screen.getByRole('link', { name: /openrouter.ai/i });

    expect(openaiLink).toHaveAttribute('href', 'https://platform.openai.com/api-keys');
    expect(anthropicLink).toHaveAttribute('href', 'https://console.anthropic.com/settings/keys');
    expect(openrouterLink).toHaveAttribute('href', 'https://openrouter.ai/keys');
  });

  it('should save multiple API keys at once', async () => {
    const user = userEvent.setup();
    render(<SettingsPage />);

    const openaiInput = screen.getByLabelText('OpenAI API Key');
    const anthropicInput = screen.getByLabelText('Anthropic API Key');
    const openrouterInput = screen.getByLabelText('OpenRouter API Key');
    const saveButton = screen.getByText('Save Keys');

    await user.type(openaiInput, 'sk-openai-123');
    await user.type(anthropicInput, 'sk-ant-456');
    await user.type(openrouterInput, 'sk-or-789');
    await user.click(saveButton);

    expect(storage.saveApiKeys).toHaveBeenCalledWith({
      openai: 'sk-openai-123',
      anthropic: 'sk-ant-456',
      openrouter: 'sk-or-789',
    });
  });
});
