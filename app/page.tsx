'use client';

import { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { loadApiKeys, loadColumns, saveColumns, getPromptById, getModelConfigById, getProjectById, getActiveProjectId, setActiveProjectId, loadProjects, getPromptsByProjectId, getModelConfigsByProjectId, getDataSetById, getDataSetsByProjectId } from '@/lib/storage';
import { ApiKeys, AIOutput, Prompt, ProjectModelConfig, Project, DataSet } from '@/lib/types';
import { PROVIDERS, getDefaultModel, ProviderConfig } from '@/lib/config';
import { fetchOpenRouterModels, getOpenAIModels, getAnthropicModels, getPopularOpenRouterModels, getGeminiModels } from '@/lib/fetch-models';
import { trackEvent } from '@/lib/analytics';
import { apiClient, isApiError } from '@/lib/api';
import TwoColumnLayout from '@/components/layout/two-column-layout';
import Sidebar from '@/components/collections/sidebar';
import ResponsePanel from '@/components/response/response-panel';
import PromptEditor from '@/components/prompts/prompt-editor';
import ConfigEditor from '@/components/model-configs/config-editor';
import ProjectEditor from '@/components/projects/project-editor';
import DataSetEditor from '@/components/data-sets/data-set-editor';

export default function Home() {
  // State management
  const [prompt, setPrompt] = useState('');
  const [provider, setProvider] = useState<'openai' | 'anthropic' | 'openrouter' | 'gemini'>('openai');
  const [model, setModel] = useState<string>('');
  const [apiKeys, setApiKeys] = useState<ApiKeys>({});
  const [output, setOutput] = useState<AIOutput | undefined>();
  const [isGenerating, setIsGenerating] = useState(false);
  const [providers, setProviders] = useState<ProviderConfig[]>(PROVIDERS);

  // Editor state
  const [showPromptEditor, setShowPromptEditor] = useState(true); // Start with prompt editor open
  const [editingPromptId, setEditingPromptId] = useState<string | null>(null);
  const [showConfigEditor, setShowConfigEditor] = useState(false);
  const [editingConfigId, setEditingConfigId] = useState<string | null>(null);
  const [showProjectEditor, setShowProjectEditor] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [showDataSetEditor, setShowDataSetEditor] = useState(false);
  const [editingDataSetId, setEditingDataSetId] = useState<string | null>(null);
  const [activeProjectId, setActiveProjectIdState] = useState<string | null>(null);
  const [sidebarKey, setSidebarKey] = useState(0);
  const [highlightedConfigId, setHighlightedConfigId] = useState<string | null>(null);
  const [highlightPromptEditor, setHighlightPromptEditor] = useState(false);
  const [showNewConfigInResponse, setShowNewConfigInResponse] = useState(false);
  const [configResponses, setConfigResponses] = useState<Record<string, AIOutput[]>>({});
  const [generatingConfigs, setGeneratingConfigs] = useState<Record<string, boolean>>({});
  const [selectedVersions, setSelectedVersions] = useState<Record<string, string>>({});
  const [selectedDataSetId, setSelectedDataSetId] = useState<string | null>(null);

  // Initialize on mount
  useEffect(() => {
    // Load API keys
    setApiKeys(loadApiKeys());

    // Set default model for initial provider
    setModel(getDefaultModel('openai'));

    // Set active project to first available project
    const activeId = getActiveProjectId();
    if (activeId) {
      setActiveProjectIdState(activeId);
    } else {
      // If no active project, use the first project
      const projects = loadProjects();
      if (projects.length > 0) {
        setActiveProjectIdState(projects[0].id);
        setActiveProjectId(projects[0].id);
      }
    }

    // Load dynamic models from OpenRouter API
    async function loadModels() {
      const models = await fetchOpenRouterModels();

      if (models.length > 0) {
        const openaiModels = getOpenAIModels(models);
        const anthropicModels = getAnthropicModels(models);
        const openrouterModels = getPopularOpenRouterModels(models);
        const geminiModels = getGeminiModels(models);

        const updatedProviders = PROVIDERS.map(p => {
          if (p.key === 'openai' && openaiModels.length > 0) {
            return { ...p, models: openaiModels };
          } else if (p.key === 'anthropic' && anthropicModels.length > 0) {
            return { ...p, models: anthropicModels };
          } else if (p.key === 'openrouter' && openrouterModels.length > 0) {
            return { ...p, models: openrouterModels };
          } else if (p.key === 'gemini' && geminiModels.length > 0) {
            return { ...p, models: geminiModels };
          }
          return p;
        });

        setProviders(updatedProviders);

        // Update model if needed
        const providerConfig = updatedProviders.find(p => p.key === provider);
        if (providerConfig?.models && providerConfig.models.length > 0 && !model) {
          setModel(providerConfig.models[0].value);
        }
      }
    }

    loadModels();
  }, []);

  // Update model when provider changes
  useEffect(() => {
    const providerConfig = providers.find(p => p.key === provider);
    if (providerConfig) {
      // Use first available model or default
      const firstModel = providerConfig.models && providerConfig.models.length > 0
        ? providerConfig.models[0].value
        : getDefaultModel(provider);
      setModel(firstModel);
    }
  }, [provider, providers]);

  // Handle generation
  const handleSend = async () => {
    if (!prompt.trim() || !model || !apiKeys[provider]) {
      // Show error if no API key
      if (!apiKeys[provider]) {
        setOutput({
          id: uuidv4(),
          modelConfig: { provider, model, label: provider },
          type: 'text',
          content: '',
          error: `Please configure your ${provider.toUpperCase()} API key in Settings`,
          timestamp: Date.now(),
        });
      }
      return;
    }

    setIsGenerating(true);
    setOutput(undefined);

    const outputId = uuidv4();
    const providerConfig = providers.find(p => p.key === provider);

    // Detect if this is an image generation model
    const isImageModel = model.toLowerCase().includes('dall-e') ||
                         model.toLowerCase().includes('stable-diffusion') ||
                         model.toLowerCase().includes('imagen') ||
                         (model.toLowerCase().includes('image') && model.toLowerCase().includes('gemini'));

    try {
      let data;

      if (isImageModel) {
        data = await apiClient.generateImage({
          prompt,
          provider,
          model,
          apiKey: apiKeys[provider],
        });
      } else {
        data = await apiClient.generateText({
          prompt,
          provider,
          model,
          apiKey: apiKeys[provider],
        });
      }

      if (isApiError(data)) {
        // Error response
        setOutput({
          id: outputId,
          modelConfig: { provider, model, label: providerConfig?.name || provider },
          type: isImageModel ? 'image' : 'text',
          content: '',
          error: data.error,
          timestamp: Date.now(),
        });
      } else if (isImageModel && 'imageUrl' in data) {
        // Image generation response
        setOutput({
          id: outputId,
          modelConfig: { provider, model, label: providerConfig?.name || provider },
          type: 'image',
          content: data.revisedPrompt || prompt,
          imageUrl: data.imageUrl,
          latency: data.latency,
          timestamp: Date.now(),
        });
      } else if (!isImageModel && 'content' in data) {
        // Text generation response
        setOutput({
          id: outputId,
          modelConfig: { provider, model, label: providerConfig?.name || provider },
          type: 'text',
          content: data.content,
          tokens: data.tokens,
          latency: data.latency,
          timestamp: Date.now(),
        });
      }

      // Track analytics
      trackEvent('generation_success', {
        provider,
        model,
      });
    } catch (error: any) {
      setOutput({
        id: outputId,
        modelConfig: { provider, model, label: providerConfig?.name || provider },
        type: isImageModel ? 'image' : 'text',
        content: '',
        error: error.message || 'Network error',
        timestamp: Date.now(),
      });
    } finally {
      setIsGenerating(false);
    }
  };


  const handleNewProject = () => {
    setEditingProjectId(null);
    setShowProjectEditor(true);
    setShowPromptEditor(false);
    setShowConfigEditor(false);
  };

  const handleProjectSelect = (projectId: string) => {
    // Set as active project
    setActiveProjectIdState(projectId);
    setActiveProjectId(projectId);

    // Clear responses and reset dataset when switching projects
    setConfigResponses({});
    setSelectedDataSetId(null);

    // Get latest prompt from this project (sorted by creation date, most recent first)
    const prompts = getPromptsByProjectId(projectId);
    if (prompts.length > 0) {
      // Load latest prompt into editor
      const latestPrompt = prompts[prompts.length - 1]; // Latest is last in array
      setEditingPromptId(latestPrompt.id);
      setShowPromptEditor(true);
    } else {
      // No prompts, show empty state or new prompt form
      setEditingPromptId(null);
      setShowPromptEditor(true);
    }

    // Close other editors
    setShowProjectEditor(false);
    setShowConfigEditor(false);
    setShowNewConfigInResponse(false);
  };

  const handleProjectSave = (project: Project) => {
    const isNewProject = !editingProjectId;

    setShowProjectEditor(false);
    setEditingProjectId(null);
    // Refresh sidebar to show new/updated project
    setSidebarKey(prev => prev + 1);

    // If it's a new project, automatically open the new prompt form
    if (isNewProject) {
      setActiveProjectIdState(project.id);
      setActiveProjectId(project.id);
      setEditingPromptId(null);
      setShowPromptEditor(true);
      setShowConfigEditor(false);
    }
  };

  const handleProjectCancel = () => {
    setShowProjectEditor(false);
    setEditingProjectId(null);
  };

  const handleProjectDelete = () => {
    setShowProjectEditor(false);
    setEditingProjectId(null);
    // Refresh sidebar to remove deleted project
    setSidebarKey(prev => prev + 1);
  };

  const handleNewPrompt = (projectId: string) => {
    setActiveProjectIdState(projectId);
    setEditingPromptId(null);
    setShowPromptEditor(true);
    setShowConfigEditor(false);
    setShowProjectEditor(false);
    setActiveProjectId(projectId);
  };

  const handlePromptSelect = (promptId: string, shouldEdit: boolean = false) => {
    const selectedPrompt = getPromptById(promptId);
    if (selectedPrompt) {
      // Open prompt in editor for viewing/editing
      setActiveProjectIdState(selectedPrompt.projectId);
      setActiveProjectId(selectedPrompt.projectId);
      setEditingPromptId(promptId);
      setShowPromptEditor(true);
      setShowConfigEditor(false);
      setShowProjectEditor(false);

      // Highlight the prompt editor
      setHighlightPromptEditor(true);
      // Clear highlight after animation completes
      setTimeout(() => setHighlightPromptEditor(false), 2000);
    }
  };

  const handlePromptSave = (prompt: Prompt) => {
    // Keep the editor open and show the saved prompt
    setEditingPromptId(prompt.id);
    setShowPromptEditor(true);
    // Refresh sidebar to show updated prompts
    setSidebarKey(prev => prev + 1);
  };

  // Helper function to substitute variables in a prompt
  const substituteVariables = (promptContent: string, variables: Record<string, string>): string => {
    let result = promptContent;
    Object.keys(variables).forEach(key => {
      const value = variables[key];
      // Only replace if the value exists and is not empty
      if (value !== undefined && value !== null && value !== '') {
        const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
        result = result.replace(regex, value);
      }
    });
    return result;
  };

  const handlePromptSaveAndRefresh = async (prompt: Prompt) => {
    // Save the prompt
    setEditingPromptId(prompt.id);
    setShowPromptEditor(true);

    // Get all model configs for this project
    if (!activeProjectId) return;
    const modelConfigs = getModelConfigsByProjectId(activeProjectId);

    // Get the latest version as default
    const latestVersion = prompt.versions.reduce((latest, current) =>
      current.versionNumber > latest.versionNumber ? current : latest
    , prompt.versions[0]);

    // Get data set if selected
    const dataSet = selectedDataSetId ? getDataSetById(selectedDataSetId) : null;
    const dataSetItems = (dataSet?.items && dataSet.items.length > 0) ? dataSet.items : [{ id: '', variables: {} }]; // If no dataset or empty dataset, run once with no substitution

    // Run inference for each model config in parallel
    const configPromises = modelConfigs.map(async (config) => {
      const apiKey = apiKeys[config.provider];
      if (!apiKey) return; // Skip if no API key

      // Get the selected version for this config
      const selectedVersionId = selectedVersions[config.id];
      let selectedVersion;

      if (selectedVersionId === 'latest' || !selectedVersionId) {
        // Use latest version
        selectedVersion = latestVersion;
      } else {
        // Use specific version
        selectedVersion = prompt.versions.find(v => v.id === selectedVersionId) || latestVersion;
      }

      const basePromptContent = selectedVersion?.content || '';

      // Detect if this is an image generation model
      const isImageModel = config.model.includes('dall-e') ||
                          config.model.includes('-image') ||
                          config.model.includes('stable-diffusion') ||
                          config.model.includes('midjourney');

      // Set loading state
      setGeneratingConfigs(prev => ({ ...prev, [config.id]: true }));

      const responses: AIOutput[] = [];

      // Generate response for each data set item
      for (const item of dataSetItems) {
        const promptContent = dataSet ? substituteVariables(basePromptContent, item.variables) : basePromptContent;

        try {
          const data = isImageModel
            ? await apiClient.generateImage({
                prompt: promptContent,
                provider: config.provider,
                model: config.model,
                apiKey: apiKey,
              })
            : await apiClient.generateText({
                prompt: promptContent,
                provider: config.provider,
                model: config.model,
                apiKey: apiKey,
                ...config.parameters,
              });

          if (isApiError(data)) {
            responses.push({
              id: uuidv4(),
              modelConfig: { provider: config.provider, model: config.model, label: config.name },
              type: isImageModel ? 'image' : 'text',
              content: '',
              error: data.error,
              timestamp: Date.now(),
            });
          } else if ('imageUrl' in data) {
            responses.push({
              id: uuidv4(),
              modelConfig: { provider: config.provider, model: config.model, label: config.name },
              type: 'image',
              content: data.revisedPrompt || promptContent,
              imageUrl: data.imageUrl,
              latency: data.latency,
              timestamp: Date.now(),
            });
          } else if ('content' in data) {
            responses.push({
              id: uuidv4(),
              modelConfig: { provider: config.provider, model: config.model, label: config.name },
              type: 'text',
              content: data.content,
              tokens: data.tokens,
              latency: data.latency,
              timestamp: Date.now(),
            });
          }
        } catch (error: any) {
          responses.push({
            id: uuidv4(),
            modelConfig: { provider: config.provider, model: config.model, label: config.name },
            type: isImageModel ? 'image' : 'text',
            content: '',
            error: error.message || 'Network error',
            timestamp: Date.now(),
          });
        }
      }

      // Update responses for this config immediately when done
      setConfigResponses(prev => ({
        ...prev,
        [config.id]: responses
      }));
      setGeneratingConfigs(prev => ({ ...prev, [config.id]: false }));
    });

    // Wait for all configs to complete
    await Promise.all(configPromises);
  };

  const handleVersionChange = async (configId: string, versionId: string) => {
    setSelectedVersions(prev => ({ ...prev, [configId]: versionId }));

    // Refresh outputs for this specific config
    if (!editingPromptId || !activeProjectId) return;

    const prompt = getPromptById(editingPromptId);
    if (!prompt) return;

    const config = getModelConfigById(configId);
    if (!config) return;

    const apiKey = apiKeys[config.provider];
    if (!apiKey) return;

    // Get the selected version
    let selectedVersion;
    if (versionId === 'latest') {
      const latestVersion = prompt.versions.reduce((latest, current) =>
        current.versionNumber > latest.versionNumber ? current : latest
      , prompt.versions[0]);
      selectedVersion = latestVersion;
    } else {
      selectedVersion = prompt.versions.find(v => v.id === versionId);
    }

    if (!selectedVersion) return;

    const basePromptContent = selectedVersion.content;

    // Detect if this is an image generation model
    const isImageModel = config.model.includes('dall-e') ||
                        config.model.includes('-image') ||
                        config.model.includes('stable-diffusion') ||
                        config.model.includes('midjourney');

    // Get data set if selected
    const dataSet = selectedDataSetId ? getDataSetById(selectedDataSetId) : null;
    const dataSetItems = (dataSet?.items && dataSet.items.length > 0) ? dataSet.items : [{ id: '', variables: {} }];

    // Set loading state
    setGeneratingConfigs(prev => ({ ...prev, [config.id]: true }));

    const responses: AIOutput[] = [];

    // Generate response for each data set item
    for (const item of dataSetItems) {
      const promptContent = dataSet ? substituteVariables(basePromptContent, item.variables) : basePromptContent;

      try {
        const data = isImageModel
          ? await apiClient.generateImage({
              prompt: promptContent,
              provider: config.provider,
              model: config.model,
              apiKey: apiKey,
            })
          : await apiClient.generateText({
              prompt: promptContent,
              provider: config.provider,
              model: config.model,
              apiKey: apiKey,
              ...config.parameters,
            });

        if (isApiError(data)) {
          responses.push({
            id: uuidv4(),
            modelConfig: { provider: config.provider, model: config.model, label: config.name },
            type: isImageModel ? 'image' : 'text',
            content: '',
            error: data.error,
            timestamp: Date.now(),
          });
        } else if ('imageUrl' in data) {
          responses.push({
            id: uuidv4(),
            modelConfig: { provider: config.provider, model: config.model, label: config.name },
            type: 'image',
            content: data.revisedPrompt || promptContent,
            imageUrl: data.imageUrl,
            latency: data.latency,
            timestamp: Date.now(),
          });
        } else if ('content' in data) {
          responses.push({
            id: uuidv4(),
            modelConfig: { provider: config.provider, model: config.model, label: config.name },
            type: 'text',
            content: data.content,
            tokens: data.tokens,
            latency: data.latency,
            timestamp: Date.now(),
          });
        }
      } catch (error: any) {
        responses.push({
          id: uuidv4(),
          modelConfig: { provider: config.provider, model: config.model, label: config.name },
          type: isImageModel ? 'image' : 'text',
          content: '',
          error: error.message || 'Network error',
          timestamp: Date.now(),
        });
      }
    }

    // Update responses for this config
    setConfigResponses(prev => ({
      ...prev,
      [config.id]: responses
    }));
    setGeneratingConfigs(prev => ({ ...prev, [config.id]: false }));
  };

  // Refresh responses when data set selection changes
  useEffect(() => {
    // Only refresh if we have an active prompt
    if (!editingPromptId || !activeProjectId) return;

    const prompt = getPromptById(editingPromptId);
    if (!prompt) return;

    // Trigger refresh with the new data set
    handlePromptSaveAndRefresh(prompt);
  }, [selectedDataSetId]);

  const handleConfigSaveAndRefresh = async (configId: string) => {
    // Only run inference if there's a current prompt loaded
    if (!editingPromptId || !activeProjectId) return;

    const prompt = getPromptById(editingPromptId);
    if (!prompt) return;

    const config = getModelConfigById(configId);
    if (!config) return;

    const apiKey = apiKeys[config.provider];
    if (!apiKey) return; // Skip if no API key

    // Get the latest version
    const latestVersion = prompt.versions.reduce((latest, current) =>
      current.versionNumber > latest.versionNumber ? current : latest
    , prompt.versions[0]);

    // Get the selected version for this config
    const selectedVersionId = selectedVersions[config.id];
    let selectedVersion;

    if (selectedVersionId === 'latest' || !selectedVersionId) {
      selectedVersion = latestVersion;
    } else {
      selectedVersion = prompt.versions.find(v => v.id === selectedVersionId) || latestVersion;
    }

    const basePromptContent = selectedVersion?.content || '';

    // Detect if this is an image generation model
    const isImageModel = config.model.includes('dall-e') ||
                        config.model.includes('-image') ||
                        config.model.includes('stable-diffusion') ||
                        config.model.includes('midjourney');

    // Get data set if selected
    const dataSet = selectedDataSetId ? getDataSetById(selectedDataSetId) : null;
    const dataSetItems = (dataSet?.items && dataSet.items.length > 0) ? dataSet.items : [{ id: '', variables: {} }];

    // Set loading state
    setGeneratingConfigs(prev => ({ ...prev, [config.id]: true }));

    const responses: AIOutput[] = [];

    // Generate response for each data set item
    for (const item of dataSetItems) {
      const promptContent = dataSet ? substituteVariables(basePromptContent, item.variables) : basePromptContent;

      try {
        const data = isImageModel
          ? await apiClient.generateImage({
              prompt: promptContent,
              provider: config.provider,
              model: config.model,
              apiKey: apiKey,
            })
          : await apiClient.generateText({
              prompt: promptContent,
              provider: config.provider,
              model: config.model,
              apiKey: apiKey,
              ...config.parameters,
            });

        if (isApiError(data)) {
          responses.push({
            id: uuidv4(),
            modelConfig: { provider: config.provider, model: config.model, label: config.name },
            type: isImageModel ? 'image' : 'text',
            content: '',
            error: data.error,
            timestamp: Date.now(),
          });
        } else if ('imageUrl' in data) {
          responses.push({
            id: uuidv4(),
            modelConfig: { provider: config.provider, model: config.model, label: config.name },
            type: 'image',
            content: data.revisedPrompt || promptContent,
            imageUrl: data.imageUrl,
            latency: data.latency,
            timestamp: Date.now(),
          });
        } else if ('content' in data) {
          responses.push({
            id: uuidv4(),
            modelConfig: { provider: config.provider, model: config.model, label: config.name },
            type: 'text',
            content: data.content,
            tokens: data.tokens,
            latency: data.latency,
            timestamp: Date.now(),
          });
        }
      } catch (error: any) {
        responses.push({
          id: uuidv4(),
          modelConfig: { provider: config.provider, model: config.model, label: config.name },
          type: isImageModel ? 'image' : 'text',
          content: '',
          error: error.message || 'Network error',
          timestamp: Date.now(),
        });
      }
    }

    // Update all responses for this config
    setConfigResponses(prev => ({
      ...prev,
      [config.id]: responses
    }));
    setGeneratingConfigs(prev => ({ ...prev, [config.id]: false }));
  };

  const handlePromptCancel = () => {
    setShowPromptEditor(false);
    setEditingPromptId(null);
  };

  const handleNewModelConfig = (projectId: string) => {
    setActiveProjectIdState(projectId);
    setActiveProjectId(projectId);

    // Load first prompt into top panel
    const prompts = getPromptsByProjectId(projectId);
    if (prompts.length > 0) {
      setEditingPromptId(prompts[0].id);
      setShowPromptEditor(true);
    } else {
      setEditingPromptId(null);
      setShowPromptEditor(false);
    }

    // Show new config editor in response panel instead of top panel
    setShowNewConfigInResponse(true);
    // Close other editors
    setShowConfigEditor(false);
    setShowProjectEditor(false);
  };

  const handleModelConfigSelect = (configId: string, shouldEdit: boolean = false) => {
    const selectedConfig = getModelConfigById(configId);
    if (selectedConfig) {
      // Set active project
      setActiveProjectIdState(selectedConfig.projectId);
      setActiveProjectId(selectedConfig.projectId);

      // Load first prompt from this project
      const prompts = getPromptsByProjectId(selectedConfig.projectId);
      if (prompts.length > 0) {
        setEditingPromptId(prompts[0].id);
        setShowPromptEditor(true);
      } else {
        setEditingPromptId(null);
        setShowPromptEditor(false);
      }

      if (shouldEdit) {
        // Open in editor for editing
        setEditingConfigId(configId);
        setShowConfigEditor(true);
      } else {
        // Load the config's provider and model into the request panel for testing
        setProvider(selectedConfig.provider);
        setModel(selectedConfig.model);

        // TODO: Apply parameters when RequestPanel supports them
        // For now, just set provider and model

        // Close config editor
        setShowConfigEditor(false);

        // Highlight the card in the response panel
        setHighlightedConfigId(configId);
        // Clear highlight after animation completes
        setTimeout(() => setHighlightedConfigId(null), 2000);
      }

      // Close project editor
      setShowProjectEditor(false);
    }
  };

  const handleConfigSave = () => {
    setShowConfigEditor(false);
    setEditingConfigId(null);
    // Refresh sidebar to show updated configs
    setSidebarKey(prev => prev + 1);
  };

  const handleConfigCancel = () => {
    setShowConfigEditor(false);
    setEditingConfigId(null);
  };

  const handleNewDataSet = (projectId: string) => {
    setActiveProjectIdState(projectId);
    setActiveProjectId(projectId);
    setEditingDataSetId(null);
    setShowDataSetEditor(true);
  };

  const handleDataSetSelect = (dataSetId: string) => {
    const selectedDataSet = getDataSetById(dataSetId);
    if (selectedDataSet) {
      setActiveProjectIdState(selectedDataSet.projectId);
      setActiveProjectId(selectedDataSet.projectId);
      setEditingDataSetId(dataSetId);
      setShowDataSetEditor(true);
    }
  };

  const handleDataSetSave = () => {
    setShowDataSetEditor(false);
    setEditingDataSetId(null);
  };

  const handleDataSetCancel = () => {
    setShowDataSetEditor(false);
    setEditingDataSetId(null);
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Navigation stays at top */}
      <nav className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Evvl
            </h1>
            <div className="flex items-center gap-4 text-sm">
              <a
                href="/history"
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                History
              </a>
              <a
                href="/settings"
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Settings
              </a>
            </div>
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            AI Model Testing & Evaluation
          </div>
        </div>
      </nav>

      {/* Two-column layout: sidebar | (top panel / bottom panel) */}
      <div className="flex-1 overflow-hidden">
        <TwoColumnLayout
          sidebar={
            <Sidebar
              key={sidebarKey}
              onNewProject={handleNewProject}
              onProjectSelect={handleProjectSelect}
              onNewPrompt={handleNewPrompt}
              onPromptSelect={handlePromptSelect}
              onNewModelConfig={handleNewModelConfig}
              onModelConfigSelect={handleModelConfigSelect}
              onNewDataSet={handleNewDataSet}
              onDataSetSelect={handleDataSetSelect}
            />
          }
          topPanel={
            showProjectEditor ? (
              <ProjectEditor
                project={editingProjectId ? getProjectById(editingProjectId) : undefined}
                onSave={handleProjectSave}
                onCancel={handleProjectCancel}
                onDelete={handleProjectDelete}
              />
            ) : showPromptEditor && activeProjectId ? (
              <PromptEditor
                projectId={activeProjectId}
                prompt={editingPromptId ? getPromptById(editingPromptId) : undefined}
                onSave={handlePromptSave}
                onCancel={handlePromptCancel}
                onSaveAndRefresh={handlePromptSaveAndRefresh}
                highlighted={highlightPromptEditor}
              />
            ) : showConfigEditor && activeProjectId ? (
              <ConfigEditor
                projectId={activeProjectId}
                config={editingConfigId ? getModelConfigById(editingConfigId) : undefined}
                onSave={handleConfigSave}
                onCancel={handleConfigCancel}
              />
            ) : (
              <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-gray-800">
                <div className="text-center text-gray-500 dark:text-gray-400">
                  <p className="text-lg">Select or create a prompt to get started</p>
                </div>
              </div>
            )
          }
          bottomPanel={
            showDataSetEditor && activeProjectId ? (
              <DataSetEditor
                projectId={activeProjectId}
                dataSet={editingDataSetId ? getDataSetById(editingDataSetId) : undefined}
                onSave={handleDataSetSave}
                onCancel={handleDataSetCancel}
              />
            ) : (
              <ResponsePanel
                output={output}
                isGenerating={isGenerating}
                projectId={activeProjectId || undefined}
                highlightedConfigId={highlightedConfigId || undefined}
                showNewConfigEditor={showNewConfigInResponse}
                onNewConfigClose={() => {
                  setShowNewConfigInResponse(false);
                  setSidebarKey(prev => prev + 1);
                }}
                configResponses={configResponses}
                generatingConfigs={generatingConfigs}
                currentPrompt={editingPromptId ? getPromptById(editingPromptId) : undefined}
                onVersionChange={handleVersionChange}
                onConfigSave={handleConfigSaveAndRefresh}
                onDataSetChange={setSelectedDataSetId}
                selectedDataSetId={selectedDataSetId}
                selectedDataSet={selectedDataSetId ? getDataSetById(selectedDataSetId) : null}
                onNewDataSet={handleNewDataSet}
                onNewModelConfig={handleNewModelConfig}
              />
            )
          }
        />
      </div>
    </div>
  );
}
