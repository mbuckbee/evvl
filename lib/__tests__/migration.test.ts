import { isMigrationComplete, migrateEvalHistory, resetMigration } from '../migration';
import * as storage from '../storage';

// Mock storage functions
jest.mock('../storage', () => ({
  loadEvalHistory: jest.fn(),
  saveProject: jest.fn(),
  savePrompt: jest.fn(),
  saveModelConfig: jest.fn(),
  saveEvaluationRun: jest.fn(),
}));

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-' + Math.random().toString(36).substr(2, 9)),
}));

describe('Migration', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  describe('isMigrationComplete', () => {
    it('should return false when migration not run', () => {
      expect(isMigrationComplete()).toBe(false);
    });

    it('should return true when migration flag is set', () => {
      localStorage.setItem('evvl_migration_complete_v2', 'true');
      expect(isMigrationComplete()).toBe(true);
    });
  });

  describe('migrateEvalHistory', () => {
    it('should skip if already migrated', () => {
      localStorage.setItem('evvl_migration_complete_v2', 'true');
      migrateEvalHistory();
      expect(storage.loadEvalHistory).not.toHaveBeenCalled();
    });

    it('should mark complete if no eval history', () => {
      (storage.loadEvalHistory as jest.Mock).mockReturnValue([]);
      migrateEvalHistory();
      expect(isMigrationComplete()).toBe(true);
    });

    it('should migrate eval history to projects', () => {
      const mockEvalHistory = [
        {
          id: 'eval-1',
          prompt: 'Test prompt',
          timestamp: 1700000000000,
          outputs: [
            {
              id: 'output-1',
              modelConfig: { provider: 'openai', model: 'gpt-4', label: 'GPT-4' },
              content: 'Response content',
            },
          ],
          ratings: [],
        },
      ];

      (storage.loadEvalHistory as jest.Mock).mockReturnValue(mockEvalHistory);

      migrateEvalHistory();

      // Should create project
      expect(storage.saveProject).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Imported Evaluations',
          description: 'Automatically imported from previous evaluation history',
        })
      );

      // Should create prompt
      expect(storage.savePrompt).toHaveBeenCalled();

      // Should create model config
      expect(storage.saveModelConfig).toHaveBeenCalled();

      // Should create evaluation run
      expect(storage.saveEvaluationRun).toHaveBeenCalled();

      // Should mark as complete
      expect(isMigrationComplete()).toBe(true);
    });

    it('should reuse model configs for same provider/model', () => {
      const mockEvalHistory = [
        {
          id: 'eval-1',
          prompt: 'Prompt 1',
          timestamp: 1700000000000,
          outputs: [
            { id: 'o1', modelConfig: { provider: 'openai', model: 'gpt-4', label: 'GPT-4' } },
          ],
          ratings: [],
        },
        {
          id: 'eval-2',
          prompt: 'Prompt 2',
          timestamp: 1700000001000,
          outputs: [
            { id: 'o2', modelConfig: { provider: 'openai', model: 'gpt-4', label: 'GPT-4' } },
          ],
          ratings: [],
        },
      ];

      (storage.loadEvalHistory as jest.Mock).mockReturnValue(mockEvalHistory);

      migrateEvalHistory();

      // Should only create one model config for the same provider/model
      expect(storage.saveModelConfig).toHaveBeenCalledTimes(1);
    });

    it('should handle errors gracefully', () => {
      const mockEvalHistory = [
        {
          id: 'eval-1',
          prompt: 'Test',
          timestamp: 1700000000000,
          outputs: [
            { id: 'o1', modelConfig: { provider: 'openai', model: 'gpt-4', label: 'GPT-4' } },
          ],
          ratings: [],
        },
      ];

      (storage.loadEvalHistory as jest.Mock).mockReturnValue(mockEvalHistory);
      (storage.savePrompt as jest.Mock).mockImplementation(() => {
        throw new Error('Save failed');
      });

      // Should not throw
      expect(() => migrateEvalHistory()).not.toThrow();

      // Should still mark as complete
      expect(isMigrationComplete()).toBe(true);
    });
  });

  describe('resetMigration', () => {
    it('should reset migration flags', () => {
      localStorage.setItem('evvl_migration_complete_v2', 'true');
      localStorage.setItem('evvl_migration_timestamp', '1700000000000');

      resetMigration();

      expect(localStorage.getItem('evvl_migration_complete_v2')).toBeNull();
      expect(localStorage.getItem('evvl_migration_timestamp')).toBeNull();
    });
  });
});
