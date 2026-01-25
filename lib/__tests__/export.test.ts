import {
  exportRunToJSON,
  exportRunToCSV,
  exportMultipleRunsToJSON,
  exportMultipleRunsToCSV,
  exportCurrentEvaluationToJSON,
  exportCurrentEvaluationToCSV,
  ExportedRun,
} from '../export';
import { EvaluationRun, Prompt, ProjectModelConfig, AIOutput } from '../types';

// ============================================================================
// Test Data Factories
// ============================================================================

function createMockModelConfig(overrides: Partial<ProjectModelConfig> = {}): ProjectModelConfig {
  return {
    id: 'config-1',
    provider: 'openai',
    model: 'gpt-4',
    enabled: true,
    ...overrides,
  };
}

function createMockPrompt(overrides: Partial<Prompt> = {}): Prompt {
  return {
    id: 'prompt-1',
    name: 'Test Prompt',
    versions: [
      {
        id: 'version-1',
        content: 'Test prompt content',
        systemPrompt: 'You are helpful',
        createdAt: 1700000000000,
        label: 'v1',
      },
    ],
    ...overrides,
  };
}

function createMockRun(overrides: Partial<EvaluationRun> = {}): EvaluationRun {
  return {
    id: 'run-123',
    promptId: 'prompt-1',
    promptVersionId: 'version-1',
    status: 'completed',
    createdAt: 1700000000000,
    results: [
      {
        id: 'result-1',
        modelConfigId: 'config-1',
        status: 'completed',
        output: {
          content: 'AI response here',
          tokens: 150,
          latency: 1234,
        },
      },
    ],
    ...overrides,
  } as EvaluationRun;
}

function createMockAIOutput(overrides: Partial<AIOutput> = {}): AIOutput {
  return {
    modelConfig: createMockModelConfig(),
    content: 'AI response content',
    tokens: 100,
    latency: 500,
    isStreaming: false,
    ...overrides,
  };
}

// ============================================================================
// JSON Export Tests
// ============================================================================

