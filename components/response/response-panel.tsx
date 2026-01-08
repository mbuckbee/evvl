'use client';

import { useState, useEffect, useRef } from 'react';
import { ClockIcon, CpuChipIcon, PhotoIcon, DocumentTextIcon, Cog6ToothIcon, XMarkIcon, Squares2X2Icon, ViewColumnsIcon, SquaresPlusIcon, ChevronDownIcon, PlusIcon, TableCellsIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import Link from 'next/link';
import { loadApiKeys, loadModelConfigs, deleteModelConfig, getModelConfigById, getDataSetsByProjectId } from '@/lib/storage';
import { ProjectModelConfig, Prompt, ApiKeys, DataSet } from '@/lib/types';
import ConfigEditor from '@/components/model-configs/config-editor';

import { AIOutput } from '@/lib/types';

// Helper function to format latency in seconds
function formatLatency(latencyMs: number): string {
  const seconds = Math.round(latencyMs / 1000);
  return seconds < 1 ? '1' : seconds.toString();
}

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
  showNewConfigEditor?: boolean;
  onNewConfigClose?: () => void;
  configResponses?: Record<string, AIOutput[]>;
  generatingConfigs?: Record<string, boolean>;
  currentPrompt?: Prompt;
  onVersionChange?: (configId: string, versionId: string) => void;
  onConfigSave?: (configId: string) => void;
  onDataSetChange?: (dataSetId: string | null) => void;
  selectedDataSetId?: string | null;
  selectedDataSet?: DataSet | null;
  onNewDataSet?: (projectId: string) => void;
  onNewModelConfig?: (projectId: string) => void;
}

type LayoutType = 'grid' | 'columns' | 'stacked' | 'table';

// Map provider to icon name
const providerIconMap: Record<string, string> = {
  openai: 'chatgpt',
  anthropic: 'claude',
  gemini: 'gemini',
  openrouter: 'openrouter',
};

