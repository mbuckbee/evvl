import { parseCliArgs, parseCliRunConfig, CliRunConfig } from '../cli-events';

describe('CLI Events', () => {
  describe('parseCliArgs', () => {
    it('should parse empty args', () => {
      const result = parseCliArgs(['/path/to/evvl']);
      expect(result).toEqual({});
    });

    it('should parse run command', () => {
      const result = parseCliArgs(['/path/to/evvl', 'run']);
      expect(result.command).toBe('run');
    });

    it('should parse projects command', () => {
      const result = parseCliArgs(['/path/to/evvl', 'projects']);
      expect(result.command).toBe('projects');
    });

    it('should parse prompts list subcommand', () => {
      const result = parseCliArgs(['/path/to/evvl', 'prompts', 'list']);
      expect(result.command).toBe('prompts');
      expect(result.subcommand).toBe('list');
    });

    it('should parse --open flag', () => {
      const result = parseCliArgs(['/path/to/evvl', '--open']);
      expect(result.open).toBe(true);
    });

    it('should parse -o short flag', () => {
      const result = parseCliArgs(['/path/to/evvl', '-o']);
      expect(result.open).toBe(true);
    });

    it('should parse --json flag', () => {
      const result = parseCliArgs(['/path/to/evvl', '--json']);
      expect(result.json).toBe(true);
    });

    it('should parse --prompt with value', () => {
      const result = parseCliArgs(['/path/to/evvl', '--prompt', 'Hello world']);
      expect(result.prompt).toBe('Hello world');
    });

    it('should parse --prompt-name with value', () => {
      const result = parseCliArgs(['/path/to/evvl', '--prompt-name', 'My Prompt']);
      expect(result.promptName).toBe('My Prompt');
    });

    it('should parse --models with comma-separated values', () => {
      const result = parseCliArgs(['/path/to/evvl', '--models', 'gpt-4,claude-3']);
      expect(result.models).toEqual(['gpt-4', 'claude-3']);
    });

    it('should parse -m short flag for models', () => {
      const result = parseCliArgs(['/path/to/evvl', '-m', 'gpt-4,claude-3']);
      expect(result.models).toEqual(['gpt-4', 'claude-3']);
    });

    it('should parse --system with value', () => {
      const result = parseCliArgs(['/path/to/evvl', '--system', 'You are helpful']);
      expect(result.systemPrompt).toBe('You are helpful');
    });

    it('should parse -s short flag for system', () => {
      const result = parseCliArgs(['/path/to/evvl', '-s', 'You are helpful']);
      expect(result.systemPrompt).toBe('You are helpful');
    });

    it('should parse --dataset with value', () => {
      const result = parseCliArgs(['/path/to/evvl', '--dataset', 'Test Cases']);
      expect(result.dataset).toBe('Test Cases');
    });

    it('should parse -d short flag for dataset', () => {
      const result = parseCliArgs(['/path/to/evvl', '-d', 'Test Cases']);
      expect(result.dataset).toBe('Test Cases');
    });

    it('should parse --project with value', () => {
      const result = parseCliArgs(['/path/to/evvl', '--project', 'My Project']);
      expect(result.project).toBe('My Project');
    });

    it('should parse -p short flag for project', () => {
      const result = parseCliArgs(['/path/to/evvl', '-p', 'My Project']);
      expect(result.project).toBe('My Project');
    });

    it('should parse --run with value', () => {
      const result = parseCliArgs(['/path/to/evvl', '--run', 'run-123']);
      expect(result.runId).toBe('run-123');
    });

    it('should parse --format with value', () => {
      const result = parseCliArgs(['/path/to/evvl', '--format', 'csv']);
      expect(result.format).toBe('csv');
    });

    it('should parse complex command with multiple flags', () => {
      const result = parseCliArgs([
        '/path/to/evvl',
        'run',
        '--prompt', 'Test prompt',
        '--models', 'gpt-4,claude-3',
        '-p', 'My Project',
        '--open',
        '--json'
      ]);

      expect(result.command).toBe('run');
      expect(result.prompt).toBe('Test prompt');
      expect(result.models).toEqual(['gpt-4', 'claude-3']);
      expect(result.project).toBe('My Project');
      expect(result.open).toBe(true);
      expect(result.json).toBe(true);
    });

    it('should ignore flags that start with dash but have no value when required', () => {
      const result = parseCliArgs(['/path/to/evvl', '--prompt', '--open']);
      // --prompt expects a value, but --open is a flag, so prompt should not be set
      expect(result.prompt).toBeUndefined();
      expect(result.open).toBe(true);
    });

    it('should trim whitespace from model list', () => {
      const result = parseCliArgs(['/path/to/evvl', '-m', ' gpt-4 , claude-3 ']);
      expect(result.models).toEqual(['gpt-4', 'claude-3']);
    });
  });

  describe('parseCliRunConfig', () => {
    it('should parse simple model strings with provider prefix', () => {
      const config: CliRunConfig = {
        source: 'cli',
        prompt: 'Test',
        models: ['openai/gpt-4', 'anthropic/claude-3'],
        openGui: false,
        status: 'pending',
        savedVersion: false,
      };

      const result = parseCliRunConfig(config);

      expect(result.models).toEqual([
        { provider: 'openai', model: 'gpt-4' },
        { provider: 'anthropic', model: 'claude-3' },
      ]);
    });

    it('should infer openai provider for gpt models', () => {
      const config: CliRunConfig = {
        source: 'cli',
        prompt: 'Test',
        models: ['gpt-4', 'gpt-3.5-turbo'],
        openGui: false,
        status: 'pending',
        savedVersion: false,
      };

      const result = parseCliRunConfig(config);

      expect(result.models).toEqual([
        { provider: 'openai', model: 'gpt-4' },
        { provider: 'openai', model: 'gpt-3.5-turbo' },
      ]);
    });

    it('should infer openai provider for o1 models', () => {
      const config: CliRunConfig = {
        source: 'cli',
        prompt: 'Test',
        models: ['o1-preview', 'o1-mini'],
        openGui: false,
        status: 'pending',
        savedVersion: false,
      };

      const result = parseCliRunConfig(config);

      expect(result.models).toEqual([
        { provider: 'openai', model: 'o1-preview' },
        { provider: 'openai', model: 'o1-mini' },
      ]);
    });

    it('should infer anthropic provider for claude models', () => {
      const config: CliRunConfig = {
        source: 'cli',
        prompt: 'Test',
        models: ['claude-3-opus', 'claude-3-5-sonnet'],
        openGui: false,
        status: 'pending',
        savedVersion: false,
      };

      const result = parseCliRunConfig(config);

      expect(result.models).toEqual([
        { provider: 'anthropic', model: 'claude-3-opus' },
        { provider: 'anthropic', model: 'claude-3-5-sonnet' },
      ]);
    });

    it('should infer gemini provider for gemini models', () => {
      const config: CliRunConfig = {
        source: 'cli',
        prompt: 'Test',
        models: ['gemini-pro', 'gemini-1.5-flash'],
        openGui: false,
        status: 'pending',
        savedVersion: false,
      };

      const result = parseCliRunConfig(config);

      expect(result.models).toEqual([
        { provider: 'gemini', model: 'gemini-pro' },
        { provider: 'gemini', model: 'gemini-1.5-flash' },
      ]);
    });

    it('should default to openrouter for unknown models', () => {
      const config: CliRunConfig = {
        source: 'cli',
        prompt: 'Test',
        models: ['llama-3', 'mistral-7b'],
        openGui: false,
        status: 'pending',
        savedVersion: false,
      };

      const result = parseCliRunConfig(config);

      expect(result.models).toEqual([
        { provider: 'openrouter', model: 'llama-3' },
        { provider: 'openrouter', model: 'mistral-7b' },
      ]);
    });

    it('should preserve prompt content', () => {
      const config: CliRunConfig = {
        source: 'cli',
        prompt: 'Explain quantum computing',
        models: ['gpt-4'],
        openGui: false,
        status: 'pending',
        savedVersion: false,
      };

      const result = parseCliRunConfig(config);

      expect(result.prompt).toBe('Explain quantum computing');
    });

    it('should handle mixed model formats', () => {
      const config: CliRunConfig = {
        source: 'cli',
        prompt: 'Test',
        models: ['openai/gpt-4', 'claude-3', 'llama-3'],
        openGui: false,
        status: 'pending',
        savedVersion: false,
      };

      const result = parseCliRunConfig(config);

      expect(result.models).toEqual([
        { provider: 'openai', model: 'gpt-4' },
        { provider: 'anthropic', model: 'claude-3' },
        { provider: 'openrouter', model: 'llama-3' },
      ]);
    });
  });
});
