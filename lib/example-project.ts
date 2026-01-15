import { v4 as uuidv4 } from 'uuid';
import { Project, Prompt, PromptVersion, DataSet, DataSetItem, ProjectModelConfig, Provider } from './types';

// Example prompt content
export const EXAMPLE_PROMPT_TEMPLATE = `Summarize the following text in 2-3 sentences:

{{content}}`;

export const EXAMPLE_SYSTEM_PROMPT = 'You are a helpful assistant that creates concise summaries.';

// Example data set content - three diverse sample articles
export const EXAMPLE_DATA_SET_ITEMS: Array<{ name: string; content: string }> = [
  {
    name: 'AI in Business',
    content: `Artificial intelligence is rapidly transforming how businesses operate. Companies are increasingly adopting AI-powered tools for customer service, data analysis, and process automation. While this technology promises significant efficiency gains, it also raises important questions about workforce displacement and the need for new skills training programs.`
  },
  {
    name: 'Renewable Energy',
    content: `The global shift toward renewable energy accelerated in 2024, with solar and wind power installations reaching record levels. Many countries have committed to aggressive decarbonization targets, driving investment in clean energy infrastructure. However, challenges remain around energy storage and grid modernization to handle intermittent power sources.`
  },
  {
    name: 'Remote Work',
    content: `Remote work has fundamentally changed the commercial real estate market. Office vacancy rates in major cities remain elevated as companies embrace hybrid work models. This shift is prompting building owners to reimagine office spaces, focusing on collaborative areas and amenities that give employees reasons to come in rather than rows of individual desks.`
  }
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
    variables: { content: item.content },
  }));

  const dataSet: DataSet = {
    id: dataSetId,
    projectId,
    name: 'Sample Articles',
    description: 'Example articles for testing text summarization',
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
