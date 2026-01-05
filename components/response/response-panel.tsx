'use client';

import { useState, useEffect } from 'react';
import { ClockIcon, CpuChipIcon, PhotoIcon, DocumentTextIcon, Cog6ToothIcon, XMarkIcon, Squares2X2Icon, ViewColumnsIcon, Bars3Icon, SquaresPlusIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import { loadApiKeys, loadModelConfigs, deleteModelConfig, getModelConfigById } from '@/lib/storage';
import { ProjectModelConfig } from '@/lib/types';
import ConfigEditor from '@/components/model-configs/config-editor';

interface ResponsePanelProps {
  output?: {
    content: string;
    imageUrl?: string;
    tokens?: number;
    latency?: number;
    error?: string;
    type?: 'text' | 'image';
  };
  isGenerating?: boolean;
  projectId?: string;
  highlightedConfigId?: string;
}

type LayoutType = 'grid' | 'columns' | 'rows' | 'stacked';

// Map provider to icon name
const providerIconMap: Record<string, string> = {
  openai: 'chatgpt',
  anthropic: 'claude',
  gemini: 'gemini',
  openrouter: 'openrouter',
};

export default function ResponsePanel({ output, isGenerating = false, projectId, highlightedConfigId }: ResponsePanelProps) {
  const [apiKeys, setApiKeys] = useState<Record<string, string | undefined>>({});
  const [layout, setLayout] = useState<LayoutType>('grid');
  const [modelConfigs, setModelConfigs] = useState<ProjectModelConfig[]>([]);
  const [editingConfigId, setEditingConfigId] = useState<string | null>(null);

  useEffect(() => {
    setApiKeys(loadApiKeys());
    setModelConfigs(loadModelConfigs());
  }, [projectId]); // Reload when projectId changes

  const handleDeleteConfig = (configId: string, configName: string) => {
    if (confirm(`Are you sure you want to remove "${configName}" from this project?`)) {
      deleteModelConfig(configId);
      // Reload model configs after deletion
      setModelConfigs(loadModelConfigs());
    }
  };

  if (!output && !isGenerating) {
    // Filter configs by project if projectId is provided
    const filteredConfigs = projectId
      ? modelConfigs.filter(c => c.projectId === projectId)
      : modelConfigs;

    const layoutOptions = [
      { type: 'grid' as LayoutType, icon: Squares2X2Icon, label: 'Grid' },
      { type: 'columns' as LayoutType, icon: ViewColumnsIcon, label: 'Columns' },
      { type: 'rows' as LayoutType, icon: Bars3Icon, label: 'Rows' },
      { type: 'stacked' as LayoutType, icon: SquaresPlusIcon, label: 'Stacked' },
    ];

    return (
      <div className="h-full flex flex-col bg-white dark:bg-gray-900">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Responses</h2>

          {/* Layout Switcher */}
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            {layoutOptions.map((option) => {
              const IconComponent = option.icon;
              return (
                <button
                  key={option.type}
                  onClick={() => setLayout(option.type)}
                  className={`p-2 rounded-md transition-colors ${
                    layout === option.type
                      ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                  title={option.label}
                >
                  <IconComponent className="h-5 w-5" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Model Configuration Cards */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredConfigs.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-500 dark:text-gray-400">
                <p className="text-lg mb-2">No model configs yet</p>
                <p className="text-sm">Create a model config to get started</p>
              </div>
            </div>
          ) : (
            <div className={
              layout === 'grid' ? 'grid grid-cols-2 gap-4' :
              layout === 'columns' ? 'grid grid-cols-4 gap-4' :
              layout === 'rows' ? 'flex flex-col gap-4' :
              'flex flex-col gap-4'
            }>
              {filteredConfigs.map((config) => {
                const hasKey = !!apiKeys[config.provider];
                const isCompact = layout === 'columns';
                const isRow = layout === 'rows';
                const iconName = providerIconMap[config.provider] || 'openrouter';
                const isHighlighted = highlightedConfigId === config.id;
                const isEditing = editingConfigId === config.id;

                // If this config is being edited, show the ConfigEditor instead
                if (isEditing && projectId) {
                  return (
                    <div key={config.id} className="border-2 border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                      <ConfigEditor
                        projectId={projectId}
                        config={config}
                        onSave={() => {
                          setEditingConfigId(null);
                          setModelConfigs(loadModelConfigs());
                        }}
                        onCancel={() => setEditingConfigId(null)}
                      />
                    </div>
                  );
                }

                return (
                  <div
                    key={config.id}
                    className={`border-2 border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 ${
                      isCompact ? 'p-4' : 'p-6'
                    } ${isRow ? 'flex items-center' : ''} ${
                      isHighlighted ? 'ring-4 ring-blue-500 animate-pulse' : ''
                    } transition-all duration-300`}
                  >
                    {/* Header with icon, name, and actions */}
                    <div className={`flex items-start justify-between ${isRow ? 'flex-1' : 'mb-4'}`}>
                      <div className="flex items-center gap-3">
                        {/* Light mode icon */}
                        <Image
                          src={`/series_icon/light/${iconName}.svg`}
                          alt={config.name}
                          width={32}
                          height={32}
                          className={`dark:hidden ${isCompact ? 'w-6 h-6' : 'w-8 h-8'}`}
                        />
                        {/* Dark mode icon */}
                        <Image
                          src={`/series_icon/dark/${iconName}.svg`}
                          alt={config.name}
                          width={32}
                          height={32}
                          className={`hidden dark:block ${isCompact ? 'w-6 h-6' : 'w-8 h-8'}`}
                        />
                        <div>
                          <h3 className={`font-semibold text-gray-900 dark:text-white ${isCompact ? 'text-sm' : ''}`}>
                            {config.name}
                          </h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {config.model}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEditingConfigId(config.id)}
                          className="p-0 border-0 bg-transparent"
                          title="Edit model config"
                        >
                          <Cog6ToothIcon className="h-5 w-5 text-gray-400 dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-100 cursor-pointer" />
                        </button>
                        <button
                          onClick={() => handleDeleteConfig(config.id, config.name)}
                          className="p-0 border-0 bg-transparent"
                          title="Remove model config"
                        >
                          <XMarkIcon className="h-5 w-5 text-gray-400 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 cursor-pointer transition-colors" />
                        </button>
                      </div>
                    </div>

                    {/* API Key Status */}
                    {!isRow && (
                      <div className={`text-center ${isCompact ? 'py-4' : 'py-8'}`}>
                        {hasKey ? (
                          <div className="text-sm text-green-600 dark:text-green-400">
                            ✓ API key configured
                          </div>
                        ) : (
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                              API key not configured
                            </p>
                            <Link
                              href="/settings"
                              className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                            >
                              Configure {config.provider} →
                            </Link>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Row layout status */}
                    {isRow && (
                      <div className="ml-auto flex items-center">
                        {hasKey ? (
                          <div className="text-sm text-green-600 dark:text-green-400">
                            ✓ Configured
                          </div>
                        ) : (
                          <Link
                            href="/settings"
                            className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                          >
                            Configure →
                          </Link>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (isGenerating) {
    return (
      <div className="h-full flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mb-4" />
          <p className="text-sm text-gray-600 dark:text-gray-400">Generating response...</p>
        </div>
      </div>
    );
  }

  if (output?.error) {
    return (
      <div className="h-full flex flex-col bg-white dark:bg-gray-900">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Response</h2>
        </div>

        {/* Error Content */}
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-400 mb-2">
                Error
              </h3>
              <p className="text-sm text-red-700 dark:text-red-300">{output.error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      {/* Header with Metadata */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Response</h2>
          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
            {output?.tokens !== undefined && (
              <div className="flex items-center gap-1.5">
                <CpuChipIcon className="h-4 w-4" />
                <span>{output.tokens.toLocaleString()} tokens</span>
              </div>
            )}
            {output?.latency !== undefined && (
              <div className="flex items-center gap-1.5">
                <ClockIcon className="h-4 w-4" />
                <span>{(output.latency / 1000).toFixed(2)}s</span>
              </div>
            )}
            {output?.type && (
              <div className="flex items-center gap-1.5">
                {output.type === 'image' ? (
                  <PhotoIcon className="h-4 w-4" />
                ) : (
                  <DocumentTextIcon className="h-4 w-4" />
                )}
                <span className="capitalize">{output.type}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {output?.type === 'image' && output.imageUrl ? (
          <div className="space-y-4">
            {/* Image Display */}
            <div className="relative bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
              <Image
                src={output.imageUrl}
                alt="Generated image"
                width={1024}
                height={1024}
                className="w-full h-auto"
                unoptimized
              />
            </div>

            {/* Revised Prompt (if available) */}
            {output.content && output.content !== output.imageUrl && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Revised Prompt
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  {output.content}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="prose dark:prose-invert max-w-none">
            <pre className="whitespace-pre-wrap font-sans text-sm text-gray-900 dark:text-white">
              {output?.content}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
