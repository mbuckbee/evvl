import { v4 as uuidv4 } from 'uuid';
import { Project, Prompt, PromptVersion, DataSet, DataSetItem, ProjectModelConfig, Provider } from './types';

// Example prompt content
export const EXAMPLE_PROMPT_TEMPLATE = `Classify the following product review as Positive, Negative, or Neutral. Respond with only one word.

Review: {{review}}`;

export const EXAMPLE_SYSTEM_PROMPT = 'You are a sentiment analysis assistant. Classify reviews accurately using only: Positive, Negative, or Neutral.';

// Example data set content - 10 short product reviews
export const EXAMPLE_DATA_SET_ITEMS: Array<{ name: string; review: string }> = [
  { name: 'Review 1', review: 'Love this product, works perfectly!' },
  { name: 'Review 2', review: 'Broke after two days, total waste of money' },
  { name: 'Review 3', review: "It's okay, nothing special" },
  { name: 'Review 4', review: 'Best purchase I have ever made' },
  { name: 'Review 5', review: 'Does not work as advertised, very disappointed' },
  { name: 'Review 6', review: 'Exactly what I needed, highly recommend' },
  { name: 'Review 7', review: 'Arrived damaged and customer service was unhelpful' },
  { name: 'Review 8', review: 'Good quality for the price' },
  { name: 'Review 9', review: 'Would not buy again' },
  { name: 'Review 10', review: 'Exceeded my expectations, amazing value' },
];

// Default model configs - shared between example project and new project creation
export const DEFAULT_MODEL_CONFIGS: Array<{
  name: string;
  provider: Provider;
  model: string;
}> = [
  { name: 'GPT-4', provider: 'openai', model: 'gpt-4' },
  { name: 'Claude 3.5 Sonnet', provider: 'anthropic', model: 'claude-3-5-sonnet-20241022' },
  { name: 'OpenRouter GPT-4', provider: 'openrouter', model: 'openai/gpt-4' },
  { name: 'Gemini Pro', provider: 'gemini', model: 'gemini-pro' },
];

export interface ExampleProjectData {
  project: Project;
  prompt: Prompt;
  dataSet: DataSet;
  modelConfigs: ProjectModelConfig[];
}

/**
 * Creates a complete example project with all associated data.
 * Generates fresh UUIDs and timestamps for each call.
 */
export function createExampleProject(): ExampleProjectData {
  const now = Date.now();
  const projectId = uuidv4();
  const promptId = uuidv4();
  const versionId = uuidv4();
  const dataSetId = uuidv4();

  // Create prompt with version
  const promptVersion: PromptVersion = {
    id: versionId,
    versionNumber: 1,
    content: EXAMPLE_PROMPT_TEMPLATE,
    systemPrompt: EXAMPLE_SYSTEM_PROMPT,
    note: 'Initial version',
    createdAt: now,
  };

  const prompt: Prompt = {
    id: promptId,
    projectId,
    name: 'Text Summarizer',
    description: 'Summarizes text content in 2-3 sentences',
    versions: [promptVersion],
    currentVersionId: versionId,
    createdAt: now,
    updatedAt: now,
  };

  // Create data set with items
  const dataSetItems: DataSetItem[] = EXAMPLE_DATA_SET_ITEMS.map((item) => ({
    id: uuidv4(),
    name: item.name,
    variables: { review: item.review },
  }));

  const dataSet: DataSet = {
    id: dataSetId,
    projectId,
    name: 'Reviews',
    items: dataSetItems,
    createdAt: now,
    updatedAt: now,
  };

  // Create model configs
  const modelConfigs: ProjectModelConfig[] = DEFAULT_MODEL_CONFIGS.map(config => ({
    id: uuidv4(),
    projectId,
    name: config.name,
    provider: config.provider,
    model: config.model,
    createdAt: now,
  }));

  // Create project
  const project: Project = {
    id: projectId,
    name: 'Example Project',
    description: 'A sample project demonstrating prompt evaluation with text summarization',
    createdAt: now,
    updatedAt: now,
    promptIds: [promptId],
    modelConfigIds: modelConfigs.map(c => c.id),
    dataSetIds: [dataSetId],
  };

  return { project, prompt, dataSet, modelConfigs };
}
