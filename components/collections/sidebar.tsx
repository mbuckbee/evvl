'use client';

import { useState, useEffect } from 'react';
import { PlusIcon, FolderIcon, DocumentTextIcon, ChevronRightIcon, ChevronDownIcon, SparklesIcon, CogIcon } from '@heroicons/react/24/outline';
import { v4 as uuidv4 } from 'uuid';
import { Project, Prompt, ProjectModelConfig } from '@/lib/types';
import {
  loadProjects,
  loadUIState,
  saveUIState,
  saveProject,
  getPromptsByProjectId,
  getModelConfigsByProjectId,
} from '@/lib/storage';
import { migrateEvalHistory, isMigrationComplete } from '@/lib/migration';

interface SidebarProps {
  onRequestSelect?: (requestId: string) => void;
  onNewRequest?: () => void;
  onProjectSelect?: (projectId: string) => void;
  onNewPrompt?: (projectId: string) => void;
  onPromptSelect?: (promptId: string, shouldEdit?: boolean) => void;
  onNewModelConfig?: (projectId: string) => void;
  onModelConfigSelect?: (configId: string, shouldEdit?: boolean) => void;
}

export default function Sidebar({ onRequestSelect, onNewRequest, onProjectSelect, onNewPrompt, onPromptSelect, onNewModelConfig, onModelConfigSelect }: SidebarProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [openProjects, setOpenProjects] = useState<string[]>([]);

  // Load projects and run migration on mount
  useEffect(() => {
    // Run migration if not completed
    if (!isMigrationComplete()) {
      migrateEvalHistory();
    }

    // Load projects
    const loadedProjects = loadProjects();
    setProjects(loadedProjects);

    // Load UI state
    const uiState = loadUIState();
    setOpenProjects(uiState.openProjects || []);

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
      setOpenProjects([defaultProject.id]);
    }
  }, []);

  // Save UI state when open projects change
  useEffect(() => {
    const uiState = loadUIState();
    saveUIState({ ...uiState, openProjects });
  }, [openProjects]);

  const toggleProject = (projectId: string) => {
    setOpenProjects(prev =>
      prev.includes(projectId)
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    );
  };

  const handleProjectClick = (projectId: string) => {
    if (onProjectSelect) {
      onProjectSelect(projectId);
    }
  };

  const handleNewProject = () => {
    const newProject: Project = {
      id: uuidv4(),
      name: `New Project ${projects.length + 1}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      promptIds: [],
      modelConfigIds: [],
      dataSetIds: [],
    };
    saveProject(newProject);
    setProjects([...projects, newProject]);
    setOpenProjects([...openProjects, newProject.id]);
  };

  const handlePromptClick = (promptId: string, e: React.MouseEvent) => {
    if (onPromptSelect) {
      const shouldEdit = e.button === 2 || e.shiftKey; // Right-click or Shift+Click to edit
      onPromptSelect(promptId, shouldEdit);
    }
  };

  const handleNewPromptClick = (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent project toggle
    if (onNewPrompt) {
      onNewPrompt(projectId);
    }
  };

  const handleModelConfigClick = (configId: string, e: React.MouseEvent) => {
    if (onModelConfigSelect) {
      const shouldEdit = e.button === 2 || e.shiftKey; // Right-click or Shift+Click to edit
      onModelConfigSelect(configId, shouldEdit);
    }
  };

  const handleNewModelConfigClick = (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent project toggle
    if (onNewModelConfig) {
      onNewModelConfig(projectId);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Projects
          </h2>
          <button
            onClick={handleNewProject}
            className="flex items-center gap-1 px-2 py-1 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
          >
            <PlusIcon className="h-4 w-4" />
            New
          </button>
        </div>
      </div>

      {/* Projects List */}
      <div className="flex-1 overflow-y-auto">
        {projects.map((project) => {
          const prompts = getPromptsByProjectId(project.id);
          const modelConfigs = getModelConfigsByProjectId(project.id);
          const isOpen = openProjects.includes(project.id);

          return (
            <div key={project.id} className="border-b border-gray-200 dark:border-gray-700">
              {/* Project Header */}
              <button
                onClick={() => toggleProject(project.id)}
                className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
              >
                {isOpen ? (
                  <ChevronDownIcon className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronRightIcon className="h-4 w-4 text-gray-500" />
                )}
                <FolderIcon className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {project.name}
                </span>
                <span className="ml-auto text-xs text-gray-500">
                  {prompts.length + modelConfigs.length}
                </span>
              </button>

              {/* Prompts and Model Configs List */}
              {isOpen && (
                <div className="bg-gray-50 dark:bg-gray-800">
                  {/* Prompts Section */}
                  <div className="border-b border-gray-200 dark:border-gray-700">
                    {/* New Prompt Button */}
                    <button
                      onClick={(e) => handleNewPromptClick(project.id, e)}
                      className="w-full flex items-center gap-2 px-4 pl-10 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left group"
                    >
                      <SparklesIcon className="h-4 w-4 text-blue-500" />
                      <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                        New Prompt
                      </span>
                    </button>

                    {/* Prompts */}
                    {prompts.length > 0 ? (
                      prompts.map((prompt) => (
                        <button
                          key={prompt.id}
                          onClick={(e) => handlePromptClick(prompt.id, e)}
                          onContextMenu={(e) => {
                            e.preventDefault();
                            handlePromptClick(prompt.id, e);
                          }}
                          className="w-full flex items-center gap-2 px-4 pl-10 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left group"
                          title="Click to load, Right-click or Shift+Click to edit"
                        >
                          <DocumentTextIcon className="h-4 w-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" />
                          <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">
                            {prompt.name}
                          </span>
                        </button>
                      ))
                    ) : (
                      <div className="px-4 pl-10 py-2 text-xs text-gray-500 dark:text-gray-400 italic">
                        No prompts yet
                      </div>
                    )}
                  </div>

                  {/* Model Configs Section */}
                  <div>
                    {/* New Model Config Button */}
                    <button
                      onClick={(e) => handleNewModelConfigClick(project.id, e)}
                      className="w-full flex items-center gap-2 px-4 pl-10 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left group"
                    >
                      <CogIcon className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                        New Model Config
                      </span>
                    </button>

                    {/* Model Configs */}
                    {modelConfigs.length > 0 ? (
                      modelConfigs.map((config) => (
                        <button
                          key={config.id}
                          onClick={(e) => handleModelConfigClick(config.id, e)}
                          onContextMenu={(e) => {
                            e.preventDefault();
                            handleModelConfigClick(config.id, e);
                          }}
                          className="w-full flex items-center gap-2 px-4 pl-10 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left group"
                          title="Click to load, Right-click or Shift+Click to edit"
                        >
                          <CogIcon className="h-4 w-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" />
                          <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">
                            {config.name}
                          </span>
                        </button>
                      ))
                    ) : (
                      <div className="px-4 pl-10 py-2 text-xs text-gray-500 dark:text-gray-400 italic">
                        No model configs yet
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center justify-between">
          <span>{projects.reduce((acc, p) => acc + getPromptsByProjectId(p.id).length, 0)} prompts</span>
          <span>{projects.length} projects</span>
        </div>
      </div>
    </div>
  );
}
