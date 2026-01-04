import { v4 as uuidv4 } from 'uuid';
import {
  EvalResult,
  Project,
  Prompt,
  PromptVersion,
  ProjectModelConfig,
  EvaluationRun,
  EvaluationResult,
} from './types';
import {
  loadEvalHistory,
  saveProject,
  savePrompt,
  saveModelConfig,
  saveEvaluationRun,
} from './storage';

const MIGRATION_COMPLETE_KEY = 'evvl_migration_complete_v2';
const MIGRATION_TIMESTAMP_KEY = 'evvl_migration_timestamp';

/**
 * Check if migration has already been run
 */
export function isMigrationComplete(): boolean {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(MIGRATION_COMPLETE_KEY) === 'true';
  }
  return false;
}

/**
 * Migrate old eval history to new project-based model
 */
export function migrateEvalHistory(): void {
  if (typeof window === 'undefined') return;

  // Skip if already migrated
  if (isMigrationComplete()) {
    console.log('[Migration] Already completed, skipping');
    return;
  }

  console.log('[Migration] Starting migration from eval history to projects');

  const evalHistory = loadEvalHistory();

  if (evalHistory.length === 0) {
    console.log('[Migration] No eval history found, marking as complete');
    markMigrationComplete();
    return;
  }

  // Create "Imported Evaluations" project
  const importedProject: Project = {
    id: uuidv4(),
    name: 'Imported Evaluations',
    description: 'Automatically imported from previous evaluation history',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    promptIds: [],
    modelConfigIds: [],
    dataSetIds: [],
  };

  const modelConfigMap = new Map<string, string>(); // Key: "provider:model" -> ID

  // Process each eval result
  evalHistory.forEach((evalResult, index) => {
    try {
      // Create a prompt for this evaluation
      const promptId = uuidv4();
      const promptVersionId = uuidv4();

      const promptVersion: PromptVersion = {
        id: promptVersionId,
        versionNumber: 1,
        content: evalResult.prompt,
        createdAt: evalResult.timestamp,
      };

      const prompt: Prompt = {
        id: promptId,
        projectId: importedProject.id,
        name: `Prompt ${index + 1}`,
        versions: [promptVersion],
        currentVersionId: promptVersionId,
        createdAt: evalResult.timestamp,
        updatedAt: evalResult.timestamp,
      };

      savePrompt(prompt);
      importedProject.promptIds.push(promptId);

      // Create model configs for each output
      const modelConfigIds: string[] = [];

      evalResult.outputs.forEach((output) => {
        const configKey = `${output.modelConfig.provider}:${output.modelConfig.model}`;

        // Reuse existing config if already created
        if (!modelConfigMap.has(configKey)) {
          const configId = uuidv4();
          const modelConfig: ProjectModelConfig = {
            id: configId,
            projectId: importedProject.id,
            name: output.modelConfig.label,
            provider: output.modelConfig.provider,
            model: output.modelConfig.model,
            createdAt: evalResult.timestamp,
          };

          saveModelConfig(modelConfig);
          modelConfigMap.set(configKey, configId);

          if (!importedProject.modelConfigIds.includes(configId)) {
            importedProject.modelConfigIds.push(configId);
          }
        }

        modelConfigIds.push(modelConfigMap.get(configKey)!);
      });

      // Create evaluation run with results
      const evaluationResults: EvaluationResult[] = evalResult.outputs.map((output) => {
        const configKey = `${output.modelConfig.provider}:${output.modelConfig.model}`;
        const configId = modelConfigMap.get(configKey)!;

        // Find rating for this output
        const rating = evalResult.ratings.find(r => r.outputId === output.id);

        return {
          id: uuidv4(),
          modelConfigId: configId,
          output: output,
          rating: rating,
        };
      });

      const evaluationRun: EvaluationRun = {
        id: evalResult.id, // Keep original ID
        projectId: importedProject.id,
        promptId: promptId,
        promptVersionId: promptVersionId,
        modelConfigIds: modelConfigIds,
        results: evaluationResults,
        status: 'completed',
        createdAt: evalResult.timestamp,
        completedAt: evalResult.timestamp,
      };

      saveEvaluationRun(evaluationRun);
    } catch (error) {
      console.error('[Migration] Error processing eval result:', evalResult.id, error);
    }
  });

  // Save the imported project
  saveProject(importedProject);

  // Mark migration as complete
  markMigrationComplete();

  console.log(`[Migration] Complete! Migrated ${evalHistory.length} evaluations to project "${importedProject.name}"`);
}

/**
 * Mark migration as complete and store timestamp
 */
function markMigrationComplete(): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(MIGRATION_COMPLETE_KEY, 'true');
    localStorage.setItem(MIGRATION_TIMESTAMP_KEY, Date.now().toString());
  }
}

/**
 * Reset migration (for testing purposes)
 */
export function resetMigration(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(MIGRATION_COMPLETE_KEY);
    localStorage.removeItem(MIGRATION_TIMESTAMP_KEY);
    console.log('[Migration] Reset complete');
  }
}
