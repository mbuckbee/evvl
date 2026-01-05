'use client';

import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { PlusIcon, FolderIcon, DocumentTextIcon, ChevronRightIcon, ChevronDownIcon, SparklesIcon, CogIcon, TableCellsIcon } from '@heroicons/react/24/outline';
import { Project, Prompt, ProjectModelConfig, DataSet } from '@/lib/types';
import {
  loadProjects,
  loadUIState,
  saveUIState,
  saveProject,
  getPromptsByProjectId,
  getModelConfigsByProjectId,
  getDataSetsByProjectId,
  loadPrompts,
  loadModelConfigs,
  loadDataSets,
} from '@/lib/storage';
import { migrateEvalHistory, isMigrationComplete } from '@/lib/migration';

interface SidebarProps {
  onNewProject?: () => void;
  onProjectSelect?: (projectId: string) => void;
  onNewPrompt?: (projectId: string) => void;
  onPromptSelect?: (promptId: string, shouldEdit?: boolean) => void;
  onNewModelConfig?: (projectId: string) => void;
  onModelConfigSelect?: (configId: string, shouldEdit?: boolean) => void;
  onNewDataSet?: (projectId: string) => void;
  onDataSetSelect?: (dataSetId: string, shouldEdit?: boolean) => void;
}