describe('Export Functions', () => {
  describe('exportRunToJSON', () => {
    it('should export a basic run to JSON', () => {
      const run = createMockRun();
      const prompt = createMockPrompt();
      const modelConfigs = [createMockModelConfig()];

      const result = exportRunToJSON(run, prompt, modelConfigs);
      const parsed = JSON.parse(result) as ExportedRun;

      expect(parsed.id).toBe('run-123');
      expect(parsed.timestamp).toBe(1700000000000);
      expect(parsed.prompt).toBe('Test prompt content');
      expect(parsed.systemPrompt).toBe('You are helpful');
      expect(parsed.status).toBe('completed');
      expect(parsed.results).toHaveLength(1);
      expect(parsed.results[0].model).toBe('gpt-4');
      expect(parsed.results[0].provider).toBe('openai');
      expect(parsed.results[0].content).toBe('AI response here');
      expect(parsed.results[0].tokens).toBe(150);
      expect(parsed.results[0].latency).toBe(1234);
    });

    it('should handle missing prompt', () => {
      const run = createMockRun();
      const modelConfigs = [createMockModelConfig()];

      const result = exportRunToJSON(run, undefined, modelConfigs);
      const parsed = JSON.parse(result) as ExportedRun;

      expect(parsed.prompt).toBe('Unknown');
    });

    it('should handle missing model config', () => {
      const run = createMockRun({
        results: [
          {
            id: 'result-1',
            modelConfigId: 'unknown-config',
            status: 'completed',
            output: { content: 'Response' },
          },
        ],
      } as Partial<EvaluationRun>);
      const prompt = createMockPrompt();
      const modelConfigs: ProjectModelConfig[] = [];

      const result = exportRunToJSON(run, prompt, modelConfigs);
      const parsed = JSON.parse(result) as ExportedRun;

      expect(parsed.results[0].model).toBe('unknown');
      expect(parsed.results[0].provider).toBe('unknown');
    });

    it('should handle errors in results', () => {
      const run = createMockRun({
        results: [
          {
            id: 'result-1',
            modelConfigId: 'config-1',
            status: 'error',
            error: 'API rate limit exceeded',
            output: { error: 'Rate limited' },
          },
        ],
      } as Partial<EvaluationRun>);
      const prompt = createMockPrompt();
      const modelConfigs = [createMockModelConfig()];

      const result = exportRunToJSON(run, prompt, modelConfigs);
      const parsed = JSON.parse(result) as ExportedRun;

      expect(parsed.results[0].error).toBe('Rate limited');
    });

    it('should include dataset item ID', () => {
      const run = createMockRun({
        results: [
          {
            id: 'result-1',
            modelConfigId: 'config-1',
            status: 'completed',
            dataSetItemId: 'item-456',
            output: { content: 'Response' },
          },
        ],
      } as Partial<EvaluationRun>);
      const prompt = createMockPrompt();
      const modelConfigs = [createMockModelConfig()];

      const result = exportRunToJSON(run, prompt, modelConfigs);
      const parsed = JSON.parse(result) as ExportedRun;

      expect(parsed.results[0].dataSetItem).toBe('item-456');
    });
  });

  describe('exportMultipleRunsToJSON', () => {
    it('should export multiple runs', () => {
      const runs = [
        createMockRun({ id: 'run-1' }),
        createMockRun({ id: 'run-2' }),
      ];
      const prompts = [createMockPrompt()];
      const modelConfigs = [createMockModelConfig()];

      const result = exportMultipleRunsToJSON(runs, prompts, modelConfigs);
      const parsed = JSON.parse(result);

      expect(parsed).toHaveLength(2);
      expect(parsed[0].id).toBe('run-1');
      expect(parsed[1].id).toBe('run-2');
    });
  });

  // ============================================================================
  // CSV Export Tests
  // ============================================================================

  describe('exportRunToCSV', () => {
    it('should export a basic run to CSV', () => {
      const run = createMockRun();
      const prompt = createMockPrompt();
      const modelConfigs = [createMockModelConfig()];

      const result = exportRunToCSV(run, prompt, modelConfigs);
      const lines = result.split('\n');

      expect(lines).toHaveLength(2);
      expect(lines[0]).toBe('run_id,timestamp,prompt,model,provider,content,tokens,latency_ms,error,dataset_item');

      // Check data row
      const dataRow = lines[1];
      expect(dataRow).toContain('run-123');
      expect(dataRow).toContain('gpt-4');
      expect(dataRow).toContain('openai');
      expect(dataRow).toContain('AI response here');
      expect(dataRow).toContain('150');
      expect(dataRow).toContain('1234');
    });

    it('should properly escape CSV values with commas', () => {
      const run = createMockRun({
        results: [
          {
            id: 'result-1',
            modelConfigId: 'config-1',
            status: 'completed',
            output: { content: 'Hello, world!' },
          },
        ],
      } as Partial<EvaluationRun>);
      const prompt = createMockPrompt();
      const modelConfigs = [createMockModelConfig()];

      const result = exportRunToCSV(run, prompt, modelConfigs);

      expect(result).toContain('"Hello, world!"');
    });

    it('should properly escape CSV values with quotes', () => {
      const run = createMockRun({
        results: [
          {
            id: 'result-1',
            modelConfigId: 'config-1',
            status: 'completed',
            output: { content: 'Say "hello"' },
          },
        ],
      } as Partial<EvaluationRun>);
      const prompt = createMockPrompt();
      const modelConfigs = [createMockModelConfig()];

      const result = exportRunToCSV(run, prompt, modelConfigs);

      expect(result).toContain('"Say ""hello"""');
    });

    it('should properly escape CSV values with newlines', () => {
      const run = createMockRun({
        results: [
          {
            id: 'result-1',
            modelConfigId: 'config-1',
            status: 'completed',
            output: { content: 'Line 1\nLine 2' },
          },
        ],
      } as Partial<EvaluationRun>);
      const prompt = createMockPrompt();
      const modelConfigs = [createMockModelConfig()];

      const result = exportRunToCSV(run, prompt, modelConfigs);

      expect(result).toContain('"Line 1\nLine 2"');
    });

    it('should handle null values', () => {
      const run = createMockRun({
        results: [
          {
            id: 'result-1',
            modelConfigId: 'config-1',
            status: 'pending',
            output: undefined,
          },
        ],
      } as Partial<EvaluationRun>);
      const prompt = createMockPrompt();
      const modelConfigs = [createMockModelConfig()];

      const result = exportRunToCSV(run, prompt, modelConfigs);
      const lines = result.split('\n');

      // Should have empty values for undefined output
      expect(lines[1]).toContain('run-123');
    });
  });

  describe('exportMultipleRunsToCSV', () => {
    it('should export multiple runs with status column', () => {
      const runs = [
        createMockRun({ id: 'run-1', status: 'completed' }),
        createMockRun({ id: 'run-2', status: 'running' }),
      ];
      const prompts = [createMockPrompt()];
      const modelConfigs = [createMockModelConfig()];

      const result = exportMultipleRunsToCSV(runs, prompts, modelConfigs);
      const lines = result.split('\n');

      expect(lines).toHaveLength(3); // header + 2 data rows
      expect(lines[0]).toContain('status');
      expect(lines[1]).toContain('completed');
      expect(lines[2]).toContain('running');
    });
  });

  // ============================================================================
  // Current Evaluation Export Tests
  // ============================================================================

  describe('exportCurrentEvaluationToJSON', () => {
    it('should export current evaluation state', () => {
      const outputs = [
        createMockAIOutput({ content: 'Response 1', tokens: 100, latency: 500 }),
        createMockAIOutput({
          modelConfig: createMockModelConfig({ provider: 'anthropic', model: 'claude-3' }),
          content: 'Response 2',
          tokens: 200,
          latency: 800
        }),
      ];

      const result = exportCurrentEvaluationToJSON('Test prompt', 'System prompt', outputs);
      const parsed = JSON.parse(result);

      expect(parsed.prompt).toBe('Test prompt');
      expect(parsed.systemPrompt).toBe('System prompt');
      expect(parsed.outputs).toHaveLength(2);
      expect(parsed.outputs[0].model).toBe('gpt-4');
      expect(parsed.outputs[0].provider).toBe('openai');
      expect(parsed.outputs[1].model).toBe('claude-3');
      expect(parsed.outputs[1].provider).toBe('anthropic');
      expect(parsed.timestamp).toBeDefined();
    });

    it('should handle undefined system prompt', () => {
      const outputs = [createMockAIOutput()];

      const result = exportCurrentEvaluationToJSON('Test prompt', undefined, outputs);
      const parsed = JSON.parse(result);

      expect(parsed.systemPrompt).toBeUndefined();
    });

    it('should handle errors in outputs', () => {
      const outputs = [
        createMockAIOutput({ content: undefined, error: 'API Error' }),
      ];

      const result = exportCurrentEvaluationToJSON('Test prompt', undefined, outputs);
      const parsed = JSON.parse(result);

      expect(parsed.outputs[0].content).toBeNull();
      expect(parsed.outputs[0].error).toBe('API Error');
    });
  });

  describe('exportCurrentEvaluationToCSV', () => {
    it('should export current evaluation to CSV', () => {
      const outputs = [
        createMockAIOutput({ content: 'Response 1', tokens: 100, latency: 500 }),
      ];

      const result = exportCurrentEvaluationToCSV('Test prompt', 'System prompt', outputs);
      const lines = result.split('\n');

      expect(lines[0]).toBe('timestamp,prompt,system_prompt,model,provider,content,tokens,latency_ms,error');
      expect(lines[1]).toContain('Test prompt');
      expect(lines[1]).toContain('System prompt');
      expect(lines[1]).toContain('gpt-4');
      expect(lines[1]).toContain('openai');
      expect(lines[1]).toContain('Response 1');
      expect(lines[1]).toContain('100');
      expect(lines[1]).toContain('500');
    });

    it('should handle multiple outputs', () => {
      const outputs = [
        createMockAIOutput(),
        createMockAIOutput({ modelConfig: createMockModelConfig({ model: 'claude-3' }) }),
      ];

      const result = exportCurrentEvaluationToCSV('Test', undefined, outputs);
      const lines = result.split('\n');

      expect(lines).toHaveLength(3); // header + 2 data rows
    });
  });
});
