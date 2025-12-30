import {
  saveApiKeys,
  loadApiKeys,
  clearApiKeys,
  saveEvalResult,
  loadEvalHistory,
  deleteEvalResult,
  clearEvalHistory,
  getEvalById,
} from '../storage';
import { ApiKeys, EvalResult } from '../types';

describe('Storage Utilities', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    jest.clearAllMocks();
  });

  describe('API Keys', () => {
    it('should save API keys to localStorage', () => {
      const keys: ApiKeys = {
        openai: 'sk-test-123',
        anthropic: 'sk-ant-test-456',
        openrouter: 'sk-or-test-789',
      };

      saveApiKeys(keys);

      const stored = localStorage.getItem('evvl_api_keys');
      expect(stored).toBe(JSON.stringify(keys));
    });

    it('should load API keys from localStorage', () => {
      const keys: ApiKeys = {
        openai: 'sk-test-123',
        anthropic: 'sk-ant-test-456',
      };

      localStorage.setItem('evvl_api_keys', JSON.stringify(keys));

      const result = loadApiKeys();

      expect(result).toEqual(keys);
    });

    it('should return empty object when no API keys are stored', () => {
      const result = loadApiKeys();

      expect(result).toEqual({});
    });

    it('should clear API keys from localStorage', () => {
      const keys: ApiKeys = {
        openai: 'sk-test-123',
      };

      localStorage.setItem('evvl_api_keys', JSON.stringify(keys));

      clearApiKeys();

      const stored = localStorage.getItem('evvl_api_keys');
      expect(stored).toBeNull();
    });
  });

  describe('Eval History', () => {
    const mockEvalResult: EvalResult = {
      id: 'eval-123',
      prompt: 'Test prompt',
      outputs: [
        {
          id: 'output-1',
          modelConfig: { provider: 'openai', model: 'gpt-4-turbo-preview', label: 'GPT-4 Turbo' },
          content: 'Test response',
          tokens: 100,
          latency: 500,
          timestamp: Date.now(),
        },
      ],
      timestamp: Date.now(),
    };

    it('should save eval result to localStorage', () => {
      saveEvalResult(mockEvalResult);

      const stored = localStorage.getItem('evvl_eval_history');
      const history = JSON.parse(stored!);

      expect(history).toHaveLength(1);
      expect(history[0]).toEqual(mockEvalResult);
    });

    it('should add new eval to beginning of history', () => {
      const existingEval: EvalResult = {
        ...mockEvalResult,
        id: 'eval-old',
        prompt: 'Old prompt',
      };

      localStorage.setItem('evvl_eval_history', JSON.stringify([existingEval]));

      const newEval: EvalResult = {
        ...mockEvalResult,
        id: 'eval-new',
        prompt: 'New prompt',
      };

      saveEvalResult(newEval);

      const stored = localStorage.getItem('evvl_eval_history');
      const history = JSON.parse(stored!);

      expect(history[0].id).toBe('eval-new');
      expect(history[1].id).toBe('eval-old');
    });

    it('should limit history to 50 items', () => {
      // Create 50 eval results
      const manyEvals: EvalResult[] = Array.from({ length: 50 }, (_, i) => ({
        ...mockEvalResult,
        id: `eval-${i}`,
      }));

      localStorage.setItem('evvl_eval_history', JSON.stringify(manyEvals));

      const newEval: EvalResult = {
        ...mockEvalResult,
        id: 'eval-new',
      };

      saveEvalResult(newEval);

      const stored = localStorage.getItem('evvl_eval_history');
      const history = JSON.parse(stored!);

      expect(history.length).toBe(50);
      expect(history[0].id).toBe('eval-new');
      expect(history[49].id).toBe('eval-48');
      // eval-49 should be removed (it was the last item)
      expect(history.find((e: EvalResult) => e.id === 'eval-49')).toBeUndefined();
    });

    it('should load eval history from localStorage', () => {
      const history: EvalResult[] = [mockEvalResult];

      localStorage.setItem('evvl_eval_history', JSON.stringify(history));

      const result = loadEvalHistory();

      expect(result).toEqual(history);
    });

    it('should return empty array when no history exists', () => {
      const result = loadEvalHistory();

      expect(result).toEqual([]);
    });

    it('should delete eval result by id', () => {
      const history: EvalResult[] = [
        { ...mockEvalResult, id: 'eval-1' },
        { ...mockEvalResult, id: 'eval-2' },
        { ...mockEvalResult, id: 'eval-3' },
      ];

      localStorage.setItem('evvl_eval_history', JSON.stringify(history));

      deleteEvalResult('eval-2');

      const stored = localStorage.getItem('evvl_eval_history');
      const updatedHistory = JSON.parse(stored!);

      expect(updatedHistory.length).toBe(2);
      expect(updatedHistory.find((e: EvalResult) => e.id === 'eval-2')).toBeUndefined();
      expect(updatedHistory.find((e: EvalResult) => e.id === 'eval-1')).toBeDefined();
      expect(updatedHistory.find((e: EvalResult) => e.id === 'eval-3')).toBeDefined();
    });

    it('should clear eval history from localStorage', () => {
      const history: EvalResult[] = [mockEvalResult];

      localStorage.setItem('evvl_eval_history', JSON.stringify(history));

      clearEvalHistory();

      const stored = localStorage.getItem('evvl_eval_history');
      expect(stored).toBeNull();
    });

    it('should get eval by id', () => {
      const history: EvalResult[] = [
        { ...mockEvalResult, id: 'eval-1', prompt: 'First' },
        { ...mockEvalResult, id: 'eval-2', prompt: 'Second' },
      ];

      localStorage.setItem('evvl_eval_history', JSON.stringify(history));

      const result = getEvalById('eval-2');

      expect(result?.id).toBe('eval-2');
      expect(result?.prompt).toBe('Second');
    });

    it('should return undefined when eval id not found', () => {
      localStorage.setItem('evvl_eval_history', JSON.stringify([]));

      const result = getEvalById('nonexistent');

      expect(result).toBeUndefined();
    });
  });
});