export default function Sidebar({ onNewProject, onProjectSelect, onNewPrompt, onPromptSelect, onNewModelConfig, onModelConfigSelect, onNewDataSet, onDataSetSelect }: SidebarProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [allPrompts, setAllPrompts] = useState<Prompt[]>([]);
  const [allModelConfigs, setAllModelConfigs] = useState<ProjectModelConfig[]>([]);
  const [allDataSets, setAllDataSets] = useState<DataSet[]>([]);
  const [openSections, setOpenSections] = useState<string[]>(['prompts']); // Default to prompts section open

  // Load all data on mount
  useEffect(() => {
    // Run migration if not completed
    if (!isMigrationComplete()) {
      migrateEvalHistory();
    }

    // Load projects
    const loadedProjects = loadProjects();
    setProjects(loadedProjects);

    // Load all prompts, configs, and datasets
    setAllPrompts(loadPrompts());
    setAllModelConfigs(loadModelConfigs());
    setAllDataSets(loadDataSets());

    // If no projects exist, create a default one
    if (loadedProjects.length === 0) {
      const defaultProject: Project = {
        id: uuidv4(),
        name: 'My Project',
        description: 'Get started by creating prompts and model configs',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        promptIds: [],
        modelConfigIds: [],
        dataSetIds: [],
      };
      saveProject(defaultProject);
      setProjects([defaultProject]);
    }
  }, []);

  const toggleSection = (section: string) => {
    setOpenSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const handleProjectClick = (projectId: string) => {
    if (onProjectSelect) {
      onProjectSelect(projectId);
    }
  };

  const handleNewProjectClick = () => {
    if (onNewProject) {
      onNewProject();
    }
  };

  const handlePromptClick = (promptId: string, e: React.MouseEvent) => {
    if (onPromptSelect) {
      const shouldEdit = e.button === 2 || e.shiftKey;
      onPromptSelect(promptId, shouldEdit);
    }
  };

  const handleNewPromptClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onNewPrompt && projects.length > 0) {
      onNewPrompt(projects[0].id); // Use first project for now
    }
  };

  const handleModelConfigClick = (configId: string, e: React.MouseEvent) => {
    if (onModelConfigSelect) {
      const shouldEdit = e.button === 2 || e.shiftKey;
      onModelConfigSelect(configId, shouldEdit);
    }
  };

  const handleNewModelConfigClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onNewModelConfig && projects.length > 0) {
      onNewModelConfig(projects[0].id); // Use first project for now
    }
  };

  const handleDataSetClick = (dataSetId: string, e: React.MouseEvent) => {
    if (onDataSetSelect) {
      const shouldEdit = e.button === 2 || e.shiftKey;
      onDataSetSelect(dataSetId, shouldEdit);
    }
  };

  const handleNewDataSetClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onNewDataSet && projects.length > 0) {
      onNewDataSet(projects[0].id); // Use first project for now
    }
  };

  const getProjectName = (projectId: string) => {
    return projects.find(p => p.id === projectId)?.name || 'Unknown Project';
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      {/* Projects Section */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <div className="px-4 py-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
            Projects
          </h2>
          <button
            onClick={handleNewProjectClick}
            className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors"
          >
            <PlusIcon className="h-3 w-3" />
            New
          </button>
        </div>
        <div className="pb-2">
          {projects.map((project) => (
            <button
              key={project.id}
              onClick={() => handleProjectClick(project.id)}
              className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
            >
              <FolderIcon className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">
                {project.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable Sections */}
      <div className="flex-1 overflow-y-auto">
        {/* Prompts Section */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="w-full px-4 py-3 flex items-center justify-between">
            <button
              onClick={() => toggleSection('prompts')}
              className="flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex-1"
            >
              {openSections.includes('prompts') ? (
                <ChevronDownIcon className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronRightIcon className="h-4 w-4 text-gray-500" />
              )}
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
                Prompts
              </h3>
            </button>
            <button
              onClick={handleNewPromptClick}
              className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
            >
              <PlusIcon className="h-3 w-3" />
              New
            </button>
          </div>

          {openSections.includes('prompts') && (
            <div className="bg-gray-50 dark:bg-gray-800">
              {/* Prompts List */}
              {allPrompts.length > 0 ? (
                allPrompts.map((prompt) => (
                  <button
                    key={prompt.id}
                    onClick={(e) => handlePromptClick(prompt.id, e)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      handlePromptClick(prompt.id, e);
                    }}
                    className="w-full px-4 pl-8 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left group"
                  >
                    <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">
                      {prompt.name}
                    </span>
                  </button>
                ))
              ) : (
                <div className="px-4 pl-8 py-2 text-xs text-gray-500 dark:text-gray-400 italic">
                  No prompts yet
                </div>
              )}
            </div>
          )}
        </div>

        {/* Model Configs Section */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="w-full px-4 py-3 flex items-center justify-between">
            <button
              onClick={() => toggleSection('configs')}
              className="flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex-1"
            >
              {openSections.includes('configs') ? (
                <ChevronDownIcon className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronRightIcon className="h-4 w-4 text-gray-500" />
              )}
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
                Model Configs
              </h3>
            </button>
            <button
              onClick={handleNewModelConfigClick}
              className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 transition-colors"
            >
              <PlusIcon className="h-3 w-3" />
              New
            </button>
          </div>

          {openSections.includes('configs') && (
            <div className="bg-gray-50 dark:bg-gray-800">
              {/* Model Configs List */}
              {allModelConfigs.length > 0 ? (
                allModelConfigs.map((config) => (
                  <button
                    key={config.id}
                    onClick={(e) => handleModelConfigClick(config.id, e)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      handleModelConfigClick(config.id, e);
                    }}
                    className="w-full px-4 pl-8 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left group"
                  >
                    <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">
                      {config.name}
                    </span>
                  </button>
                ))
              ) : (
                <div className="px-4 pl-8 py-2 text-xs text-gray-500 dark:text-gray-400 italic">
                  No model configs yet
                </div>
              )}
            </div>
          )}
        </div>

        {/* Data Sets Section */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="w-full px-4 py-3 flex items-center justify-between">
            <button
              onClick={() => toggleSection('datasets')}
              className="flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex-1"
            >
              {openSections.includes('datasets') ? (
                <ChevronDownIcon className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronRightIcon className="h-4 w-4 text-gray-500" />
              )}
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
                Data Sets
              </h3>
            </button>
            <button
              onClick={handleNewDataSetClick}
              className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
            >
              <PlusIcon className="h-3 w-3" />
              New
            </button>
          </div>

          {openSections.includes('datasets') && (
            <div className="bg-gray-50 dark:bg-gray-800">
              {/* Data Sets List */}
              {allDataSets.length > 0 ? (
                allDataSets.map((dataSet) => (
                  <button
                    key={dataSet.id}
                    onClick={(e) => handleDataSetClick(dataSet.id, e)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      handleDataSetClick(dataSet.id, e);
                    }}
                    className="w-full px-4 pl-8 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left group"
                  >
                    <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">
                      {dataSet.name}
                    </span>
                  </button>
                ))
              ) : (
                <div className="px-4 pl-8 py-2 text-xs text-gray-500 dark:text-gray-400 italic">
                  No data sets yet
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