export default function ResponsePanel({ output, isGenerating = false, projectId, highlightedConfigId, showNewConfigEditor, onNewConfigClose, configResponses = {}, generatingConfigs = {}, currentPrompt, onVersionChange, onConfigSave, onDataSetChange, selectedDataSetId: propSelectedDataSetId, selectedDataSet, onNewDataSet, onNewModelConfig }: ResponsePanelProps) {
  const [apiKeys, setApiKeys] = useState<ApiKeys>({});
  const [layout, setLayout] = useState<LayoutType>('grid');
  const [modelConfigs, setModelConfigs] = useState<ProjectModelConfig[]>([]);
  const [editingConfigId, setEditingConfigId] = useState<string | null>(null);
  const [selectedVersions, setSelectedVersions] = useState<Record<string, string>>({});
  const [openVersionDropdowns, setOpenVersionDropdowns] = useState<Record<string, boolean>>({});
  const [dataSets, setDataSets] = useState<DataSet[]>([]);
  const [isDataSetDropdownOpen, setIsDataSetDropdownOpen] = useState(false);

  const selectedDataSetId = propSelectedDataSetId ?? null;

  useEffect(() => {
    setApiKeys(loadApiKeys());
    setModelConfigs(loadModelConfigs());
    if (projectId) {
      const projectDataSets = getDataSetsByProjectId(projectId);
      setDataSets(projectDataSets);
    }
  }, [projectId]); // Reload when projectId changes

  // Initialize selected versions to "latest" when prompt changes
  useEffect(() => {
    if (currentPrompt && modelConfigs.length > 0) {
      const newSelectedVersions: Record<string, string> = {};
      modelConfigs.forEach(config => {
        if (!selectedVersions[config.id]) {
          newSelectedVersions[config.id] = 'latest';
        }
      });

      if (Object.keys(newSelectedVersions).length > 0) {
        setSelectedVersions(prev => ({ ...prev, ...newSelectedVersions }));
      }
    }
  }, [currentPrompt, modelConfigs]);

  const handleDeleteConfig = (configId: string, configName: string) => {
    if (confirm(`Are you sure you want to remove "${configName}" from this project?`)) {
      deleteModelConfig(configId);
      // Reload model configs after deletion
      setModelConfigs(loadModelConfigs());
    }
  };

  const handleVersionChange = (configId: string, versionId: string) => {
    setSelectedVersions(prev => ({ ...prev, [configId]: versionId }));
    setOpenVersionDropdowns(prev => ({ ...prev, [configId]: false }));
    if (onVersionChange) {
      onVersionChange(configId, versionId);
    }
  };

  const toggleVersionDropdown = (configId: string) => {
    setOpenVersionDropdowns(prev => ({ ...prev, [configId]: !prev[configId] }));
  };

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.version-dropdown')) {
        setOpenVersionDropdowns({});
      }
      if (!target.closest('.dataset-dropdown')) {
        setIsDataSetDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!output && !isGenerating) {
    // Filter configs by project if projectId is provided
    const filteredConfigs = projectId
      ? modelConfigs.filter(c => c.projectId === projectId)
      : modelConfigs;

    const layoutOptions = [
      { type: 'grid' as LayoutType, icon: Squares2X2Icon, label: 'Grid' },
      { type: 'columns' as LayoutType, icon: ViewColumnsIcon, label: 'Columns' },
      { type: 'stacked' as LayoutType, icon: SquaresPlusIcon, label: 'Stacked' },
      { type: 'table' as LayoutType, icon: TableCellsIcon, label: 'Table' },
    ];

    return (
      <div className="h-full flex flex-col bg-white dark:bg-gray-900">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Responses</h2>

          <div className="flex items-center gap-3">
            {/* Add Model Config Button */}
            {projectId && onNewModelConfig && (
              <button
                onClick={() => onNewModelConfig(projectId)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 rounded-md transition-colors"
              >
                <PlusIcon className="h-4 w-4" />
                <span>Add Model Config</span>
              </button>
            )}

            {/* Data Set Dropdown or Add Button */}
            {dataSets.length > 0 ? (
              <div className="flex items-center gap-2 dataset-dropdown">
                <span className="text-sm text-gray-600 dark:text-gray-300">Dataset:</span>
                <div className="relative">
                  <button
                    onClick={() => setIsDataSetDropdownOpen(!isDataSetDropdownOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <span>{selectedDataSetId ? dataSets.find(ds => ds.id === selectedDataSetId)?.name : 'No data set'}</span>
                    <ChevronDownIcon className="h-4 w-4" />
                  </button>

                  {isDataSetDropdownOpen && (
                    <div className="absolute top-full right-0 mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-10">
                      <button
                        onClick={() => {
                          if (onDataSetChange) onDataSetChange(null);
                          setIsDataSetDropdownOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        No data set
                      </button>
                      {dataSets.map(dataSet => (
                        <button
                          key={dataSet.id}
                          onClick={() => {
                            if (onDataSetChange) onDataSetChange(dataSet.id);
                            setIsDataSetDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                            selectedDataSetId === dataSet.id
                              ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                        >
                          {dataSet.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : projectId && onNewDataSet ? (
              <button
                onClick={() => onNewDataSet(projectId)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 rounded-md transition-colors"
              >
                <PlusIcon className="h-4 w-4" />
                <span>Add Dataset</span>
              </button>
            ) : null}

            {/* Layout Switcher */}
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            {layoutOptions.map((option) => {
              const IconComponent = option.icon;
              return (
                <button
                  key={option.type}
                  onClick={() => setLayout(option.type)}
                  className={`p-2 rounded-md transition-colors relative group ${
                    layout === option.type
                      ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
                  }`}
                >
                  <IconComponent className="h-5 w-5" />
                  <span className="absolute top-full left-1/2 -translate-x-1/2 mt-2 hidden group-hover:block px-2 py-1 text-xs text-white bg-gray-900 dark:bg-gray-700 rounded whitespace-nowrap pointer-events-none z-10">
                    {option.label}
                  </span>
                </button>
              );
            })}
            </div>
          </div>
        </div>

        {/* Model Configuration Cards or Table */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredConfigs.length === 0 && !showNewConfigEditor ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-600 dark:text-gray-300">
                <p className="text-lg mb-2">No model configs yet</p>
                <p className="text-sm">Create a model config to get started</p>
              </div>
            </div>
          ) : layout === 'table' ? (
            /* Table View - Each row is a dataset item (or single row if no dataset) with all model responses */
            <div className="space-y-6">
              {(selectedDataSetId && selectedDataSet && selectedDataSet.items.length > 0 ? selectedDataSet.items : [{ id: 'single', variables: {} }]).map((item, itemIndex) => {
                const firstColumnName = Object.keys(item.variables)[0];
                const label = firstColumnName && selectedDataSet ? item.variables[firstColumnName] : (selectedDataSet ? `Row ${itemIndex + 1}` : null);

                return (
                  <div key={item.id}>
                    {/* Dataset Item Label - only show if there's a dataset */}
                    {label && (
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 px-2">
                        {label}
                      </h3>
                    )}

                    {/* Model Config Responses in a row */}
                    <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${filteredConfigs.length}, minmax(300px, 1fr))` }}>
                      {filteredConfigs.map((config) => {
                        // If no dataset, show the first response (index 0), otherwise show response for this item
                        const responseIndex = selectedDataSet ? itemIndex : 0;
                        const response = configResponses[config.id]?.[responseIndex];
                        const isGenerating = generatingConfigs[config.id];
                        const hasKey = !!apiKeys[config.provider];
                        const iconName = providerIconMap[config.provider] || 'openrouter';

                        return (
                          <div
                            key={config.id}
                            className="border-2 border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 p-6"
                          >
                            {/* Header with model config info */}
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <Image
                                  src={`/series_icon/light/${iconName}.svg`}
                                  alt={config.name}
                                  width={32}
                                  height={32}
                                  className="dark:hidden w-8 h-8"
                                />
                                <Image
                                  src={`/series_icon/dark/${iconName}.svg`}
                                  alt={config.name}
                                  width={32}
                                  height={32}
                                  className="hidden dark:block w-8 h-8"
                                />
                                <div>
                                  <h4 className="text-base font-semibold text-gray-900 dark:text-white">
                                    {config.name}
                                  </h4>
                                  <p className="text-xs text-gray-600 dark:text-gray-300">
                                    {config.model}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Response Content */}
                            <div className="py-4">
                              {isGenerating ? (
                                <div className="text-center py-8">
                                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent mb-2" />
                                  <p className="text-xs text-gray-600 dark:text-gray-300">Generating...</p>
                                </div>
                              ) : response ? (
                                <div>
                                  {response.error ? (
                                    <div className="text-red-600 dark:text-red-400 text-sm">
                                      Error: {response.error}
                                    </div>
                                  ) : response.type === 'image' && response.imageUrl ? (
                                    <div>
                                      <img
                                        src={response.imageUrl}
                                        alt="Generated"
                                        className="rounded-lg mb-3 w-full h-auto"
                                      />
                                      {response.content && (
                                        <p className="text-sm text-gray-600 dark:text-gray-300 italic mb-2">
                                          {response.content}
                                        </p>
                                      )}
                                      {response.latency && (
                                        <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-300">
                                          <ClockIcon className="h-3 w-3" />
                                          {formatLatency(response.latency)}s
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <div>
                                      <div className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap mb-3">
                                        {response.content}
                                      </div>
                                      <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-300">
                                        {response.tokens && (
                                          <div className="flex items-center gap-1">
                                            <CpuChipIcon className="h-3 w-3" />
                                            {response.tokens}
                                          </div>
                                        )}
                                        {response.latency && (
                                          <div className="flex items-center gap-1">
                                            <ClockIcon className="h-3 w-3" />
                                            {formatLatency(response.latency)}s
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ) : hasKey ? (
                                <div className="text-center text-sm text-gray-600 dark:text-gray-300">
                                  Save and refresh prompt to view output
                                </div>
                              ) : (
                                <div className="text-center">
                                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
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
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Card Views */
            <div className={
              layout === 'grid' ? 'grid grid-cols-2 gap-4' :
              layout === 'columns' ? 'grid grid-cols-4 gap-4' :
              'flex flex-col gap-4'
            }>
              {/* New Config Editor - shown first when creating */}
              {showNewConfigEditor && projectId && (
                <div className="border-2 border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  <ConfigEditor
                    projectId={projectId}
                    config={undefined}
                    onSave={() => {
                      setModelConfigs(loadModelConfigs());
                      onNewConfigClose?.();
                    }}
                    onCancel={onNewConfigClose}
                  />
                </div>
              )}

              {filteredConfigs.map((config) => {
                const hasKey = !!apiKeys[config.provider];
                const isCompact = layout === 'columns';
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
                          if (onConfigSave) {
                            onConfigSave(config.id);
                          }
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
                    } ${
                      isHighlighted ? 'ring-4 ring-blue-500 animate-pulse' : ''
                    } transition-all duration-300`}
                  >
                    {/* Header with icon, name, and actions */}
                    <div className="flex items-start justify-between mb-4">
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
                          <p className="text-xs text-gray-600 dark:text-gray-300">
                            {config.model}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {/* Version Dropdown */}
                        {currentPrompt && currentPrompt.versions.length > 0 && (
                          <div className="relative version-dropdown">
                            <button
                              onClick={() => toggleVersionDropdown(config.id)}
                              className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-1"
                              title="Select prompt version"
                            >
                              <span>
                                {selectedVersions[config.id] === 'latest' || !selectedVersions[config.id]
                                  ? 'Latest'
                                  : `v${currentPrompt.versions.find(v => v.id === selectedVersions[config.id])?.versionNumber || '?'}`}
                              </span>
                              <ChevronDownIcon className={`h-3 w-3 transition-transform ${openVersionDropdowns[config.id] ? 'rotate-180' : ''}`} />
                            </button>

                            {/* Dropdown Menu */}
                            {openVersionDropdowns[config.id] && (
                              <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg z-10 max-h-60 overflow-y-auto">
                                {/* Latest option */}
                                <button
                                  onClick={() => handleVersionChange(config.id, 'latest')}
                                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 border-b border-gray-200 dark:border-gray-700 ${
                                    selectedVersions[config.id] === 'latest' || !selectedVersions[config.id]
                                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                                      : 'text-gray-900 dark:text-white'
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="font-medium">Latest</span>
                                    {(selectedVersions[config.id] === 'latest' || !selectedVersions[config.id]) && (
                                      <span className="text-xs">✓</span>
                                    )}
                                  </div>
                                  <div className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">
                                    Always use newest version
                                  </div>
                                </button>

                                {/* Specific versions */}
                                {currentPrompt.versions
                                  .sort((a, b) => b.versionNumber - a.versionNumber)
                                  .map((version) => (
                                    <button
                                      key={version.id}
                                      onClick={() => handleVersionChange(config.id, version.id)}
                                      className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 ${
                                        selectedVersions[config.id] === version.id
                                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                                          : 'text-gray-900 dark:text-white'
                                      }`}
                                    >
                                      <div className="flex items-center justify-between">
                                        <span className="font-medium">v{version.versionNumber}</span>
                                        {selectedVersions[config.id] === version.id && (
                                          <span className="text-xs">✓</span>
                                        )}
                                      </div>
                                      {version.note && (
                                        <div className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">
                                          {version.note}
                                        </div>
                                      )}
                                    </button>
                                  ))}
                              </div>
                            )}
                          </div>
                        )}

                        <button
                          onClick={() => setEditingConfigId(config.id)}
                          className="p-0 border-0 bg-transparent relative group"
                        >
                          <Cog6ToothIcon className="h-5 w-5 text-gray-600 dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-100 cursor-pointer" />
                          <span className="absolute bottom-full right-0 mb-2 hidden group-hover:block px-2 py-1 text-xs text-white bg-gray-900 dark:bg-gray-700 rounded whitespace-nowrap pointer-events-none">
                            Modify config
                          </span>
                        </button>
                        <button
                          onClick={() => handleDeleteConfig(config.id, config.name)}
                          className="p-0 border-0 bg-transparent relative group"
                        >
                          <XMarkIcon className="h-5 w-5 text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 cursor-pointer transition-colors" />
                          <span className="absolute bottom-full right-0 mb-2 hidden group-hover:block px-2 py-1 text-xs text-white bg-gray-900 dark:bg-gray-700 rounded whitespace-nowrap pointer-events-none">
                            Remove config
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Response Content or Status */}
                    <div className={`${isCompact ? 'py-4' : 'py-4'}`}>
                        {generatingConfigs[config.id] ? (
                          // Loading state
                          <div className="text-center py-8">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent mb-2" />
                            <p className="text-xs text-gray-600 dark:text-gray-300">Generating...</p>
                          </div>
                        ) : configResponses[config.id] && configResponses[config.id].length > 0 ? (
                          // Show responses
                          <div className="space-y-4">
                            {configResponses[config.id].map((response, index) => {
                              // Skip null responses but keep the index
                              if (!response) return null;

                              // Get label from first column of data set
                              let label = `Row ${index + 1}`;
                              if (selectedDataSet && selectedDataSet.items[index]) {
                                const item = selectedDataSet.items[index];
                                const firstColumnName = Object.keys(item.variables)[0];
                                if (firstColumnName) {
                                  label = item.variables[firstColumnName] || label;
                                }
                              }

                              return (
                              <div key={index} className="space-y-2">
                                {selectedDataSetId && configResponses[config.id].length > 1 && (
                                  <div className="text-xs font-medium text-gray-600 dark:text-gray-300 pb-1">
                                    {label}
                                  </div>
                                )}
                                {response.error ? (
                                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-3">
                                    <p className="text-xs text-red-700 dark:text-red-300">{response.error}</p>
                                  </div>
                                ) : response.type === 'image' && response.imageUrl ? (
                                  <>
                                    {/* Image display */}
                                    <div className="bg-gray-100 dark:bg-gray-800 rounded overflow-hidden">
                                      <img
                                        src={response.imageUrl}
                                        alt="Generated image"
                                        className="w-full h-auto"
                                      />
                                    </div>
                                    {response.content && (
                                      <div className="text-xs text-gray-600 dark:text-gray-300 italic">
                                        {response.content}
                                      </div>
                                    )}
                                    <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
                                      {response.latency !== undefined && (
                                        <span>{formatLatency(response.latency)}s</span>
                                      )}
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <div className="text-xs text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-900 p-3 rounded border border-gray-200 dark:border-gray-700 max-h-32 overflow-y-auto">
                                      {response.content}
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
                                      {response.tokens !== undefined && (
                                        <span>{response.tokens} tokens</span>
                                      )}
                                      {response.latency !== undefined && (
                                        <span>{formatLatency(response.latency)}s</span>
                                      )}
                                    </div>
                                  </>
                                )}
                              </div>
                            );
                            })}
                          </div>
                        ) : hasKey ? (
                          // API key configured, waiting for generation
                          <div className="text-center text-sm text-gray-600 dark:text-gray-300">
                            Save and refresh prompt to view output
                          </div>
                        ) : (
                          // No API key
                          <div className="text-center">
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
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
          <p className="text-sm text-gray-600 dark:text-gray-300">Generating response...</p>
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
          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
            {output?.tokens !== undefined && (
              <div className="flex items-center gap-1.5">
                <CpuChipIcon className="h-4 w-4" />
                <span>{output.tokens.toLocaleString()} tokens</span>
              </div>
            )}
            {output?.latency !== undefined && (
              <div className="flex items-center gap-1.5">
                <ClockIcon className="h-4 w-4" />
                <span>{formatLatency(output.latency)}s</span>
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
                <p className="text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
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
